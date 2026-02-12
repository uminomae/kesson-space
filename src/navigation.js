// navigation.js — ナビゲーション統合（イベント + オーブ + ビューアー）

import * as THREE from 'three';
import { toggles } from './config.js';
import { injectViewerStyles, isViewerOpen, openPdfViewer } from './viewer.js';
import { createNavObjects, updateNavObjects, setGemHover } from './nav-objects.js';
import { getScrollProgress } from './controls.js';

let _camera;
let _renderer;
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
let _navMeshes = [];

let _pointerDownPos = null;
const DRAG_THRESHOLD = 5;

function onPointerDown(event) {
    _pointerDownPos = { x: event.clientX, y: event.clientY };
}

function onPointerUp(event) {
    if (isViewerOpen() || !_pointerDownPos) return;

    // 潜水中はクリック無効
    if (getScrollProgress() > 0.1) {
        _pointerDownPos = null;
        return;
    }

    const dx = event.clientX - _pointerDownPos.x;
    const dy = event.clientY - _pointerDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        _pointerDownPos = null;
        return;
    }
    _pointerDownPos = null;

    if (!toggles.navOrbs) return;

    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_navMeshes, true);

    if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        let data = hitObj.userData;

        // Groupの子にヒットした場合は親のcoreからuserDataを取得
        if (!data.url) {
            const parent = hitObj.parent;
            if (parent && parent.userData.core) {
                data = parent.userData.core.userData;
            }
        }

        if (data.url) {
            // CHANGED: 外部リンクはwindow.openで開く（PDFビューアーではない）
            if (data.external) {
                window.open(data.url, '_blank', 'noopener,noreferrer');
            } else {
                openPdfViewer(data.url, data.label);
            }
        }
    }
}

function onPointerMove(event) {
    if (isViewerOpen() || !toggles.navOrbs || getScrollProgress() > 0.1) {
        _renderer.domElement.style.cursor = 'default';
        setGemHover(false);  // CHANGED
        return;
    }

    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_navMeshes, true);

    const isHovering = intersects.length > 0;
    _renderer.domElement.style.cursor = isHovering ? 'pointer' : 'default';

    // CHANGED: Gemホバー判定
    if (isHovering) {
        const hitObj = intersects[0].object;
        const isGemHit = hitObj.userData.isGem || (hitObj.parent && hitObj.parent.userData.isGem);
        setGemHover(isGemHit);
    } else {
        setGemHover(false);
    }
}

export function initNavigation({ scene, camera, renderer }) {
    _camera = camera;
    _renderer = renderer;

    injectViewerStyles();
    _navMeshes = createNavObjects(scene);

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
}

export function updateNavigation(time) {
    // 潜水中はオーブ非表示
    const submerged = getScrollProgress() > 0.3;
    _navMeshes.forEach(g => g.visible = toggles.navOrbs && !submerged);
    if (toggles.navOrbs && !submerged) {
        updateNavObjects(_navMeshes, time);
    }
}
