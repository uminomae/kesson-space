// navigation.js — ナビゲーション統合（イベント + オーブ + ビューアー）

import * as THREE from 'three';
import { toggles } from './config.js';
import { injectViewerStyles, isViewerOpen, openPdfViewer } from './viewer.js';
import { createNavObjects, updateNavObjects, setGemHover, setXLogoHover, isNavLabelFocused } from './nav-objects.js';
import { getScrollProgress } from './controls.js';
import { interactionPxFromViewportHeight } from './nav/responsive.js';

let _camera;
let _renderer;
let _xLogoCamera;
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
let _navMeshes = [];
let _xLogoGroup = null;

let _pointerDownPos = null;
const DRAG_THRESHOLD_BASE_PX = 5;

function getDragThresholdPx() {
    // Phase C: 入力しきい値のみレスポンシブ化（演出パラメータは対象外）
    return interactionPxFromViewportHeight(DRAG_THRESHOLD_BASE_PX);
}

function onPointerDown(event) {
    _pointerDownPos = { x: event.clientX, y: event.clientY };
}

function getHitDataFromObject(hitObj) {
    let current = hitObj;
    while (current) {
        const data = current.userData;
        if (data && data.url) return data;
        const hitSpriteData = data && data.hitSprite && data.hitSprite.userData;
        if (hitSpriteData && hitSpriteData.url) return hitSpriteData;
        current = current.parent || null;
    }
    return null;
}

function onPointerUp(event) {
    if (isViewerOpen() || !_pointerDownPos) return;

    if (getScrollProgress() > 0.1) {
        _pointerDownPos = null;
        return;
    }

    const dx = event.clientX - _pointerDownPos.x;
    const dy = event.clientY - _pointerDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > getDragThresholdPx()) {
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
            hitData = getHitDataFromObject(xHits[0].object);
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
            window.open(hitData.url, '_blank', 'noopener,noreferrer');
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
    const hasFocusedNavLabel = isNavLabelFocused();

    if (isViewerOpen() || !toggles.navOrbs || getScrollProgress() > 0.1) {
        _renderer.domElement.style.cursor = 'default';
        if (!hasFocusedNavLabel) {
            setGemHover(false);
            setXLogoHover(false);
        }
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
            const xHitData = getHitDataFromObject(xHits[0].object);
            isGemHit = !!(xHitData && xHitData.isGem);
            isXLogoHit = !!(xHitData && xHitData.isXLogo);
        }
    }

    _raycaster.setFromCamera(_mouse, _camera);
    const intersects = _raycaster.intersectObjects(_navMeshes, true);

    if (intersects.length > 0) {
        isHovering = true;
        const hitObj = intersects[0].object;
        isGemHit = isGemHit || hitObj.userData.isGem || (hitObj.parent && hitObj.parent.userData.isGem);
    }

    _renderer.domElement.style.cursor = isHovering ? 'pointer' : 'default';
    if (hasFocusedNavLabel) return;
    setGemHover(isGemHit);
    setXLogoHover(isXLogoHit);
}

export function initNavigation({ scene, camera, renderer, xLogoGroup, xLogoCamera }) {
    _camera = camera;
    _renderer = renderer;
    _xLogoGroup = xLogoGroup || null;
    _xLogoCamera = xLogoCamera || null;

    // A11Y-GUARD: do NOT make renderer.domElement (canvas) tabbable here.
    // Tab order is intentionally handled by DOM insertion order of nav labels + scroll-ui focus switching.
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
