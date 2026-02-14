// nav-objects.js — 3Dナビゲーションオブジェクト（鬼火オーブ + HTMLラベル + Gemini星[GLTF]）

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { detectLang, t } from './i18n.js';
import { toggles, gemParams } from './config.js';
import { getScrollProgress } from './controls.js';
import { gemOrbVertexShader, gemOrbFragmentShader } from './shaders/gem-orb.glsl.js';
import { getRawMouse } from './mouse-state.js';

// --- 正三角形配置（XZ平面） ---
const TRI_R = 9;
const NAV_POSITIONS = [
    { position: [TRI_R * Math.sin(0),            -8, TRI_R * Math.cos(0)],            color: 0x6688cc },
    { position: [TRI_R * Math.sin(2*Math.PI/3),   -8, TRI_R * Math.cos(2*Math.PI/3)],  color: 0x7799dd },
    { position: [TRI_R * Math.sin(4*Math.PI/3),   -8, TRI_R * Math.cos(4*Math.PI/3)],  color: 0x5577bb },
];

const ORB_3D_RADIUS = 2.0;

let _labelElements = [];
let _gemLabelElement = null;
let _gemGroup = null;
let _gemMesh = null;
let _scene = null;
let _navMeshes = null;

// ========================================
// Gem ShaderMaterial ファクトリ
// GLTFロード成功時・フォールバック時で共通
// ========================================
function createGemOrbMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime:                 { value: 0.0 },
            uGlowStrength:         { value: gemParams.glowStrength },
            uRimPower:             { value: gemParams.rimPower },
            uInnerGlow:            { value: gemParams.innerGlow },
            uHover:                { value: 0.0 },
            uTurbulence:           { value: gemParams.turbulence },
            uHaloWidth:            { value: gemParams.haloWidth },
            uHaloIntensity:        { value: gemParams.haloIntensity },
            uChromaticAberration:  { value: gemParams.chromaticAberration },
        },
        vertexShader: gemOrbVertexShader,
        fragmentShader: gemOrbFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
}

// ========================================
// Gem Group 生成（hitSprite + GLTFメッシュ）
// ========================================
function createGemGroup() {
    const group = new THREE.Group();
    group.position.set(gemParams.posX, gemParams.posY, gemParams.posZ);

    // --- 不可視ヒットスプライト（レイキャスト用） ---
    const hitMat = new THREE.SpriteMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
    });
    const hitSprite = new THREE.Sprite(hitMat);
    const hitSize = gemParams.meshScale * 3.0;
    hitSprite.scale.set(hitSize, hitSize, 1);
    group.add(hitSprite);

    group.userData = {
        hitSprite,
        gemMesh: null,
    };

    // --- GLTFロード ---
    const loader = new GLTFLoader();
    loader.load(
        'assets/blender/gemini-logo.glb',
        (gltf) => {
            const loadedMesh = gltf.scene.children[0];
            if (!loadedMesh) return;

            // 法線を再計算
            if (loadedMesh.geometry) {
                loadedMesh.geometry.computeVertexNormals();
            }

            loadedMesh.material = createGemOrbMaterial();
            loadedMesh.scale.setScalar(gemParams.meshScale);
            loadedMesh.renderOrder = 10;

            // Blenderモデルを起こす
            loadedMesh.rotation.x = Math.PI / 2;

            group.add(loadedMesh);
            group.userData.gemMesh = loadedMesh;
            _gemMesh = loadedMesh;

            console.log('[Gem] GLTF loaded:', loadedMesh.geometry.attributes.position.count, 'vertices');
        },
        undefined,
        (err) => {
            console.warn('[Gem] GLTF load failed, using fallback sphere:', err.message);
            const fallbackGeom = new THREE.IcosahedronGeometry(1.0, 2);
            const fallback = new THREE.Mesh(fallbackGeom, createGemOrbMaterial());
            fallback.scale.setScalar(gemParams.meshScale);
            fallback.renderOrder = 10;
            group.add(fallback);
            group.userData.gemMesh = fallback;
            _gemMesh = fallback;
        }
    );

    return group;
}

// --- devPanelからのパラメータ更新 ---
export function rebuildGem() {
    if (!_gemMesh) return;
    _gemMesh.scale.setScalar(gemParams.meshScale);
    const u = _gemMesh.material.uniforms;
    if (u.uGlowStrength)        u.uGlowStrength.value = gemParams.glowStrength;
    if (u.uRimPower)            u.uRimPower.value = gemParams.rimPower;
    if (u.uInnerGlow)           u.uInnerGlow.value = gemParams.innerGlow;
    if (u.uTurbulence)          u.uTurbulence.value = gemParams.turbulence;
    if (u.uHaloWidth)           u.uHaloWidth.value = gemParams.haloWidth;
    if (u.uHaloIntensity)       u.uHaloIntensity.value = gemParams.haloIntensity;
    if (u.uChromaticAberration) u.uChromaticAberration.value = gemParams.chromaticAberration;
    if (_gemGroup) {
        const hit = _gemGroup.userData.hitSprite;
        if (hit) {
            const s = gemParams.meshScale * 3.0;
            hit.scale.set(s, s, 1);
        }
    }
}

// --- devPanelからの位置更新 ---
export function updateGemPosition() {
    if (!_gemGroup) return;
    _gemGroup.userData.baseY = gemParams.posY;
    _gemGroup.position.set(gemParams.posX, gemParams.posY, gemParams.posZ);
}

// ========================================
// HTMLラベル — ISS-001: div → button 化
// ========================================
function injectNavLabelStyles() {
    if (document.getElementById('nav-label-styles')) return;
    const style = document.createElement('style');
    style.id = 'nav-label-styles';
    // CHANGED: pointer-events: none → auto, button reset styles, focus/hover styles
    // FIX: フォントをNoto Serif JPに統一（index.htmlと一致）
    style.textContent = `
        .nav-label {
            position: fixed;
            z-index: 15;
            pointer-events: auto;
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
            color: rgba(255, 255, 255, 0.9);
            font-family: "Noto Serif JP", "Yu Mincho", "MS PMincho", serif;
            font-size: clamp(0.45rem, 2.8vmin, 1.1rem);
            letter-spacing: clamp(0.05em, 0.4vmin, 0.15em);
            text-shadow: 0 0 12px rgba(100, 150, 255, 0.5), 0 0 4px rgba(0, 0, 0, 0.8);
            transform: translate(-50%, -100%);
            white-space: nowrap;
            transition: filter 0.15s ease, opacity 0.3s ease, color 0.3s ease;
            will-change: filter;
        }
        .nav-label:focus {
            outline: 2px solid rgba(100, 150, 255, 0.8);
            outline-offset: 4px;
            filter: blur(0px) !important;
        }
        .nav-label:hover {
            filter: blur(0px) !important;
            color: rgba(255, 255, 255, 1.0);
        }
        .nav-label--gem {
            color: rgba(180, 195, 240, 0.85);
            text-shadow: 0 0 12px rgba(123, 143, 232, 0.5), 0 0 4px rgba(0, 0, 0, 0.8);
        }
        .nav-label--gem:hover {
            color: rgba(200, 215, 255, 1.0);
        }
    `;
    document.head.appendChild(style);
}

// CHANGED: div → button, click/keyboard handlers, aria-label
function createHtmlLabel(text, extraClass, url, isExternal) {
    const btn = document.createElement('button');
    btn.className = 'nav-label' + (extraClass ? ' ' + extraClass : '');
    btn.textContent = text;
    btn.tabIndex = 0;
    btn.setAttribute('role', 'button');

    // aria-label: 言語に応じた説明
    const lang = document.documentElement.lang || 'ja';
    if (isExternal) {
        btn.setAttribute('aria-label',
            lang === 'en' ? `Open ${text} (external link)` : `${text}を開く（外部リンク）`);
    } else {
        btn.setAttribute('aria-label',
            lang === 'en' ? `Open ${text} PDF` : `${text}のPDFを開く`);
    }

    // クリックハンドラ
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isExternal) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            import('./viewer.js').then(({ openPdfViewer }) => {
                openPdfViewer(url, text);
            });
        }
    });

    // キーボードハンドラ（Enter / Space）
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
        }
    });

    document.body.appendChild(btn);
    return btn;
}

// ========================================
// 公開API
// ========================================
export function createNavObjects(scene) {
    _scene = scene;
    const navMeshes = [];
    const lang = detectLang();
    const strings = t(lang);

    injectNavLabelStyles();

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
        _labelElements.push(createHtmlLabel(navItem.label, '', navItem.url, false));
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
    _gemLabelElement = createHtmlLabel(gemData.label, 'nav-label--gem', gemData.url, true);

    return navMeshes;
}

export function updateNavObjects(navMeshes, time, camera) {
    navMeshes.forEach((obj) => {
        const data = obj.userData;

        if (data.isGem) {
            // Y浮遊
            obj.position.y = data.baseY + Math.sin(time * 0.6 + 2.0) * 0.4;

            // GLTFメッシュ: ゆっくり自転
            const mesh = data.gemMesh;
            if (mesh) {
                mesh.rotation.x = Math.PI / 2 + Math.sin(time * 0.3) * 0.1;
                mesh.rotation.z = time * 0.25;

                const u = mesh.material.uniforms;
                if (u.uTime) u.uTime.value = time;
            }
        } else {
            const floatOffset = Math.sin(time * 0.8 + data.index) * 0.3;
            obj.position.y = data.baseY + floatOffset;
        }
    });
}

// --- Gemホバー制御 ---
export function setGemHover(isHovered) {
    if (_gemMesh && _gemMesh.material.uniforms.uHover) {
        _gemMesh.material.uniforms.uHover.value = isHovered ? 1.0 : 0.0;
    }
}

// --- HTMLラベルの位置更新 ---
const _labelWorldPos = new THREE.Vector3();
const LABEL_Y_OFFSET = 3.5;

// T-010: _gazeX/_gazeY と initGazeTracking() を除去。
// mouse-state.js の getRawMouse() で取得する。

function updateSingleLabel(el, worldPos, yOffset, camera, scrollFade) {
    worldPos.y += yOffset;
    worldPos.project(camera);

    if (worldPos.z > 1.0) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none'; // CHANGED: カメラ背面では無効化
        return;
    }

    const x = ( worldPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;

    el.style.left = x + 'px';
    el.style.top = y + 'px';

    // T-010: getRawMouse() から視線座標を取得
    const gaze = getRawMouse();
    const labelNdcX = x / window.innerWidth;
    const labelNdcY = y / window.innerHeight;
    const dx = labelNdcX - gaze.x;
    // getRawMouse().y は Y反転済み (1-clientY/height) なので、ラベル側も合わせる
    const gazeScreenY = 1.0 - gaze.y;
    const dy = labelNdcY - gazeScreenY;
    const gazeDist = Math.sqrt(dx * dx + dy * dy);
    const blurPx = Math.max(0, (gazeDist - 0.15) * 8.0);
    const clampedBlur = Math.min(blurPx, 4.0);
    el.style.filter = `blur(${clampedBlur.toFixed(1)}px)`;
    el.style.opacity = String(scrollFade);
    el.style.pointerEvents = scrollFade > 0.1 ? 'auto' : 'none'; // CHANGED: フェード時は無効化
}

export function updateNavLabels(navMeshes, camera) {
    const visible = toggles.navOrbs;
    const scrollFade = Math.max(0, 1 - getScrollProgress() * 5);

    navMeshes.forEach((group, i) => {
        if (group.userData.isGem) return;

        const el = _labelElements[i];
        if (!el) return;

        if (!visible || scrollFade <= 0) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none'; // CHANGED
            return;
        }

        group.getWorldPosition(_labelWorldPos);
        updateSingleLabel(el, _labelWorldPos, LABEL_Y_OFFSET, camera, scrollFade);
    });

    if (_gemLabelElement && _gemGroup) {
        if (!visible || scrollFade <= 0) {
            _gemLabelElement.style.opacity = '0';
            _gemLabelElement.style.pointerEvents = 'none'; // CHANGED
            return;
        }

        _gemGroup.getWorldPosition(_labelWorldPos);
        updateSingleLabel(_gemLabelElement, _labelWorldPos, gemParams.labelYOffset, camera, scrollFade);
    }
}

// --- スクリーン座標 + 射影半径の計算 ---
const _orbCenter = new THREE.Vector3();
const _orbEdge = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _centerNDC = new THREE.Vector3();
const _edgeNDC = new THREE.Vector3();

export function getOrbScreenData(navMeshes, camera) {
    const data = [];
    navMeshes.forEach(group => {
        if (group.userData.isGem) return;

        if (group.userData.core) {
            group.userData.core.getWorldPosition(_orbCenter);
        } else {
            group.getWorldPosition(_orbCenter);
        }
        camera.getWorldDirection(_camRight);
        _camRight.cross(camera.up).normalize();
        _orbEdge.copy(_orbCenter).addScaledVector(_camRight, ORB_3D_RADIUS);

        _centerNDC.copy(_orbCenter).project(camera);
        _edgeNDC.copy(_orbEdge).project(camera);

        const cx = (_centerNDC.x * 0.5) + 0.5;
        const cy = (_centerNDC.y * 0.5) + 0.5;
        const ex = (_edgeNDC.x * 0.5) + 0.5;
        const ey = (_edgeNDC.y * 0.5) + 0.5;
        const dx = (ex - cx) * (window.innerWidth / window.innerHeight);
        const dy = ey - cy;
        const screenRadius = Math.sqrt(dx * dx + dy * dy);
        let strength = 1.0;
        if (_centerNDC.z > 1.0) strength = 0.0;
        data.push({ x: cx, y: cy, strength, radius: screenRadius });
    });
    return data;
}
