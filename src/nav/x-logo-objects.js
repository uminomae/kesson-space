import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { detectLang, t } from '../i18n.js';
import { toggles, gemParams, xLogoParams } from '../config.js';
import { getScrollProgress } from '../controls.js';
import { xLogoVertexShader, xLogoFragmentShader } from '../shaders/x-logo.glsl.js';
import {
    createGemGroupModel,
    rebuildGemState,
    updateGemGroupAnimation,
} from './gem.js';
import {
    createNavLabelButton,
    syncLabelFocusState,
    updateLabelPosition as updateSingleLabel,
} from './labels.js';
import { worldFromViewportHeight } from './responsive.js';

// DECISION: x-logo and gem are grouped because gem is now parented under the x-logo group and shares
// language updates, hover state, and label lifecycle with x-logo; splitting by this scene-local coupling is safer.
// (Phase B-1 / 2026-02-19)
// Issue #18 visual baseline (approved): x-logo / gem are operated as left-top fixed display.
// Keep this left-top anchored presentation unless a later issue explicitly requests a different layout.

const XLOGO_TARGET_VIEWPORT_X_PERCENT = 0.07;
const XLOGO_TARGET_VIEWPORT_Y_TOP_PERCENT = 0.18;
const XLOGO_VIEWPORT_EDGE_PADDING_PERCENT = 0.02;
const XLOGO_MOBILE_BREAKPOINT = 900;
const XLOGO_MOBILE_MIN_VIEWPORT_X_PERCENT = 0.06;
const XLOGO_MOBILE_MAX_VIEWPORT_X_PERCENT = 0.10;
const XLOGO_MOBILE_LEFT_GUTTER_PX = 36;
const XLOGO_MOBILE_TOP_PERCENT = 0.20;
const XLOGO_FOLLOW_LAG_SECONDS = 0.3;
const XLOGO_FOLLOW_MIN_DELTA_SECONDS = 1 / 240;
const XLOGO_FOLLOW_MAX_DELTA_SECONDS = 0.2;
const GEM_DESKTOP_ANCHOR = Object.freeze({ x: 0.0, y: -3.4, z: 0.2 });
const GEM_LEGACY_BASE_POSITION = Object.freeze({ x: 10, y: 2, z: 15 });

let _gemLabelElement = null;
let _gemGroup = null;
let _gemMesh = null;
let _xLogoLabelElement = null;
let _xLogoGroup = null;
let _xLogoMesh = null;
let _xLogoRoot = null;
let _xLogoMaterials = [];
let _xLogoHover = false;
let _xLogoCamera = null;
let _xLogoLastUpdateTime = null;

const _xLogoSolveVecA = new THREE.Vector3();
const _xLogoSolveVecB = new THREE.Vector3();
const _xLogoSolveVecC = new THREE.Vector3();
const _xLogoSolveMatrix = new THREE.Matrix4();
const _labelWorldPos = new THREE.Vector3();

function createGemGroup() {
    return createGemGroupModel(gemParams, (mesh) => {
        _gemMesh = mesh;
    });
}

function getGemDesktopLocalPosition() {
    return {
        x: GEM_DESKTOP_ANCHOR.x + (gemParams.posX - GEM_LEGACY_BASE_POSITION.x),
        y: GEM_DESKTOP_ANCHOR.y + (gemParams.posY - GEM_LEGACY_BASE_POSITION.y),
        z: GEM_DESKTOP_ANCHOR.z + (gemParams.posZ - GEM_LEGACY_BASE_POSITION.z),
    };
}

function applyGemDesktopPosition(group) {
    if (!group) return;
    const local = getGemDesktopLocalPosition();
    group.userData.baseY = local.y;
    group.position.set(local.x, local.y, local.z);
}

function getXLogoMaterialConfig() {
    const emissiveIntensity = Math.max(0.0, xLogoParams.glowStrength) * 0.45 + 0.12;
    const metalness = Math.min(0.9, Math.max(0.1, xLogoParams.rimPower / 10.0));
    const roughness = Math.min(0.88, Math.max(0.2, 1.0 - xLogoParams.innerGlow * 0.12));
    return { emissiveIntensity, metalness, roughness };
}

function applyXLogoMaterial(mesh) {
    const { emissiveIntensity, metalness, roughness } = getXLogoMaterialConfig();
    const baseColor = new THREE.Color(0.72, 0.77, 0.86);
    const emissiveColor = new THREE.Color(0.22, 0.28, 0.45);

    let mat = mesh.material;
    if (!mat || !mat.isMeshStandardMaterial) {
        mat = new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: emissiveColor,
            emissiveIntensity,
            metalness,
            roughness,
        });
    } else {
        mat.color.copy(baseColor);
        mat.emissive.copy(emissiveColor);
        mat.emissiveIntensity = emissiveIntensity;
        mat.metalness = metalness;
        mat.roughness = roughness;
    }

    mesh.material = mat;
    _xLogoMaterials.push(mat);
}

function createXLogoGroup() {
    const group = new THREE.Group();

    const hitMat = new THREE.SpriteMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
    });
    const hitSprite = new THREE.Sprite(hitMat);
    const hitSize = xLogoParams.meshScale * 3.0;
    hitSprite.scale.set(hitSize, hitSize, 1);
    group.add(hitSprite);

    _xLogoMaterials = [];
    _xLogoRoot = null;

    const loader = new GLTFLoader();
    loader.load(
        'assets/blender/x-logo.glb',
        (gltf) => {
            const root = gltf.scene;
            root.traverse((child) => {
                if (!child.isMesh) return;
                if (child.geometry) {
                    child.geometry.computeVertexNormals();
                }
                applyXLogoMaterial(child);
                child.renderOrder = 10;
            });

            root.scale.setScalar(xLogoParams.meshScale);
            group.add(root);

            _xLogoRoot = root;
            _xLogoMesh = root.children.find((c) => c.isMesh) || null;
            group.userData.xLogoRoot = root;
            group.userData.xLogoMesh = _xLogoMesh;
            group.userData.xLogoBaseRotY = root.rotation.y || 0;
        },
        undefined,
        (err) => {
            console.warn('[XLogo] GLTF load failed, using fallback plane:', err.message);
            const geom = new THREE.PlaneGeometry(2, 2);
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0.0 },
                    uGlowStrength: { value: xLogoParams.glowStrength },
                    uRimPower: { value: xLogoParams.rimPower },
                    uInnerGlow: { value: xLogoParams.innerGlow },
                    uHover: { value: 0.0 },
                },
                vertexShader: xLogoVertexShader,
                fragmentShader: xLogoFragmentShader,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide,
            });

            const mesh = new THREE.Mesh(geom, mat);
            mesh.scale.setScalar(xLogoParams.meshScale);
            mesh.renderOrder = 10;
            group.add(mesh);

            _xLogoMesh = mesh;
            group.userData.xLogoRoot = null;
            group.userData.xLogoMesh = mesh;
            group.userData.xLogoBaseRotY = 0;
        }
    );

    group.userData = {
        hitSprite,
        xLogoMesh: null,
        xLogoRoot: null,
        xLogoBaseRotY: 0,
        followInitialized: false,
    };
    applyXLogoGroupPosition(group, _xLogoCamera, { immediate: true });

    return group;
}

function getMobileXLogoViewportPercent() {
    if (typeof window === 'undefined' || !Number.isFinite(window.innerWidth) || window.innerWidth <= 0) {
        return XLOGO_TARGET_VIEWPORT_X_PERCENT;
    }
    const viewportWidth = Math.max(1, window.innerWidth);
    const fromLeftPxPercent = XLOGO_MOBILE_LEFT_GUTTER_PX / viewportWidth;
    const adaptiveByWidth = viewportWidth <= XLOGO_MOBILE_BREAKPOINT
        ? Math.max(fromLeftPxPercent, XLOGO_TARGET_VIEWPORT_X_PERCENT)
        : XLOGO_TARGET_VIEWPORT_X_PERCENT;
    return THREE.MathUtils.clamp(
        adaptiveByWidth,
        XLOGO_MOBILE_MIN_VIEWPORT_X_PERCENT,
        XLOGO_MOBILE_MAX_VIEWPORT_X_PERCENT
    );
}

function getXLogoViewportTopPercent() {
    if (typeof window === 'undefined' || !Number.isFinite(window.innerWidth)) {
        return XLOGO_TARGET_VIEWPORT_Y_TOP_PERCENT;
    }
    return window.innerWidth <= XLOGO_MOBILE_BREAKPOINT
        ? XLOGO_MOBILE_TOP_PERCENT
        : XLOGO_TARGET_VIEWPORT_Y_TOP_PERCENT;
}

function estimateXLogoHalfWidthWorld() {
    return Math.max(0.08, xLogoParams.meshScale * 0.55);
}

function estimateXLogoHalfHeightWorld() {
    return Math.max(0.08, xLogoParams.meshScale * 0.55);
}

function solveXLogoPosXForViewportPercent(camera, worldY, worldZ, viewportPercent) {
    if (!camera) return -Math.max(1, Math.abs(xLogoParams.posX));
    const targetNdcX = THREE.MathUtils.clamp((viewportPercent * 2) - 1, -0.95, 0.95);
    camera.updateMatrixWorld(true);
    _xLogoSolveMatrix.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
    const e = _xLogoSolveMatrix.elements;

    const a = e[0];
    const c = e[3];
    const b = (e[4] * worldY) + (e[8] * worldZ) + e[12];
    const d = (e[7] * worldY) + (e[11] * worldZ) + e[15];
    const denom = (targetNdcX * c) - a;
    if (!Number.isFinite(denom) || Math.abs(denom) < 1e-6) {
        return -Math.max(1, Math.abs(xLogoParams.posX));
    }

    const solved = (b - (targetNdcX * d)) / denom;
    return Number.isFinite(solved) ? solved : -Math.max(1, Math.abs(xLogoParams.posX));
}

function solveXLogoPosYForViewportTopPercent(camera, worldX, worldZ, viewportTopPercent) {
    if (!camera) return xLogoParams.posY;
    const topPercent = THREE.MathUtils.clamp(viewportTopPercent, 0.05, 0.95);
    const targetNdcY = THREE.MathUtils.clamp(1 - (topPercent * 2), -0.95, 0.95);
    camera.updateMatrixWorld(true);
    _xLogoSolveMatrix.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
    const e = _xLogoSolveMatrix.elements;

    const a = e[5];
    const c = e[7];
    const b = (e[1] * worldX) + (e[9] * worldZ) + e[13];
    const d = (e[3] * worldX) + (e[11] * worldZ) + e[15];
    const denom = (targetNdcY * c) - a;
    if (!Number.isFinite(denom) || Math.abs(denom) < 1e-6) {
        return xLogoParams.posY;
    }

    const solved = (b - (targetNdcY * d)) / denom;
    return Number.isFinite(solved) ? solved : xLogoParams.posY;
}

function getResponsiveXLogoPosition(camera = _xLogoCamera, worldY = xLogoParams.posY) {
    if (!camera || typeof camera.updateMatrixWorld !== 'function') {
        return {
            posX: -Math.max(1, Math.abs(xLogoParams.posX)),
            posY: worldY,
            posZ: xLogoParams.posZ,
        };
    }

    camera.updateMatrixWorld(true);
    _xLogoSolveVecA.set(xLogoParams.posX, worldY, xLogoParams.posZ).project(camera);
    const halfWorld = estimateXLogoHalfWidthWorld();
    _xLogoSolveVecB.set(xLogoParams.posX + halfWorld, worldY, xLogoParams.posZ).project(camera);
    const halfNdc = Math.abs(_xLogoSolveVecB.x - _xLogoSolveVecA.x);
    const halfPercent = halfNdc * 0.5;

    const minVisiblePercent = THREE.MathUtils.clamp(halfPercent + XLOGO_VIEWPORT_EDGE_PADDING_PERCENT, 0.04, 0.45);
    const maxVisiblePercent = 1 - minVisiblePercent;
    const targetXPercent = THREE.MathUtils.clamp(getMobileXLogoViewportPercent(), minVisiblePercent, maxVisiblePercent);

    const halfHeightWorld = estimateXLogoHalfHeightWorld();
    _xLogoSolveVecB.set(xLogoParams.posX, worldY + halfHeightWorld, xLogoParams.posZ).project(camera);
    const halfNdcY = Math.abs(_xLogoSolveVecB.y - _xLogoSolveVecA.y);
    const halfTopPercent = halfNdcY * 0.5;
    const minVisibleTopPercent = THREE.MathUtils.clamp(halfTopPercent + XLOGO_VIEWPORT_EDGE_PADDING_PERCENT, 0.04, 0.45);
    const maxVisibleTopPercent = 1 - minVisibleTopPercent;
    const targetYTopPercent = THREE.MathUtils.clamp(getXLogoViewportTopPercent(), minVisibleTopPercent, maxVisibleTopPercent);

    let solvedY = solveXLogoPosYForViewportTopPercent(camera, xLogoParams.posX, xLogoParams.posZ, targetYTopPercent);
    let solvedX = solveXLogoPosXForViewportPercent(camera, solvedY, xLogoParams.posZ, targetXPercent);
    solvedY = solveXLogoPosYForViewportTopPercent(camera, solvedX, xLogoParams.posZ, targetYTopPercent);

    // DECISION: restore a second-pass viewport clamp after solving.
    // KEPT: solver can drift on very narrow portrait aspect, so we re-project and clamp once more to keep x-logo/gem visible.
    // (mobile portrait clamp restore / 2026-02-19)
    _xLogoSolveVecC.set(solvedX, solvedY, xLogoParams.posZ).project(camera);
    const solvedXPercent = (_xLogoSolveVecC.x + 1) * 0.5;
    const solvedYTopPercent = (1 - _xLogoSolveVecC.y) * 0.5;
    const clampedSolvedXPercent = THREE.MathUtils.clamp(solvedXPercent, minVisiblePercent, maxVisiblePercent);
    const clampedSolvedYTopPercent = THREE.MathUtils.clamp(solvedYTopPercent, minVisibleTopPercent, maxVisibleTopPercent);
    const needsClampX = Math.abs(clampedSolvedXPercent - solvedXPercent) > 1e-4;
    const needsClampY = Math.abs(clampedSolvedYTopPercent - solvedYTopPercent) > 1e-4;

    if (needsClampY) {
        solvedY = solveXLogoPosYForViewportTopPercent(camera, solvedX, xLogoParams.posZ, clampedSolvedYTopPercent);
    }
    if (needsClampX) {
        solvedX = solveXLogoPosXForViewportPercent(camera, solvedY, xLogoParams.posZ, clampedSolvedXPercent);
    }
    if (needsClampY || needsClampX) {
        solvedY = solveXLogoPosYForViewportTopPercent(camera, solvedX, xLogoParams.posZ, clampedSolvedYTopPercent);
    }

    return {
        posX: Number.isFinite(solvedX) ? solvedX : xLogoParams.posX,
        posY: Number.isFinite(solvedY) ? solvedY : worldY,
        posZ: xLogoParams.posZ,
    };
}

function getXLogoFollowLerpFactor(deltaSeconds) {
    const clampedDelta = THREE.MathUtils.clamp(
        deltaSeconds,
        XLOGO_FOLLOW_MIN_DELTA_SECONDS,
        XLOGO_FOLLOW_MAX_DELTA_SECONDS
    );
    const lagSeconds = Math.max(0.01, XLOGO_FOLLOW_LAG_SECONDS);
    return 1 - Math.exp(-clampedDelta / lagSeconds);
}

function applyXLogoGroupPosition(group, camera = _xLogoCamera, options = {}) {
    if (!group) return;
    const { immediate = false, deltaSeconds = 1 / 60 } = options;
    const worldY = xLogoParams.posY;
    const { posX, posY, posZ } = getResponsiveXLogoPosition(camera, worldY);
    group.userData.baseY = xLogoParams.posY;

    if (immediate || !group.userData.followInitialized) {
        group.position.set(posX, posY, posZ);
        group.userData.followInitialized = true;
        return;
    }

    const followLerp = getXLogoFollowLerpFactor(deltaSeconds);
    group.position.x = THREE.MathUtils.lerp(group.position.x, posX, followLerp);
    group.position.y = THREE.MathUtils.lerp(group.position.y, posY, followLerp);
    group.position.z = THREE.MathUtils.lerp(group.position.z, posZ, followLerp);
}

function createHtmlLabel(text, extraClass, url, isExternal, navType, navIndex) {
    return createNavLabelButton({
        text,
        extraClass,
        url,
        isExternal,
        navType,
        navIndex,
        onGemHover: setGemHover,
        onXLogoHover: setXLogoHover,
    });
}

function replaceLabel(oldLabel, text, extraClass, url, isExternal, navType, navIndex) {
    if (oldLabel instanceof HTMLElement) oldLabel.remove();
    return createHtmlLabel(text, extraClass, url, isExternal, navType, navIndex);
}

export function rebuildGem() {
    rebuildGemState({ gemMesh: _gemMesh, gemGroup: _gemGroup, gemParams });
}

export function updateGemPosition() {
    applyGemDesktopPosition(_gemGroup);
}

export function createXLogoObjects(scene, camera = null) {
    _xLogoCamera = camera || _xLogoCamera;
    const lang = detectLang();
    const strings = t(lang);
    const xData = strings.xLogo;
    const gemData = strings.gem;

    const xGroup = createXLogoGroup();
    const gemGroup = createGemGroup();

    xGroup.userData.hitSprite.userData = {
        type: 'nav',
        url: xData.url,
        label: xData.label,
        isXLogo: true,
        external: true,
    };

    Object.assign(xGroup.userData, { isXLogo: true });
    applyXLogoGroupPosition(xGroup, _xLogoCamera, { immediate: true });

    gemGroup.userData.hitSprite.userData = {
        type: 'nav',
        url: gemData.url,
        label: gemData.label,
        isGem: true,
        external: true,
    };
    Object.assign(gemGroup.userData, { isGem: true });
    applyGemDesktopPosition(gemGroup);
    xGroup.add(gemGroup);

    scene.add(xGroup);
    _xLogoGroup = xGroup;
    _gemGroup = gemGroup;
    _xLogoLastUpdateTime = null;

    _gemLabelElement = createHtmlLabel(gemData.label, 'nav-label--gem', gemData.url, true, 'gem');
    _xLogoLabelElement = createHtmlLabel(xData.label, 'nav-label--x', xData.url, true, 'xlogo');

    return xGroup;
}

export function refreshXLogoLanguage() {
    const strings = t(detectLang());

    if (_gemGroup && strings.gem) {
        const hit = _gemGroup.userData.hitSprite;
        if (hit && hit.userData) {
            hit.userData.url = strings.gem.url;
            hit.userData.label = strings.gem.label;
        }

        _gemLabelElement = replaceLabel(
            _gemLabelElement,
            strings.gem.label,
            'nav-label--gem',
            strings.gem.url,
            true,
            'gem'
        );
    }

    if (_xLogoGroup && strings.xLogo) {
        const hit = _xLogoGroup.userData.hitSprite;
        if (hit && hit.userData) {
            hit.userData.url = strings.xLogo.url;
            hit.userData.label = strings.xLogo.label;
        }

        _xLogoLabelElement = replaceLabel(
            _xLogoLabelElement,
            strings.xLogo.label,
            'nav-label--x',
            strings.xLogo.url,
            true,
            'xlogo'
        );
    }
}

export function updateXLogo(time, camera = _xLogoCamera) {
    _xLogoCamera = camera || _xLogoCamera;
    if (!_xLogoGroup) return;

    const prevTime = _xLogoLastUpdateTime;
    _xLogoLastUpdateTime = time;
    const deltaSeconds = Number.isFinite(prevTime) && Number.isFinite(time)
        ? THREE.MathUtils.clamp(time - prevTime, XLOGO_FOLLOW_MIN_DELTA_SECONDS, XLOGO_FOLLOW_MAX_DELTA_SECONDS)
        : 1 / 60;

    applyXLogoGroupPosition(_xLogoGroup, _xLogoCamera, { deltaSeconds });

    const xLogoFloatAmplitude = worldFromViewportHeight(0.30);
    const floatY = Math.sin(time * 0.6) * xLogoFloatAmplitude;
    const data = _xLogoGroup.userData;
    if (data.xLogoRoot) {
        data.xLogoRoot.position.y = floatY;
    } else if (data.xLogoMesh) {
        data.xLogoMesh.position.y = floatY;
    }

    const submerged = getScrollProgress() > 0.3;
    _xLogoGroup.visible = toggles.navOrbs && !submerged;
    if (!_xLogoGroup.visible) return;

    if (_gemGroup) {
        updateGemGroupAnimation(_gemGroup, time);
    }

    const rotTarget = data.xLogoRoot || data.xLogoMesh;
    if (rotTarget) {
        const baseRotY = data.xLogoBaseRotY || 0;
        rotTarget.rotation.y = baseRotY + Math.sin(time * 0.2) * 0.15;
    }

    const hoverBoost = _xLogoHover ? 1.25 : 1.0;
    const config = getXLogoMaterialConfig();

    if (_xLogoMaterials.length > 0) {
        _xLogoMaterials.forEach((mat) => {
            if (!mat) return;
            mat.emissiveIntensity = config.emissiveIntensity * hoverBoost;
            mat.metalness = config.metalness;
            mat.roughness = config.roughness;
        });
    }

    if (data.xLogoMesh && data.xLogoMesh.material && data.xLogoMesh.material.uniforms) {
        const u = data.xLogoMesh.material.uniforms;
        if (u.uTime) u.uTime.value = time;
        if (u.uGlowStrength) u.uGlowStrength.value = xLogoParams.glowStrength * hoverBoost;
        if (u.uRimPower) u.uRimPower.value = xLogoParams.rimPower;
        if (u.uInnerGlow) u.uInnerGlow.value = xLogoParams.innerGlow;
    }
}

export function setGemHover(isHovered) {
    if (_gemMesh && _gemMesh.material.uniforms.uHover) {
        _gemMesh.material.uniforms.uHover.value = isHovered ? 1.0 : 0.0;
    }
}

export function setXLogoHover(isHovered) {
    _xLogoHover = isHovered;
    if (_xLogoMesh && _xLogoMesh.material && _xLogoMesh.material.uniforms && _xLogoMesh.material.uniforms.uHover) {
        _xLogoMesh.material.uniforms.uHover.value = isHovered ? 1.0 : 0.0;
    }
}

export function updateXLogoLabel(camera) {
    const visible = toggles.navOrbs;
    const scrollFade = Math.max(0, 1 - getScrollProgress() * 5);
    const xLogoLabelYOffset = worldFromViewportHeight(xLogoParams.labelYOffset);
    const gemLabelYOffset = worldFromViewportHeight(gemParams.labelYOffset);

    if (_xLogoLabelElement && _xLogoGroup) {
        if (!visible || scrollFade <= 0) {
            _xLogoLabelElement.classList.add('nav-label--hidden');
            syncLabelFocusState(_xLogoLabelElement, false);
        } else {
            _xLogoGroup.getWorldPosition(_labelWorldPos);
            updateSingleLabel({
                el: _xLogoLabelElement,
                worldPos: _labelWorldPos,
                yOffset: xLogoLabelYOffset,
                camera,
                scrollFade,
            });
        }
    }

    if (_gemLabelElement && _gemGroup) {
        if (!visible || scrollFade <= 0) {
            _gemLabelElement.classList.add('nav-label--hidden');
            syncLabelFocusState(_gemLabelElement, false);
            return;
        }

        _gemGroup.getWorldPosition(_labelWorldPos);
        updateSingleLabel({
            el: _gemLabelElement,
            worldPos: _labelWorldPos,
            yOffset: gemLabelYOffset,
            camera,
            scrollFade,
        });
    }
}

export function rebuildXLogo() {
    if (_xLogoRoot) {
        _xLogoRoot.scale.setScalar(xLogoParams.meshScale);
    }
    if (_xLogoMesh) {
        _xLogoMesh.scale.setScalar(xLogoParams.meshScale);
        const u = _xLogoMesh.material?.uniforms;
        if (u && u.uGlowStrength) u.uGlowStrength.value = xLogoParams.glowStrength;
        if (u && u.uRimPower) u.uRimPower.value = xLogoParams.rimPower;
        if (u && u.uInnerGlow) u.uInnerGlow.value = xLogoParams.innerGlow;
    }
    if (_xLogoMaterials.length > 0) {
        const config = getXLogoMaterialConfig();
        _xLogoMaterials.forEach((mat) => {
            if (!mat) return;
            mat.emissiveIntensity = config.emissiveIntensity;
            mat.metalness = config.metalness;
            mat.roughness = config.roughness;
        });
    }
    if (_xLogoGroup) {
        const hit = _xLogoGroup.userData.hitSprite;
        if (hit) {
            const s = xLogoParams.meshScale * 3.0;
            hit.scale.set(s, s, 1);
        }
    }
}

export function updateXLogoPosition(camera = _xLogoCamera) {
    _xLogoCamera = camera || _xLogoCamera;
    if (!_xLogoGroup) return;
    _xLogoLastUpdateTime = null;
    applyXLogoGroupPosition(_xLogoGroup, _xLogoCamera, { immediate: true });
}

export function getXLogoGroup() {
    return _xLogoGroup;
}
