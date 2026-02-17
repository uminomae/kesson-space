// nav-objects.js — 3Dナビゲーションオブジェクト（鬼火オーブ + HTMLラベル + Gemini星[GLTF]）

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { detectLang, t } from './i18n.js';
import { toggles, gemParams, xLogoParams } from './config.js';
import { getScrollProgress } from './controls.js';
import { xLogoVertexShader, xLogoFragmentShader } from './shaders/x-logo.glsl.js';
import {
    createGemGroupModel,
    rebuildGemState,
    updateGemGroupAnimation,
    updateGemGroupPosition,
} from './nav/gem.js';
import {
    createNavLabelButton,
    getFocusedOrbIndex,
    syncLabelFocusState,
    updateLabelPosition as updateSingleLabel,
} from './nav/labels.js';
import { computeOrbScreenData } from './nav/orb-screen.js';

// --- 正三角形配置（XZ平面） ---
const TRI_R = 9;
// Xロゴ位置ターゲット（将来ここだけ調整すれば良い）
const XLOGO_TARGET_VIEWPORT_X_PERCENT = 0.05;      // 左から 5%
const XLOGO_TARGET_VIEWPORT_Y_TOP_PERCENT = 0.20;  // 上から 20%
const XLOGO_VIEWPORT_EDGE_PADDING_PERCENT = 0.02;
const NAV_POSITIONS = [
    { position: [TRI_R * Math.sin(0),            -8, TRI_R * Math.cos(0)],            color: 0x6688cc },
    { position: [TRI_R * Math.sin(2*Math.PI/3),   -8, TRI_R * Math.cos(2*Math.PI/3)],  color: 0x7799dd },
    { position: [TRI_R * Math.sin(4*Math.PI/3),   -8, TRI_R * Math.cos(4*Math.PI/3)],  color: 0x5577bb },
];

let _labelElements = [];
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
let _scene = null;
let _navMeshes = null;
const _xLogoSolveVecA = new THREE.Vector3();
const _xLogoSolveVecB = new THREE.Vector3();
const _xLogoSolveMatrix = new THREE.Matrix4();

function createGemGroup() {
    return createGemGroupModel(gemParams, (mesh) => {
        _gemMesh = mesh;
    });
}

// ========================================
// Xロゴ Group 生成（hitSprite + Planeメッシュ）
// ========================================
function getXLogoMaterialConfig() {
    const emissiveIntensity = Math.max(0.0, xLogoParams.glowStrength) * 0.7 + 0.25;
    const metalness = Math.min(0.9, Math.max(0.1, xLogoParams.rimPower / 10.0));
    const roughness = Math.min(0.8, Math.max(0.08, 1.0 - xLogoParams.innerGlow * 0.18));
    return { emissiveIntensity, metalness, roughness };
}

function applyXLogoMaterial(mesh) {
    const { emissiveIntensity, metalness, roughness } = getXLogoMaterialConfig();
    const baseColor = new THREE.Color(0.85, 0.9, 1.0);
    const emissiveColor = new THREE.Color(0.6, 0.7, 1.0);

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

    // --- 不可視ヒットスプライト（レイキャスト用） ---
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
                    uTime:         { value: 0.0 },
                    uGlowStrength: { value: xLogoParams.glowStrength },
                    uRimPower:     { value: xLogoParams.rimPower },
                    uInnerGlow:    { value: xLogoParams.innerGlow },
                    uHover:        { value: 0.0 },
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

    group.userData = { hitSprite, xLogoMesh: null, xLogoRoot: null, xLogoBaseRotY: 0 };
    applyXLogoGroupPosition(group);

    return group;
}

function getMobileXLogoViewportPercent() {
    return XLOGO_TARGET_VIEWPORT_X_PERCENT;
}

function getXLogoViewportTopPercent() {
    return XLOGO_TARGET_VIEWPORT_Y_TOP_PERCENT;
}

function estimateXLogoHalfWidthWorld() {
    // Hit sprite はレイキャスト用で実体より大きいため、表示境界には使わない。
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

    // clipX = a*x + b, clipW = c*x + d, ndcX = clipX / clipW
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

    // clipY = a*y + b, clipW = c*y + d, ndcY = clipY / clipW
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
    const basePercent = (_xLogoSolveVecA.x + 1) * 0.5;
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

    // X/Yは互いに弱く依存するため2回解いて収束させる
    let solvedY = solveXLogoPosYForViewportTopPercent(camera, xLogoParams.posX, xLogoParams.posZ, targetYTopPercent);
    let solvedX = solveXLogoPosXForViewportPercent(camera, solvedY, xLogoParams.posZ, targetXPercent);
    solvedY = solveXLogoPosYForViewportTopPercent(camera, solvedX, xLogoParams.posZ, targetYTopPercent);

    return {
        posX: Number.isFinite(solvedX) ? solvedX : xLogoParams.posX,
        posY: Number.isFinite(solvedY) ? solvedY : worldY,
        posZ: xLogoParams.posZ,
    };
}

function applyXLogoGroupPosition(group, camera = _xLogoCamera, yOffset = 0) {
    if (!group) return;
    const worldY = xLogoParams.posY + yOffset;
    const { posX, posY, posZ } = getResponsiveXLogoPosition(camera, worldY);
    group.userData.baseY = xLogoParams.posY;
    group.position.set(posX, posY, posZ);
}

// --- devPanelからのパラメータ更新 ---
export function rebuildGem() {
    rebuildGemState({ gemMesh: _gemMesh, gemGroup: _gemGroup, gemParams });
}

// --- devPanelからの位置更新 ---
export function updateGemPosition() {
    updateGemGroupPosition({ gemGroup: _gemGroup, gemParams });
}

// ========================================
// HTMLラベル — ISS-001: div → button 化
// ========================================
// CHANGED: div → button, click/keyboard handlers, aria-label
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

// ========================================
// 公開API
// ========================================
export function createNavObjects(scene) {
    _scene = scene;
    const navMeshes = [];
    const lang = detectLang();
    const strings = t(lang);

    // --- PDFオーブ（既存） ---
    NAV_POSITIONS.forEach((pos, index) => {
        const navItem = strings.nav[index];
        const group = new THREE.Group();
        group.position.set(...pos.position);

        const hitMaterial = new THREE.SpriteMaterial({
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
        });
        const coreSprite = new THREE.Sprite(hitMaterial);
        coreSprite.scale.set(4.0, 4.0, 4.0);

        coreSprite.userData = {
            type: 'nav',
            url: navItem.url,
            label: navItem.label,
            baseY: pos.position[1],
            index,
            isHitTarget: true,
        };

        group.add(coreSprite);

        group.userData = {
            baseY: pos.position[1],
            index: index,
            core: coreSprite,
            baseScale: 4.0,
        };

        scene.add(group);
        navMeshes.push(group);

        // CHANGED: URLとexternal flagを渡す
        _labelElements.push(createHtmlLabel(navItem.label, '', navItem.url, false, 'orb', index));
    });

    // --- Gemini Gem（GLTF Group） ---
    const gemData = strings.gem;
    const gemGroup = createGemGroup();
    const gemIndex = navMeshes.length;

    gemGroup.userData.hitSprite.userData = {
        type: 'nav',
        url: gemData.url,
        label: gemData.label,
        isGem: true,
        external: true,
    };

    Object.assign(gemGroup.userData, {
        baseY: gemParams.posY,
        index: gemIndex,
        isGem: true,
    });

    scene.add(gemGroup);
    navMeshes.push(gemGroup);
    _gemGroup = gemGroup;
    _navMeshes = navMeshes;

    // CHANGED: URLとexternal flagを渡す
    _gemLabelElement = createHtmlLabel(gemData.label, 'nav-label--gem', gemData.url, true, 'gem');

    return navMeshes;
}

export function createXLogoObjects(scene, camera = null) {
    _xLogoCamera = camera || _xLogoCamera;
    const lang = detectLang();
    const strings = t(lang);
    const xData = strings.xLogo;

    const xGroup = createXLogoGroup();

    xGroup.userData.hitSprite.userData = {
        type: 'nav',
        url: xData.url,
        label: xData.label,
        isXLogo: true,
        external: true,
    };

    Object.assign(xGroup.userData, { isXLogo: true });
    applyXLogoGroupPosition(xGroup, _xLogoCamera);

    scene.add(xGroup);
    _xLogoGroup = xGroup;

    _xLogoLabelElement = createHtmlLabel(xData.label, 'nav-label--x', xData.url, true, 'xlogo');

    return xGroup;
}

export function refreshNavLanguage() {
    const strings = t(detectLang());

    if (_navMeshes && _navMeshes.length > 0) {
        let orbIndex = 0;
        _navMeshes.forEach((group) => {
            if (group.userData.isGem || group.userData.isXLogo) return;
            const navItem = strings.nav[orbIndex];
            if (!navItem) {
                orbIndex += 1;
                return;
            }

            const core = group.userData.core;
            if (core && core.userData) {
                core.userData.url = navItem.url;
                core.userData.label = navItem.label;
            }

            _labelElements[orbIndex] = replaceLabel(
                _labelElements[orbIndex],
                navItem.label,
                '',
                navItem.url,
                false,
                'orb',
                orbIndex
            );
            orbIndex += 1;
        });

        for (let i = orbIndex; i < _labelElements.length; i += 1) {
            const label = _labelElements[i];
            if (label instanceof HTMLElement) label.remove();
        }
        _labelElements.length = orbIndex;
    }

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

export function updateNavObjects(navMeshes, time, camera) {
    navMeshes.forEach((obj) => {
        const data = obj.userData;

        if (data.isGem) {
            updateGemGroupAnimation(obj, time);
        } else {
            const floatOffset = Math.sin(time * 0.8 + data.index) * 0.3;
            obj.position.y = data.baseY + floatOffset;
        }
    });
}

export function updateXLogo(time, camera = _xLogoCamera) {
    _xLogoCamera = camera || _xLogoCamera;
    if (!_xLogoGroup) return;
    // 浮遊アニメーション（ゆらゆら）
    const floatOffset = Math.sin(time * 0.6) * 0.15;
    applyXLogoGroupPosition(_xLogoGroup, _xLogoCamera, floatOffset);

    const submerged = getScrollProgress() > 0.3;
    _xLogoGroup.visible = toggles.navOrbs && !submerged;
    if (!_xLogoGroup.visible) return;

    const data = _xLogoGroup.userData;

    const rotTarget = data.xLogoRoot || data.xLogoMesh;
    if (rotTarget) {
        const baseRotY = data.xLogoBaseRotY || 0;
        rotTarget.rotation.y = baseRotY + Math.sin(time * 0.2) * 0.15;
    }

    const pulse = 1.0 + Math.sin(time * 0.6) * 0.06;
    const hoverBoost = _xLogoHover ? 1.25 : 1.0;
    const config = getXLogoMaterialConfig();

    if (_xLogoMaterials.length > 0) {
        _xLogoMaterials.forEach((mat) => {
            if (!mat) return;
            mat.emissiveIntensity = config.emissiveIntensity * pulse * hoverBoost;
            mat.metalness = config.metalness;
            mat.roughness = config.roughness;
        });
    }

    if (data.xLogoMesh && data.xLogoMesh.material && data.xLogoMesh.material.uniforms) {
        const u = data.xLogoMesh.material.uniforms;
        if (u.uTime) u.uTime.value = time;
        if (u.uGlowStrength) u.uGlowStrength.value = xLogoParams.glowStrength * pulse * hoverBoost;
        if (u.uRimPower) u.uRimPower.value = xLogoParams.rimPower;
        if (u.uInnerGlow) u.uInnerGlow.value = xLogoParams.innerGlow;
    }
}

// --- Gemホバー制御 ---
export function setGemHover(isHovered) {
    if (_gemMesh && _gemMesh.material.uniforms.uHover) {
        _gemMesh.material.uniforms.uHover.value = isHovered ? 1.0 : 0.0;
    }
}

// --- Xロゴホバー制御 ---
export function setXLogoHover(isHovered) {
    _xLogoHover = isHovered;
    if (_xLogoMesh && _xLogoMesh.material && _xLogoMesh.material.uniforms && _xLogoMesh.material.uniforms.uHover) {
        _xLogoMesh.material.uniforms.uHover.value = isHovered ? 1.0 : 0.0;
    }
}

// --- HTMLラベルの位置更新 ---
const _labelWorldPos = new THREE.Vector3();
const LABEL_Y_OFFSET = 3.5;

// T-010: _gazeX/_gazeY と initGazeTracking() を除去。
// mouse-state.js の getRawMouse() で取得する。

// CHANGED(2026-02-17): T-021 — label positioning/focus logic moved to src/nav/labels.js

export function updateNavLabels(navMeshes, camera) {
    const visible = toggles.navOrbs;
    const scrollFade = Math.max(0, 1 - getScrollProgress() * 5);

    navMeshes.forEach((group, i) => {
        if (group.userData.isGem || group.userData.isXLogo) return;

        const el = _labelElements[i];
        if (!el) return;

        if (!visible || scrollFade <= 0) {
            el.classList.add('nav-label--hidden');
            syncLabelFocusState(el, false);
            return;
        }

        group.getWorldPosition(_labelWorldPos);
        updateSingleLabel({
            el,
            worldPos: _labelWorldPos,
            yOffset: LABEL_Y_OFFSET,
            camera,
            scrollFade,
        });
    });

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
            yOffset: gemParams.labelYOffset,
            camera,
            scrollFade,
        });
    }
}

export function updateXLogoLabel(camera) {
    const visible = toggles.navOrbs;
    const scrollFade = Math.max(0, 1 - getScrollProgress() * 5);

    if (_xLogoLabelElement && _xLogoGroup) {
        if (!visible || scrollFade <= 0) {
            _xLogoLabelElement.classList.add('nav-label--hidden');
            syncLabelFocusState(_xLogoLabelElement, false);
            return;
        }

        _xLogoGroup.getWorldPosition(_labelWorldPos);
        updateSingleLabel({
            el: _xLogoLabelElement,
            worldPos: _labelWorldPos,
            yOffset: xLogoParams.labelYOffset,
            camera,
            scrollFade,
        });
    }
}

export function getOrbScreenData(navMeshes, camera) {
    const focusedOrbIndex = getFocusedOrbIndex();
    return computeOrbScreenData(navMeshes, camera, focusedOrbIndex);
}

export function isNavLabelFocused() {
    const active = document.activeElement;
    return active instanceof HTMLElement && active.classList.contains('nav-label');
}

// --- devPanelからのパラメータ更新 ---
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

// --- devPanelからの位置更新 ---
export function updateXLogoPosition(camera = _xLogoCamera) {
    _xLogoCamera = camera || _xLogoCamera;
    if (!_xLogoGroup) return;
    applyXLogoGroupPosition(_xLogoGroup, _xLogoCamera);
}

export function getXLogoGroup() {
    return _xLogoGroup;
}
