// main.js — エントリポイント

import * as THREE from 'three';

import { updateScene } from './scene.js';
import { initControls, updateControls, getScrollProgress } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';
import { createDevValueApplier } from './main/dev-apply.js';
import { bootstrapMainScene } from './main/bootstrap.js';
import { attachResizeHandler, createNavMeshFinder, startRenderLoop } from './main/render-loop.js';
import { getOrbScreenData, refreshNavLanguage, updateNavLabels, updateXLogo, updateXLogoLabel } from './nav-objects.js';
import { initLangToggle } from './lang-toggle.js';
import { detectLang, LANG_CHANGE_EVENT, t } from './i18n.js';
import { breathConfig, liquidParams, toggles } from './config.js';
import { initScrollUI, refreshGuideLang, updateScrollUI } from './scroll-ui.js';
import { initMouseTracking, updateMouseSmoothing } from './mouse-state.js';

const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

initMouseTracking();

function applyPageLanguage(lang) {
    const strings = t(lang);

    const titleH1 = document.getElementById('title-h1');
    const titleSub = document.getElementById('title-sub');
    if (titleH1) titleH1.textContent = strings.title;
    if (titleSub) titleSub.textContent = strings.subtitle;

    const creditCollab = document.getElementById('credit-collab');
    if (creditCollab) creditCollab.textContent = strings.credit;
    const creditSig = document.getElementById('credit-signature');
    if (creditSig) creditSig.textContent = strings.creditSignature;

    const taglineContainer = document.getElementById('taglines');
    if (taglineContainer && strings.taglines) {
        taglineContainer.innerHTML = '';
        const isEn = lang === 'en';
        strings.taglines.forEach((text) => {
            const p = document.createElement('p');
            p.className = isEn ? 'tagline-en' : 'tagline';
            p.textContent = text;
            taglineContainer.appendChild(p);
        });
    }

    document.documentElement.lang = lang;
}

applyPageLanguage(detectLang());
initLangToggle();

const container = document.getElementById('canvas-container');
const {
    scene,
    camera,
    renderer,
    composer,
    distortionPass,
    dofPass,
    fluidSystem,
    liquidSystem,
    liquidTarget,
    xLogoScene,
    xLogoCamera,
    xLogoGroup,
} = bootstrapMainScene(container);

initControls(camera, container, renderer);
initNavigation({ scene, camera, renderer, xLogoGroup, xLogoCamera });
initScrollUI();

const findNavMeshes = createNavMeshFinder(scene);
const applyDevValue = createDevValueApplier({ distortionPass, dofPass, fluidSystem, liquidSystem });

if (DEV_MODE) {
    import('./dev-panel.js').then(({ initDevPanel }) => {
        initDevPanel(applyDevValue);
    });
    import('./dev-links-panel.js').then(({ initDevLinksPanel }) => {
        initDevLinksPanel();
    });
}

let refreshDevlogLanguage = null;
import('./devlog/devlog.js').then((mod) => {
    refreshDevlogLanguage = mod.refreshDevlogLanguage || null;
});

window.addEventListener(LANG_CHANGE_EVENT, (event) => {
    const nextLang = event.detail?.lang || detectLang();
    applyPageLanguage(nextLang);
    refreshGuideLang();
    refreshNavLanguage();
    if (typeof refreshDevlogLanguage === 'function') {
        refreshDevlogLanguage();
    }
});

const clock = new THREE.Clock();
attachResizeHandler({ camera, xLogoCamera, renderer, composer });

startRenderLoop({
    clock,
    camera,
    xLogoCamera,
    scene,
    xLogoScene,
    renderer,
    composer,
    distortionPass,
    dofPass,
    fluidSystem,
    liquidSystem,
    liquidTarget,
    findNavMeshes,
    updateMouseSmoothing,
    updateControls,
    updateScene,
    updateNavigation,
    updateXLogo,
    updateScrollUI,
    getScrollProgress,
    updateNavLabels,
    updateXLogoLabel,
    getOrbScreenData,
    toggles,
    breathConfig,
    liquidParams,
});
