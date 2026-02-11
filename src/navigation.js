// navigation.js — 3Dナビゲーションオブジェクト + フロートビューアー
// 光（kesson）は背景演出、ナビは別オブジェクト

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
            // iframeを破棄してメモリ解放
            _viewer.querySelector('.viewer-content').innerHTML = '';
            _isOpen = false;
        }, 500);
    }
}

// --- テキストスプライト生成 ---
function createTextSprite(text, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    // 背景（半透明の暗いガラス）
    ctx.fillStyle = 'rgba(15, 25, 40, 0.5)';
    roundRect(ctx, 0, 0, canvas.width, canvas.height, 8);
    ctx.fill();

    // ボーダー
    ctx.strokeStyle = `rgba(100, 150, 255, 0.2)`;
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, canvas.width - 2, canvas.height - 2, 8);
    ctx.stroke();

    // テキスト
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '36px "Yu Mincho", "MS PMincho", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(8, 2, 1);

    return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// --- ナビオブジェクト作成 ---
function createNavObjects(scene) {
    NAV_ITEMS.forEach((item, index) => {
        const sprite = createTextSprite(item.label, item.color);
        sprite.position.set(...item.position);
        sprite.userData = {
            type: 'nav',
            url: item.url,
            label: item.label,
            baseY: item.position[1],
            index,
        };
        scene.add(sprite);
        _navMeshes.push(sprite);
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

    // ドラッグしていたら無視
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
    const intersects = _raycaster.intersectObjects(_navMeshes);

    if (intersects.length > 0) {
        const data = intersects[0].object.userData;
        openPdfViewer(data.url, data.label);
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
    const intersects = _raycaster.intersectObjects(_navMeshes);

    _renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

function openPdfViewer(url, label) {
    openViewer(`
        <iframe src="${url}" title="${label}"></iframe>
    `);
}

// --- 公開インターフェース ---

/**
 * ナビゲーションの初期化
 * @param {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer }} ctx
 */
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

/**
 * 毎フレーム更新（ナビオブジェクトの浮遊）
 * @param {number} time
 */
export function updateNavigation(time) {
    _navMeshes.forEach((sprite) => {
        const data = sprite.userData;
        // ゆっくり浮遊
        sprite.position.y = data.baseY + Math.sin(time * 0.4 + data.index * 1.5) * 0.4;
    });
}
