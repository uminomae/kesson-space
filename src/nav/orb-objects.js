import * as THREE from 'three';

import { detectLang, t } from '../i18n.js';
import { toggles, navOrbParams } from '../config.js';
import { getScrollProgress } from '../controls.js';
import {
    createNavLabelButton,
    getFocusedOrbIndex,
    syncLabelFocusState,
    updateLabelPosition as updateSingleLabel,
} from './labels.js';
import { computeOrbScreenData } from './orb-screen.js';
import { interactionWorldFromViewportHeight, worldFromViewportHeight } from './responsive.js';
import { setGemHover, setXLogoHover } from './x-logo-objects.js';

// DECISION: orb-specific creation/update/labeling is isolated here because these objects share one lifecycle and
// are discovered by createNavMeshFinder via userData.index/core; splitting by lifecycle avoids mixing with x-logo internals.
// (Phase B-1 / 2026-02-19)

const NAV_ORB_ANGLES = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
const ORB_HIT_BASE_SCALE = 4.0;
const LABEL_Y_OFFSET = 3.5;

let _labelElements = [];
let _navMeshes = null;

const _labelWorldPos = new THREE.Vector3();

function getNavOrbWorldPosition(index) {
    const angle = NAV_ORB_ANGLES[index] ?? 0;
    return [
        navOrbParams.centerX + (Math.sin(angle) * navOrbParams.radius),
        navOrbParams.centerY,
        navOrbParams.centerZ + (Math.cos(angle) * navOrbParams.radius),
    ];
}

function applyNavOrbPosition(group, index) {
    if (!group) return;
    const [x, y, z] = getNavOrbWorldPosition(index);
    group.position.set(x, y, z);
    group.userData.baseY = y;
    if (group.userData.core?.userData) {
        group.userData.core.userData.baseY = y;
    }
}

function getResponsiveOrbHitScale() {
    return interactionWorldFromViewportHeight(ORB_HIT_BASE_SCALE);
}

function createHtmlLabel(text, extraClass, url, isExternal, navType, navIndex) {
    return createNavLabelButton({
        text,
        extraClass,
        url,
        isExternal,
        navType,
        navIndex,
        onGemHover: setGemHover,
        onXLogoHover: setXLogoHover,
    });
}

function replaceLabel(oldLabel, text, extraClass, url, isExternal, navType, navIndex) {
    if (oldLabel instanceof HTMLElement) oldLabel.remove();
    return createHtmlLabel(text, extraClass, url, isExternal, navType, navIndex);
}

export function createNavObjects(scene) {
    const navMeshes = [];
    const lang = detectLang();
    const strings = t(lang);

    NAV_ORB_ANGLES.forEach((_angle, index) => {
        const navItem = strings.nav[index];
        const group = new THREE.Group();
        const navPosition = getNavOrbWorldPosition(index);
        group.position.set(...navPosition);

        const hitMaterial = new THREE.SpriteMaterial({
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
        });
        const coreSprite = new THREE.Sprite(hitMaterial);
        const orbHitScale = getResponsiveOrbHitScale();
        coreSprite.scale.set(orbHitScale, orbHitScale, orbHitScale);

        coreSprite.userData = {
            type: 'nav',
            url: navItem.url,
            label: navItem.label,
            baseY: navPosition[1],
            index,
            isHitTarget: true,
        };

        group.add(coreSprite);

        group.userData = {
            baseY: navPosition[1],
            index,
            core: coreSprite,
            baseScale: orbHitScale,
        };

        scene.add(group);
        navMeshes.push(group);

        _labelElements.push(createHtmlLabel(navItem.label, '', navItem.url, false, 'orb', index));
    });

    _navMeshes = navMeshes;
    return navMeshes;
}

export function refreshOrbLanguage() {
    const strings = t(detectLang());

    if (!_navMeshes || _navMeshes.length === 0) return;

    let orbIndex = 0;
    _navMeshes.forEach((group) => {
        const navItem = strings.nav[orbIndex];
        if (!navItem) {
            orbIndex += 1;
            return;
        }

        const core = group.userData.core;
        if (core && core.userData) {
            core.userData.url = navItem.url;
            core.userData.label = navItem.label;
        }

        _labelElements[orbIndex] = replaceLabel(
            _labelElements[orbIndex],
            navItem.label,
            '',
            navItem.url,
            false,
            'orb',
            orbIndex
        );
        orbIndex += 1;
    });

    for (let i = orbIndex; i < _labelElements.length; i += 1) {
        const label = _labelElements[i];
        if (label instanceof HTMLElement) label.remove();
    }
    _labelElements.length = orbIndex;
}

// KEPT: camera arg is retained for compatibility with existing call sites (navigation.js).
export function updateNavObjects(navMeshes, time, camera) {
    void camera;
    const orbFloatAmplitude = worldFromViewportHeight(0.3);
    const orbHitScale = getResponsiveOrbHitScale();

    navMeshes.forEach((obj) => {
        const data = obj.userData;
        if (data.core) {
            data.core.scale.set(orbHitScale, orbHitScale, orbHitScale);
            data.baseScale = orbHitScale;
        }
        const floatOffset = Math.sin(time * 0.8 + data.index) * orbFloatAmplitude;
        obj.position.y = data.baseY + floatOffset;
    });
}

export function updateNavOrbPositions() {
    if (!_navMeshes || _navMeshes.length === 0) return;
    _navMeshes.forEach((group) => {
        applyNavOrbPosition(group, group.userData.index ?? 0);
    });
}

export function updateNavLabels(navMeshes, camera) {
    const visible = toggles.navOrbs;
    const scrollFade = Math.max(0, 1 - getScrollProgress() * 5);
    const orbLabelYOffset = worldFromViewportHeight(LABEL_Y_OFFSET);

    navMeshes.forEach((group, i) => {
        const el = _labelElements[i];
        if (!el) return;

        if (!visible || scrollFade <= 0) {
            el.classList.add('nav-label--hidden');
            syncLabelFocusState(el, false);
            return;
        }

        group.getWorldPosition(_labelWorldPos);
        updateSingleLabel({
            el,
            worldPos: _labelWorldPos,
            yOffset: orbLabelYOffset,
            camera,
            scrollFade,
        });
    });
}

export function getOrbScreenData(navMeshes, camera) {
    const focusedOrbIndex = getFocusedOrbIndex();
    return computeOrbScreenData(navMeshes, camera, focusedOrbIndex);
}

export function isNavLabelFocused() {
    const active = document.activeElement;
    return active instanceof HTMLElement && active.classList.contains('nav-label');
}
