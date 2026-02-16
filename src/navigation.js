// navigation.js — ナビゲーション統合（イベント + オーブ + ビューアー）

import * as THREE from 'three';
import { toggles } from './config.js';
import { injectViewerStyles, isViewerOpen, openPdfViewer, openXTimeline } from './viewer.js';
import { createNavObjects, updateNavObjects, setGemHover, setXLogoHover } from './nav-objects.js';
import { getScrollProgress } from './controls.js';

let _camera;
let _renderer;
let _xLogoCamera;
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
let _navMeshes = [];
let _xLogoGroup = null;

let _pointerDownPos = null;
const DRAG_THRESHOLD = 5;

function onPointerDown(event) {
    _pointerDownPos = { x: event.clientX, y: event.clientY };
}

function onPointerUp(event) {
    if (isViewerOpen() || !_pointerDownPos) return;

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

    let hitData = null;

    if (_xLogoGroup && _xLogoCamera) {
        _raycaster.setFromCamera(_mouse, _xLogoCamera);
        const xHits = _raycaster.intersectObjects([_xLogoGroup], true);
        if (xHits.length > 0) {
            const hitObj = xHits[0].object;
            hitData = hitObj.userData && hitObj.userData.url ? hitObj.userData : (hitObj.parent ? hitObj.parent.userData.hitSprite?.userData : null);
        }
    }

    if (!hitData && intersects.length > 0) {
        let hitObj = intersects[0].object;
        let data = hitObj.userData;

        if (!data.url) {
            const parent = hitObj.parent;
            if (parent && parent.userData.core) {
                data = parent.userData.core.userData;
            }
        }
        hitData = data && data.url ? data : null;
    }

    if (hitData && hitData.url) {
        if (hitData.isXLogo) {
            openXTimeline(hitData.url, hitData.label);
            return;
        }
        if (hitData.external) {
            window.open(hitData.url, '_blank', 'noopener,noreferrer');
        } else {
            openPdfViewer(hitData.url, hitData.label);
        }
    }
}

function onPointerMove(event) {
    if (isViewerOpen() || !toggles.navOrbs || getScrollProgress() > 0.1) {
        _renderer.domElement.style.cursor = 'default';
        setGemHover(false);
        setXLogoHover(false);
        return;
    }

    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    let isHovering = false;
    let isGemHit = false;
    let isXLogoHit = false;

    if (_xLogoGroup && _xLogoCamera) {
        _raycaster.setFromCamera(_mouse, _xLogoCamera);
        const xHits = _raycaster.intersectObjects([_xLogoGroup], true);
        if (xHits.length > 0) {
            isHovering = true;
            isXLogoHit = true;
        }
    }

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_navMeshes, true);

    if (intersects.length > 0) {
        isHovering = true;
        const hitObj = intersects[0].object;
        isGemHit = hitObj.userData.isGem || (hitObj.parent && hitObj.parent.userData.isGem);
    }

    _renderer.domElement.style.cursor = isHovering ? 'pointer' : 'default';
    setGemHover(isGemHit);
    setXLogoHover(isXLogoHit);
}

export function initNavigation({ scene, camera, renderer, xLogoGroup, xLogoCamera }) {
    _camera = camera;
    _renderer = renderer;
    _xLogoGroup = xLogoGroup || null;
    _xLogoCamera = xLogoCamera || null;

    injectViewerStyles();
    _navMeshes = createNavObjects(scene);

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
}

export function updateNavigation(time) {
    const submerged = getScrollProgress() > 0.3;
    _navMeshes.forEach(g => g.visible = toggles.navOrbs && !submerged);
    if (toggles.navOrbs && !submerged) {
        updateNavObjects(_navMeshes, time, _camera);
    }
}
