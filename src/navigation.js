// navigation.js — ナビゲーション統合（イベント + オーブ + ビューアー）

import * as THREE from 'three';
import { toggles } from './config.js';
import { injectViewerStyles, isViewerOpen, openPdfViewer } from './viewer.js';
import { createNavObjects, updateNavObjects } from './nav-objects.js';

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
    if (isViewerOpen() || !toggles.navOrbs) {
        _renderer.domElement.style.cursor = 'default';
        return;
    }

    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_navMeshes, true);

    _renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
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
    _navMeshes.forEach(g => g.visible = toggles.navOrbs);
    if (toggles.navOrbs) {
        updateNavObjects(_navMeshes, time);
    }
}
