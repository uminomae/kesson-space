// nav-objects.js — 3Dナビゲーションオブジェクト（鬼火オーブ + HTMLラベル + Gemini星）
// テキストラベルはHTMLオーバーレイ（ポストプロセスの歪みを受けない）

import * as THREE from 'three';
import { detectLang, t } from './i18n.js';
import { toggles } from './config.js';
import { getScrollProgress } from './controls.js';

// --- 正三角形配置（XZ平面） ---
const TRI_R = 9;
const NAV_POSITIONS = [
    { position: [TRI_R * Math.sin(0),            -8, TRI_R * Math.cos(0)],            color: 0x6688cc },
    { position: [TRI_R * Math.sin(2*Math.PI/3),   -8, TRI_R * Math.cos(2*Math.PI/3)],  color: 0x7799dd },
    { position: [TRI_R * Math.sin(4*Math.PI/3),   -8, TRI_R * Math.cos(4*Math.PI/3)],  color: 0x5577bb },
];

const ORB_3D_RADIUS = 2.0;

// --- Gemini星の配置 ---
const GEM_POSITION = [10, 3, 18];
const GEM_SPRITE_SIZE = 5.0;  // Spriteの表示サイズ

let _labelElements = [];
let _gemLabelElement = null;
let _gemSprite = null;

// ========================================
// Canvasで四芒星を描画→Spriteテクスチャ
// SpriteはThree.jsが自動でビルボード化するので角度問題が起きない
// ========================================
function createGeminiStarTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size * 0.42;   // 先端までの半径
    const innerR = size * 0.13;   // くびれの半径
    const points = 4;

    // --- グロー元 ---
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR * 1.3);
    glow.addColorStop(0, 'rgba(123, 143, 232, 0.25)');
    glow.addColorStop(0.5, 'rgba(123, 143, 232, 0.08)');
    glow.addColorStop(1, 'rgba(123, 143, 232, 0.0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    // --- 四芒星本体 ---
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        // -90度から開始（上向き先端）
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // グラデーションフィル（中心からエッジへ）
    const starGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
    starGrad.addColorStop(0, 'rgba(160, 176, 240, 0.9)');   // 中心: 明るい青紫
    starGrad.addColorStop(0.4, 'rgba(123, 143, 232, 0.75)'); // 中間
    starGrad.addColorStop(1, 'rgba(90, 110, 200, 0.3)');     // エッジ: 淡く
    ctx.fillStyle = starGrad;
    ctx.fill();

    // エッジの柔らかい光
    ctx.shadowColor = 'rgba(123, 143, 232, 0.6)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
}

function createGemSprite() {
    const texture = createGeminiStarTexture();

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(GEM_SPRITE_SIZE, GEM_SPRITE_SIZE, 1);
    sprite.position.set(...GEM_POSITION);

    return sprite;
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

    // --- Gemini Gem四芒星（Sprite） ---
    const gemData = strings.gem;
    const gemSprite = createGemSprite();
    const gemIndex = navMeshes.length;

    gemSprite.userData = {
        type: 'nav',
        url: gemData.url,
        label: gemData.label,
        baseY: GEM_POSITION[1],
        index: gemIndex,
        isGem: true,
        external: true,
    };

    scene.add(gemSprite);
    navMeshes.push(gemSprite);
    _gemSprite = gemSprite;

    _gemLabelElement = createHtmlLabel(gemData.label, 'nav-label--gem');

    return navMeshes;
}

export function updateNavObjects(navMeshes, time) {
    navMeshes.forEach((obj) => {
        const data = obj.userData;

        if (data.isGem) {
            // Gem: 浮遊のみ（Spriteは自動ビルボード）
            obj.position.y = data.baseY + Math.sin(time * 0.6 + 2.0) * 0.4;

            // 呼吸的なスケール脈動
            const breathScale = GEM_SPRITE_SIZE * (1.0 + Math.sin(time * 0.5) * 0.05);
            obj.scale.set(breathScale, breathScale, 1);
        } else {
            const floatOffset = Math.sin(time * 0.8 + data.index) * 0.3;
            obj.position.y = data.baseY + floatOffset;
        }
    });
}

// --- Gemホバー制御 ---
export function setGemHover(isHovered) {
    if (_gemSprite) {
        // ホバー時: 少し大きく + 明るく
        const scale = isHovered ? GEM_SPRITE_SIZE * 1.15 : GEM_SPRITE_SIZE;
        _gemSprite.scale.set(scale, scale, 1);
        _gemSprite.material.opacity = isHovered ? 1.0 : 0.85;
    }
}

// --- HTMLラベルの位置更新 ---
const _labelWorldPos = new THREE.Vector3();
const LABEL_Y_OFFSET = 3.5;
const GEM_LABEL_Y_OFFSET = 3.5;

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

    if (_gemLabelElement && _gemSprite) {
        if (!visible || scrollFade <= 0) {
            _gemLabelElement.style.opacity = '0';
            return;
        }

        _gemSprite.getWorldPosition(_labelWorldPos);
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
