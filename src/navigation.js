// navigation.js — 3Dナビゲーションオブジェクト + フロートビューアー
// 光（kesson）は背景演出、ナビは鬼火オーブ + 浮遊テキスト

import * as THREE from 'three';

// --- コンテンツ定義 ---
const PDF_BASE = 'https://uminomae.github.io/pjdhiro/assets/pdf/';
const HTML_SITE_URL = 'https://uminomae.github.io/pjdhiro/thinking-kesson/';

const NAV_ITEMS = [
    {
        label: '一般向け',
        url: PDF_BASE + 'kesson-general.pdf',
        position: [-8, 5, 0],
        color: 0x6688cc,
    },
    {
        label: '設計者向け',
        url: PDF_BASE + 'kesson-designer.pdf',
        position: [0, 5, 0],
        color: 0x7799dd,
    },
    {
        label: '学術版',
        url: PDF_BASE + 'kesson-academic.pdf',
        position: [8, 5, 0],
        color: 0x5577bb,
    },
];

let _camera;
let _renderer;
let _scene;
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _navMeshes = [];

// ドラッグ検出（OrbitControlsとの干渉防止）
let _pointerDownPos = null;
const DRAG_THRESHOLD = 5; // px

// --- 閲覧ウィンドウ ---
let _viewer = null;
let _isOpen = false;

function createViewer() {
    const viewer = document.createElement('div');
    viewer.id = 'kesson-viewer';
    viewer.innerHTML = `
        <div class="viewer-glass">
            <button class="viewer-close" aria-label="閉じる">×</button>
            <div class="viewer-content"></div>
        </div>
    `;
    document.body.appendChild(viewer);

    viewer.querySelector('.viewer-close').addEventListener('click', closeViewer);
    viewer.addEventListener('click', (e) => {
        if (e.target === viewer) closeViewer();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _isOpen) closeViewer();
    });

    return viewer;
}

function openViewer(content) {
    if (!_viewer) _viewer = createViewer();
    _viewer.querySelector('.viewer-content').innerHTML = content;

    requestAnimationFrame(() => {
        _viewer.classList.add('visible');
        requestAnimationFrame(() => {
            _viewer.classList.add('open');
        });
    });
    _isOpen = true;
}

function closeViewer() {
    if (_viewer) {
        _viewer.classList.remove('open');
        setTimeout(() => {
            _viewer.classList.remove('visible');
            _viewer.querySelector('.viewer-content').innerHTML = '';
            _isOpen = false;
        }, 500);
    }
}

// --- ヘルパー: 光のオーブ（鬼火）テクスチャ生成 ---
function createGlowTexture(colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    const color = new THREE.Color(colorHex);

    gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
    gradient.addColorStop(0.3, `rgba(${color.r*255|0}, ${color.g*255|0}, ${color.b*255|0}, 0.8)`);
    gradient.addColorStop(1, `rgba(${color.r*255|0}, ${color.g*255|0}, ${color.b*255|0}, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// --- ヘルパー: 浮遊テキスト生成 ---
// CHANGED: スケールを大きくして読みやすく変更
function createFloatingTextSprite(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(200, 220, 255, 0.8)';
    ctx.shadowBlur = 15;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '48px "Yu Mincho", "YuMincho", "Hiragino Mincho ProN", serif';

    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    // CHANGED: スケール拡大 (was: 6, 1.5, 1)
    sprite.scale.set(12, 3, 1);

    return sprite;
}

// --- ナビオブジェクト作成 ---
// CHANGED: 光のコアサイズ拡大、テキスト位置調整
function createNavObjects(scene) {
    NAV_ITEMS.forEach((item, index) => {
        const group = new THREE.Group();
        group.position.set(...item.position);

        const glowMaterial = new THREE.SpriteMaterial({
            map: createGlowTexture(item.color),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const coreSprite = new THREE.Sprite(glowMaterial);
        // CHANGED: コアサイズ拡大 (was: 1.5, 1.5, 1.5)
        coreSprite.scale.set(4.0, 4.0, 4.0);

        coreSprite.userData = {
            type: 'nav',
            url: item.url,
            label: item.label,
            baseY: item.position[1],
            index,
            isHitTarget: true,
        };

        const labelSprite = createFloatingTextSprite(item.label);
        // CHANGED: テキスト位置を上に調整 (was: 0, 0.9, 0)
        labelSprite.position.set(0, 2.0, 0);

        group.add(coreSprite);
        group.add(labelSprite);

        group.userData = {
            baseY: item.position[1],
            index: index,
            core: coreSprite,
            baseScale: 4.0, // CHANGED: アニメーション基準スケール
        };

        scene.add(group);
        _navMeshes.push(group);
    });
}

// --- 角のナビリンク ---
function createNavLinks() {
    const nav = document.createElement('nav');
    nav.id = 'site-nav';
    nav.innerHTML = `
        <a href="${HTML_SITE_URL}" target="_blank" rel="noopener" class="nav-link" title="HTML版で閲覧">
            <span class="nav-label">欠損駆動思考</span>
            <span class="nav-arrow">↗</span>
        </a>
    `;
    document.body.appendChild(nav);
}

// --- スタイル ---
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #site-nav {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 100;
        }
        .nav-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 14px;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 2px;
            color: rgba(255, 255, 255, 0.25);
            text-decoration: none;
            font-family: inherit;
            font-size: 0.75rem;
            letter-spacing: 0.15em;
            transition: all 0.6s ease;
        }
        .nav-link:hover {
            color: rgba(255, 255, 255, 0.6);
            border-color: rgba(255, 255, 255, 0.2);
        }
        .nav-arrow {
            font-size: 0.65rem;
            opacity: 0.5;
        }

        #kesson-viewer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 200;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(5, 10, 20, 0.0);
            transition: background 0.5s ease;
            cursor: pointer;
        }
        #kesson-viewer.visible {
            display: flex;
        }
        #kesson-viewer.open {
            background: rgba(5, 10, 20, 0.5);
        }

        .viewer-glass {
            position: relative;
            width: 80vw;
            max-width: 900px;
            height: 85vh;
            cursor: default;

            background: rgba(15, 25, 40, 0.65);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(100, 150, 255, 0.08);
            border-radius: 3px;
            box-shadow:
                0 0 60px rgba(0, 0, 0, 0.4),
                0 0 120px rgba(30, 60, 120, 0.1),
                inset 0 0 60px rgba(20, 40, 80, 0.05);

            opacity: 0;
            transform: scale(0.92) translateY(20px);
            transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        #kesson-viewer.open .viewer-glass {
            opacity: 1;
            transform: scale(1) translateY(0);
        }

        .viewer-close {
            position: absolute;
            top: 12px;
            right: 14px;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.25);
            font-size: 1.4rem;
            cursor: pointer;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.3s;
            z-index: 1;
        }
        .viewer-close:hover {
            color: rgba(255, 255, 255, 0.6);
        }

        .viewer-content {
            width: 100%;
            height: 100%;
            padding: 0;
        }
        .viewer-content iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 3px;
        }

        .viewer-glass::-webkit-scrollbar {
            width: 4px;
        }
        .viewer-glass::-webkit-scrollbar-track {
            background: transparent;
        }
        .viewer-glass::-webkit-scrollbar-thumb {
            background: rgba(100, 150, 255, 0.15);
            border-radius: 2px;
        }
    `;
    document.head.appendChild(style);
}

// --- イベント ---
function onPointerDown(event) {
    _pointerDownPos = { x: event.clientX, y: event.clientY };
}

function onPointerUp(event) {
    if (_isOpen || !_pointerDownPos) return;

    const dx = event.clientX - _pointerDownPos.x;
    const dy = event.clientY - _pointerDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        _pointerDownPos = null;
        return;
    }
    _pointerDownPos = null;

    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_navMeshes, true);

    if (intersects.length > 0) {
        let data = intersects[0].object.userData;
        if (!data.url) {
            const parent = intersects[0].object.parent;
            if (parent && parent.userData.core) {
                data = parent.userData.core.userData;
            }
        }
        if (data.url) {
            openPdfViewer(data.url, data.label);
        }
    }
}

function onPointerMove(event) {
    if (_isOpen) {
        _renderer.domElement.style.cursor = 'default';
        return;
    }

    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_navMeshes, true);

    _renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

function openPdfViewer(url, label) {
    openViewer(`
        <iframe src="${url}" title="${label}"></iframe>
    `);
}

// --- 公開インターフェース ---

export function initNavigation({ scene, camera, renderer }) {
    _camera = camera;
    _renderer = renderer;
    _scene = scene;

    injectStyles();
    createNavLinks();
    createNavObjects(scene);

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
}

// CHANGED: 拡大した基準スケールに合わせてアニメーション調整
export function updateNavigation(time) {
    _navMeshes.forEach((group) => {
        const data = group.userData;

        // 浮遊（振幅も少し大きく）
        const floatOffset = Math.sin(time * 0.8 + data.index) * 0.3;
        group.position.y = data.baseY + floatOffset;

        // 光のコアの鼓動
        if (data.core) {
            const pulse = 1.0 + Math.sin(time * 1.5 + data.index * 2.0) * 0.1;
            const base = data.baseScale || 4.0;
            data.core.scale.set(base * pulse, base * pulse, base * pulse);
            data.core.material.opacity = 0.7 + Math.sin(time * 1.5 + data.index * 2.0) * 0.3;
        }
    });
}
