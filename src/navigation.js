// navigation.js — リンク・クリック・コンテンツ表示

import * as THREE from 'three';

const HTML_SITE_URL = 'https://uminomae.github.io/pjdhiro/thinking-kesson/';

let _camera;
let _renderer;
let _kessonMeshes = [];
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

// --- コンテンツパネル ---
let _panel = null;
let _isOpen = false;

function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'content-panel';
    panel.innerHTML = `
        <div class="panel-header">
            <button class="panel-close" aria-label="閉じる">×</button>
        </div>
        <div class="panel-body"></div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('.panel-close').addEventListener('click', closePanel);

    return panel;
}

function openPanel(content) {
    if (!_panel) _panel = createPanel();
    const body = _panel.querySelector('.panel-body');
    body.innerHTML = content;
    _panel.classList.add('open');
    _isOpen = true;
}

function closePanel() {
    if (_panel) {
        _panel.classList.remove('open');
        _isOpen = false;
    }
}

// --- ナビゲーションリンク作成 ---
function createNavLinks() {
    const nav = document.createElement('nav');
    nav.id = 'site-nav';
    nav.innerHTML = `
        <a href="${HTML_SITE_URL}" target="_blank" rel="noopener" class="nav-link" title="HTML版で閲覧">
            <span class="nav-icon">⚡</span>
            <span class="nav-label">欠損駆動思考</span>
        </a>
    `;
    document.body.appendChild(nav);
}

// --- スタイル注入 ---
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* ナビゲーションリンク */
        #site-nav {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 100;
            display: flex;
            gap: 12px;
        }
        .nav-link {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: rgba(26, 42, 58, 0.6);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(100, 150, 255, 0.15);
            border-radius: 20px;
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            font-family: "Sawarabi Mincho", serif;
            font-size: 0.85rem;
            letter-spacing: 0.1em;
            transition: all 0.4s ease;
        }
        .nav-link:hover {
            background: rgba(26, 42, 58, 0.85);
            color: rgba(255, 255, 255, 0.9);
            border-color: rgba(100, 150, 255, 0.4);
            box-shadow: 0 0 20px rgba(100, 150, 255, 0.15);
        }
        .nav-icon {
            font-size: 1rem;
        }

        /* コンテンツパネル */
        #content-panel {
            position: fixed;
            top: 0;
            right: -480px;
            width: 460px;
            max-width: 90vw;
            height: 100vh;
            z-index: 200;
            background: rgba(10, 21, 32, 0.92);
            backdrop-filter: blur(16px);
            border-left: 1px solid rgba(100, 150, 255, 0.15);
            transition: right 0.5s cubic-bezier(0.22, 1, 0.36, 1);
            overflow-y: auto;
            font-family: "Sawarabi Mincho", serif;
            color: rgba(255, 255, 255, 0.8);
        }
        #content-panel.open {
            right: 0;
        }
        .panel-header {
            display: flex;
            justify-content: flex-end;
            padding: 16px;
            position: sticky;
            top: 0;
            background: rgba(10, 21, 32, 0.95);
        }
        .panel-close {
            background: none;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.6);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        .panel-close:hover {
            border-color: rgba(255, 255, 255, 0.5);
            color: rgba(255, 255, 255, 0.9);
        }
        .panel-body {
            padding: 0 24px 24px;
            line-height: 1.8;
        }
        .panel-body iframe {
            width: 100%;
            height: 70vh;
            border: none;
            border-radius: 4px;
        }
        .panel-body a {
            color: rgba(120, 170, 255, 0.9);
        }
    `;
    document.head.appendChild(style);
}

/**
 * ナビゲーションの初期化
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.Mesh[]} kessonMeshes
 * @param {THREE.WebGLRenderer} renderer
 */
export function initNavigation(camera, kessonMeshes, renderer) {
    _camera = camera;
    _kessonMeshes = kessonMeshes;
    _renderer = renderer;

    injectStyles();
    createNavLinks();

    // クリックで光を検出
    renderer.domElement.addEventListener('click', onCanvasClick);
    
    // ホバーでカーソル変更
    renderer.domElement.addEventListener('mousemove', onCanvasHover);
}

function onCanvasClick(event) {
    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_kessonMeshes);

    if (intersects.length > 0) {
        const mesh = intersects[0].object;
        const id = mesh.userData.id;
        onKessonClick(id, mesh);
    } else if (_isOpen) {
        closePanel();
    }
}

function onCanvasHover(event) {
    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_kessonMeshes);

    _renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

function onKessonClick(id, mesh) {
    // TODO: kesson ID → コンテンツのマッピング
    // 将来: data/kesson/*.yaml から読み込む
    // 今はデモとしてパネルを開く
    openPanel(`
        <h2 style="letter-spacing: 0.2em; font-weight: normal; margin-bottom: 16px;">欠損 #${id}</h2>
        <p style="opacity: 0.6; margin-bottom: 24px;">この光はまだ名前を持たない。</p>
        <hr style="border-color: rgba(100,150,255,0.15); margin: 24px 0;">
        <p>
            <a href="${HTML_SITE_URL}" target="_blank" rel="noopener">
                → HTML版で読む
            </a>
        </p>
    `);
}
