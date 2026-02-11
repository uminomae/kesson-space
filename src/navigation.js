// navigation.js — リンク・クリック・コンテンツ表示
// 中央フロート型：闇の中にガラスの閲覧窓が浮かぶ

import * as THREE from 'three';

const HTML_SITE_URL = 'https://uminomae.github.io/pjdhiro/thinking-kesson/';

let _camera;
let _renderer;
let _kessonMeshes = [];
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

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

    // 背景（ガラス外）クリックで閉じる
    viewer.addEventListener('click', (e) => {
        if (e.target === viewer) closeViewer();
    });

    // ESCで閉じる
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _isOpen) closeViewer();
    });

    return viewer;
}

function openViewer(content) {
    if (!_viewer) _viewer = createViewer();
    const body = _viewer.querySelector('.viewer-content');
    body.innerHTML = content;

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
            _isOpen = false;
        }, 500);
    }
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
        /* --- 角のナビリンク（控えめ） --- */
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

        /* --- 中央フロート閲覧ウィンドウ --- */
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
            width: 680px;
            max-width: 88vw;
            max-height: 80vh;
            overflow-y: auto;
            cursor: default;

            /* ガラス感 */
            background: rgba(15, 25, 40, 0.65);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(100, 150, 255, 0.08);
            border-radius: 3px;
            box-shadow:
                0 0 60px rgba(0, 0, 0, 0.4),
                0 0 120px rgba(30, 60, 120, 0.1),
                inset 0 0 60px rgba(20, 40, 80, 0.05);

            /* 出現アニメーション */
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
            padding: 32px 36px;
            color: rgba(255, 255, 255, 0.7);
            font-family: inherit;
            line-height: 2.0;
            font-size: 0.9rem;
            letter-spacing: 0.05em;
        }
        .viewer-content h2 {
            font-weight: normal;
            letter-spacing: 0.3em;
            font-size: 1.1rem;
            color: rgba(255, 255, 255, 0.8);
            margin: 0 0 20px;
        }
        .viewer-content p {
            margin: 0 0 16px;
        }
        .viewer-content a {
            color: rgba(140, 180, 255, 0.8);
            text-decoration: none;
            border-bottom: 1px solid rgba(140, 180, 255, 0.15);
            transition: all 0.3s;
        }
        .viewer-content a:hover {
            color: rgba(180, 210, 255, 1.0);
            border-bottom-color: rgba(140, 180, 255, 0.4);
        }
        .viewer-content hr {
            border: none;
            border-top: 1px solid rgba(100, 150, 255, 0.08);
            margin: 24px 0;
        }
        .viewer-content iframe {
            width: 100%;
            height: 60vh;
            border: 1px solid rgba(100, 150, 255, 0.08);
            border-radius: 2px;
            background: rgba(0, 0, 0, 0.3);
        }

        /* スクロールバー */
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

/**
 * ナビゲーションの初期化
 */
export function initNavigation(camera, kessonMeshes, renderer) {
    _camera = camera;
    _kessonMeshes = kessonMeshes;
    _renderer = renderer;

    injectStyles();
    createNavLinks();

    renderer.domElement.addEventListener('click', onCanvasClick);
    renderer.domElement.addEventListener('mousemove', onCanvasHover);
}

function onCanvasClick(event) {
    if (_isOpen) return;

    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_kessonMeshes);

    if (intersects.length > 0) {
        const mesh = intersects[0].object;
        onKessonClick(mesh.userData.id, mesh);
    }
}

function onCanvasHover(event) {
    if (_isOpen) return;

    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_kessonMeshes);

    _renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

function onKessonClick(id, mesh) {
    // TODO: data/kesson/*.yaml からコンテンツを読み込む
    openViewer(`
        <h2>欠損 #${id}</h2>
        <p>この光はまだ名前を持たない。</p>
        <p>闇の中で問いだけが呼吸している。</p>
        <hr>
        <p>
            <a href="${HTML_SITE_URL}" target="_blank" rel="noopener">
                欠損駆動思考 → HTML版で読む ↗
            </a>
        </p>
    `);
}
