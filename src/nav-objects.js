// nav-objects.js — 3Dナビゲーションオブジェクト（鬼火オーブ + HTMLラベル）
// テキストラベルはHTMLオーバーレイ（ポストプロセスの歪みを受けない）

import * as THREE from 'three';
import { detectLang, t } from './i18n.js';
import { toggles } from './config.js';
import { getScrollProgress } from './controls.js';

const NAV_POSITIONS = [
    { position: [-12, -8, -5], color: 0x6688cc },
    { position: [0, -8, -5],   color: 0x7799dd },
    { position: [12, -8, -5],  color: 0x5577bb },
];

const ORB_3D_RADIUS = 2.0;

let _labelElements = [];

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
    `;
    document.head.appendChild(style);
}

function createHtmlLabel(text) {
    const el = document.createElement('div');
    el.className = 'nav-label';
    el.textContent = text;
    document.body.appendChild(el);
    return el;
}

export function createNavObjects(scene) {
    const navMeshes = [];
    const lang = detectLang();
    const strings = t(lang);

    injectNavLabelStyles();

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

    return navMeshes;
}

export function updateNavObjects(navMeshes, time) {
    navMeshes.forEach((group) => {
        const data = group.userData;
        const floatOffset = Math.sin(time * 0.8 + data.index) * 0.3;
        group.position.y = data.baseY + floatOffset;
    });
}

// --- HTMLラベルの位置更新（被写界深度ボケ付き） ---
const _labelWorldPos = new THREE.Vector3();
const LABEL_Y_OFFSET = 3.5;

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

export function updateNavLabels(navMeshes, camera) {
    initGazeTracking();

    const visible = toggles.navOrbs;
    const scrollFade = Math.max(0, 1 - getScrollProgress() * 5);

    navMeshes.forEach((group, i) => {
        const el = _labelElements[i];
        if (!el) return;

        if (!visible || scrollFade <= 0) {
            el.style.opacity = '0';
            return;
        }

        group.getWorldPosition(_labelWorldPos);
        _labelWorldPos.y += LABEL_Y_OFFSET;
        _labelWorldPos.project(camera);

        if (_labelWorldPos.z > 1.0) {
            el.style.opacity = '0';
            return;
        }

        const x = ( _labelWorldPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-_labelWorldPos.y * 0.5 + 0.5) * window.innerHeight;

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

        // スクロール連動フェード
        el.style.opacity = String(scrollFade);
    });
}

// --- スクリーン座標 + 射影半径の計算 ---
// GC削減: ベクトルをモジュールスコープに事前確保
const _orbCenter = new THREE.Vector3();
const _orbEdge = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _centerNDC = new THREE.Vector3();
const _edgeNDC = new THREE.Vector3();

export function getOrbScreenData(navMeshes, camera) {
    const data = [];
    navMeshes.forEach(group => {
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
