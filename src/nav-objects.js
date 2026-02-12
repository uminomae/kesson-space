// nav-objects.js — 3Dナビゲーションオブジェクト（鬼火オーブ + HTMLラベル + Gemini星）
// テキストラベルはHTMLオーバーレイ（ポストプロセスの歪みを受けない）

import * as THREE from 'three';
import { detectLang, t } from './i18n.js';
import { toggles } from './config.js';
import { getScrollProgress } from './controls.js';

// --- 正三角形配置（XZ平面、天井から見て三角形） ---
const TRI_R = 9;
const NAV_POSITIONS = [
    { position: [TRI_R * Math.sin(0),            -8, TRI_R * Math.cos(0)],            color: 0x6688cc },
    { position: [TRI_R * Math.sin(2*Math.PI/3),   -8, TRI_R * Math.cos(2*Math.PI/3)],  color: 0x7799dd },
    { position: [TRI_R * Math.sin(4*Math.PI/3),   -8, TRI_R * Math.cos(4*Math.PI/3)],  color: 0x5577bb },
];

const ORB_3D_RADIUS = 2.0;

// --- Gemini星の配置 ---
const GEM_POSITION = [10, 3, 18];
const GEM_SCALE = 2.2;

let _labelElements = [];
let _gemLabelElement = null;
let _gemMesh = null;

// ========================================
// Gemini四芒星シェーダー
// 冷知的な青紫、ゆっくり脈動、ホバー対応
// ========================================
const GEM_VERTEX_SHADER = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const GEM_FRAGMENT_SHADER = `
    uniform float uTime;
    uniform float uHover;
    varying vec2 vUv;

    void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center);

        // 穏やかな呼吸的脈動
        float breath = sin(uTime * 0.5) * 0.15 + 0.85;
        breath = mix(breath, 1.0, uHover * 0.3);

        // 冷知的な青紫グラデーション
        vec3 colorCore = vec3(0.48, 0.56, 0.91);   // #7B8FE8
        vec3 colorEdge = vec3(0.63, 0.69, 0.94);   // #A0B0F0
        vec3 color = mix(colorCore, colorEdge, dist * 2.0);

        // ホバー時: 少し明るく白みがかる
        color = mix(color, vec3(0.75, 0.82, 1.0), uHover * 0.3);

        // エッジに向かうソフトフェード
        float alpha = smoothstep(0.5, 0.15, dist) * breath;

        // 中心のコアグロー
        float coreGlow = exp(-dist * 6.0) * 0.4 * breath;
        color += vec3(0.3, 0.35, 0.5) * coreGlow;

        gl_FragColor = vec4(color, alpha * 0.7);
    }
`;

// ========================================
// 四芒星シェイプ（ベジェ曲線、Geminiスパークル風）
// FIXED: くびれを太くして星形を明確に
// ========================================
function createGeminiStarShape() {
    const shape = new THREE.Shape();
    const tip = 1.0;          // 先端までの距離
    const waist = 0.32;       // FIXED: くびれの幅（大きいほど太い）
    const cp = 0.42;          // FIXED: ベジェ制御点の位置

    // 上の先端から時計回りに4つの弧を描く
    shape.moveTo(0, tip);
    shape.quadraticCurveTo(waist, cp, tip, 0);      // 上→右
    shape.quadraticCurveTo(cp, -waist, 0, -tip);    // 右→下
    shape.quadraticCurveTo(-waist, -cp, -tip, 0);   // 下→左
    shape.quadraticCurveTo(-cp, waist, 0, tip);     // 左→上

    return shape;
}

function createGemMesh() {
    const shape = createGeminiStarShape();
    const geometry = new THREE.ShapeGeometry(shape, 24);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime:  { value: 0.0 },
            uHover: { value: 0.0 },
        },
        vertexShader: GEM_VERTEX_SHADER,
        fragmentShader: GEM_FRAGMENT_SHADER,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(GEM_SCALE, GEM_SCALE, GEM_SCALE);
    mesh.position.set(...GEM_POSITION);

    return mesh;
}

// ========================================
// HTMLラベル
// ========================================
function injectNavLabelStyles() {
    if (document.getElementById('nav-label-styles')) return;
    const style = document.createElement('style');
    style.id = 'nav-label-styles';
    style.textContent = `
        .nav-label {
            position: fixed;
            z-index: 15;
            pointer-events: none;
            color: rgba(255, 255, 255, 0.9);
            font-family: "Sawarabi Mincho", "Yu Mincho", "Hiragino Mincho ProN", serif;
            font-size: clamp(0.55rem, 2.8vw, 1.1rem);
            letter-spacing: clamp(0.05em, 0.4vw, 0.15em);
            text-shadow: 0 0 12px rgba(100, 150, 255, 0.5), 0 0 4px rgba(0, 0, 0, 0.8);
            transform: translate(-50%, -100%);
            white-space: nowrap;
            transition: filter 0.15s ease, opacity 0.3s ease;
            will-change: filter;
        }
        .nav-label--gem {
            color: rgba(180, 195, 240, 0.85);
            text-shadow: 0 0 12px rgba(123, 143, 232, 0.5), 0 0 4px rgba(0, 0, 0, 0.8);
        }
    `;
    document.head.appendChild(style);
}

function createHtmlLabel(text, extraClass) {
    const el = document.createElement('div');
    el.className = 'nav-label' + (extraClass ? ' ' + extraClass : '');
    el.textContent = text;
    document.body.appendChild(el);
    return el;
}

// ========================================
// 公開API
// ========================================
export function createNavObjects(scene) {
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

        _labelElements.push(createHtmlLabel(navItem.label));
    });

    // --- Gemini Gem四芒星 ---
    const gemData = strings.gem;
    const gemMesh = createGemMesh();
    const gemIndex = navMeshes.length;

    gemMesh.userData = {
        type: 'nav',
        url: gemData.url,
        label: gemData.label,
        baseY: GEM_POSITION[1],
        index: gemIndex,
        isGem: true,
        external: true,
    };

    scene.add(gemMesh);
    navMeshes.push(gemMesh);
    _gemMesh = gemMesh;

    _gemLabelElement = createHtmlLabel(gemData.label, 'nav-label--gem');

    return navMeshes;
}

// FIXED: cameraを受け取ってGemをビルボード化
export function updateNavObjects(navMeshes, time, camera) {
    navMeshes.forEach((obj) => {
        const data = obj.userData;

        if (data.isGem) {
            // FIXED: ビルボード — 常にカメラに正面を向ける
            if (camera) {
                obj.quaternion.copy(camera.quaternion);
            }

            // 浮遊 + 微かな回転（ビルボード後に加算）
            obj.position.y = data.baseY + Math.sin(time * 0.6 + 2.0) * 0.4;
            obj.rotateZ(Math.sin(time * 0.3) * 0.003);  // 微かな傾き

            // シェーダーuniform更新
            if (obj.material && obj.material.uniforms) {
                obj.material.uniforms.uTime.value = time;
            }
        } else {
            // 既存オーブの浮遊
            const floatOffset = Math.sin(time * 0.8 + data.index) * 0.3;
            obj.position.y = data.baseY + floatOffset;
        }
    });
}

// --- Gemホバー制御 ---
export function setGemHover(isHovered) {
    if (_gemMesh && _gemMesh.material && _gemMesh.material.uniforms) {
        _gemMesh.material.uniforms.uHover.value = isHovered ? 1.0 : 0.0;
    }
}

// --- HTMLラベルの位置更新 ---
const _labelWorldPos = new THREE.Vector3();
const LABEL_Y_OFFSET = 3.5;
const GEM_LABEL_Y_OFFSET = 3.0;

let _gazeX = 0.5;
let _gazeY = 0.5;

function initGazeTracking() {
    if (window._gazeTrackingInit) return;
    window._gazeTrackingInit = true;
    window.addEventListener('mousemove', (e) => {
        _gazeX = e.clientX / window.innerWidth;
        _gazeY = e.clientY / window.innerHeight;
    });
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            _gazeX = e.touches[0].clientX / window.innerWidth;
            _gazeY = e.touches[0].clientY / window.innerHeight;
        }
    });
}

function updateSingleLabel(el, worldPos, yOffset, camera, scrollFade) {
    worldPos.y += yOffset;
    worldPos.project(camera);

    if (worldPos.z > 1.0) {
        el.style.opacity = '0';
        return;
    }

    const x = ( worldPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;

    el.style.left = x + 'px';
    el.style.top = y + 'px';

    const labelNdcX = x / window.innerWidth;
    const labelNdcY = y / window.innerHeight;
    const dx = labelNdcX - _gazeX;
    const dy = labelNdcY - _gazeY;
    const gazeDist = Math.sqrt(dx * dx + dy * dy);
    const blurPx = Math.max(0, (gazeDist - 0.15) * 8.0);
    const clampedBlur = Math.min(blurPx, 4.0);
    el.style.filter = `blur(${clampedBlur.toFixed(1)}px)`;
    el.style.opacity = String(scrollFade);
}

export function updateNavLabels(navMeshes, camera) {
    initGazeTracking();

    const visible = toggles.navOrbs;
    const scrollFade = Math.max(0, 1 - getScrollProgress() * 5);

    // --- 既存オーブラベル ---
    navMeshes.forEach((group, i) => {
        if (group.userData.isGem) return;

        const el = _labelElements[i];
        if (!el) return;

        if (!visible || scrollFade <= 0) {
            el.style.opacity = '0';
            return;
        }

        group.getWorldPosition(_labelWorldPos);
        updateSingleLabel(el, _labelWorldPos, LABEL_Y_OFFSET, camera, scrollFade);
    });

    // --- Gemラベル ---
    if (_gemLabelElement && _gemMesh) {
        if (!visible || scrollFade <= 0) {
            _gemLabelElement.style.opacity = '0';
            return;
        }

        _gemMesh.getWorldPosition(_labelWorldPos);
        updateSingleLabel(_gemLabelElement, _labelWorldPos, GEM_LABEL_Y_OFFSET, camera, scrollFade);
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
