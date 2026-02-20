import * as THREE from 'three';

import { breathValue } from './animation-utils.js';
import { updateScene as updateBaseScene } from './scene.js';
import { initControls, updateControls, getScrollProgress } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';
import { createDevValueApplier } from './main/dev-apply.js';
import { bootstrapMainScene } from './main/bootstrap.js';
import { applyPageLanguage, initLanguageListeners } from './main/page-language.js';
import { attachResizeHandler, createNavMeshFinder, startRenderLoop } from './main/render-loop.js';
import { getOrbScreenData, refreshNavLanguage, updateNavLabels, updateXLogo, updateXLogoLabel } from './nav-objects.js';
import { refreshDevlogLanguage } from './devlog/devlog.js';
import { initLangToggle } from './lang-toggle.js';
import { initTopbarConsole } from './topbar-console.js';
import { detectLang, LANG_CHANGE_EVENT } from './i18n.js';
import { breathConfig, consciousOverlayParams, liquidParams, sceneParams, toggles } from './config.js';
import { initScrollUI, refreshGuideLang, updateScrollUI } from './scroll-ui.js';
import { getRawMouse, initMouseTracking, updateMouseSmoothing } from './mouse-state.js';
import { refreshArticlesLanguage } from './pages/articles-section.js';
import { createSdfConsciousnessEntity, updateSdfConsciousnessEntity } from './consciousness/sdf-entity.js';
import {
    createConsciousGateRaysOverlay,
    initConsciousGateRaysConsole,
    updateConsciousGateRaysOverlay,
} from './consciousness/gate-rays-overlay.js';

const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

const CONSCIOUSNESS_COPY = {
    ja: {
        title: '意識の構造',
        subtitle: 'Consciousness Prototype',
        collab: 'SDFレイマーチングで意識場を探索中',
        taglines: [
            '波として滲み、粒として結晶する',
            '観測のたびに輪郭を変える意識の層',
        ],
    },
    en: {
        title: 'Structure of Consciousness',
        subtitle: 'Consciousness Prototype',
        collab: 'Exploring a consciousness field with Raymarching SDF',
        taglines: [
            'Diffusing as a wave, crystallizing as particles',
            'A layered mind re-shaped by every observation',
        ],
    },
};

function applyConsciousnessCopy(lang) {
    const resolvedLang = lang === 'en' ? 'en' : 'ja';
    const text = CONSCIOUSNESS_COPY[resolvedLang];

    const topbarMainTitle = document.getElementById('topbar-main-title');
    const topbarSubtitle = document.getElementById('topbar-subtitle');
    const creditCollab = document.getElementById('credit-collab');
    const taglineContainer = document.getElementById('taglines');

    if (topbarMainTitle) topbarMainTitle.textContent = text.title;
    if (topbarSubtitle) topbarSubtitle.textContent = text.subtitle;
    if (creditCollab) creditCollab.textContent = text.collab;

    if (taglineContainer) {
        taglineContainer.innerHTML = '';
        text.taglines.forEach((line) => {
            const p = document.createElement('p');
            p.className = resolvedLang === 'en' ? 'tagline-en' : 'tagline';
            p.textContent = line;
            taglineContainer.appendChild(p);
        });
    }

    document.title = resolvedLang === 'en'
        ? 'Structure of Consciousness - Consciousness Prototype'
        : '意識の構造 - Consciousness Prototype';
}

if (!Object.prototype.hasOwnProperty.call(toggles, 'sdfEntity')) {
    toggles.sdfEntity = false;
}
toggles.sdfEntity = true;

// Consciousness page: hide legacy scene objects so only the SDF field remains visible.
toggles.background = false;
toggles.kessonLights = false;
toggles.water = false;
toggles.navOrbs = false;
toggles.fog = false;
toggles.postProcess = false;
toggles.fluidField = false;
toggles.liquid = false;
toggles.orbRefraction = false;
toggles.vortex = false;
toggles.heatHaze = false;
toggles.autoRotate = false;

// Reframe camera for subjective "inner field" composition.
sceneParams.camX = 0;
sceneParams.camY = 4;
sceneParams.camZ = 24;
sceneParams.camTargetX = 0;
sceneParams.camTargetY = -2.6;
sceneParams.camTargetZ = 0;

// Keep a distant baseline with a gentler breathing zoom, plus occasional pulse zoom-ins.
breathConfig.fovAmplitude = 0.18;
breathConfig.fovPulseAmplitude = 0.38;
breathConfig.fovPulseSpeed = 0.28;
breathConfig.fovPulseSharpness = 8.0;

initMouseTracking();

const initialLang = detectLang();
applyPageLanguage(initialLang);
applyConsciousnessCopy(initialLang);
initLangToggle();
initTopbarConsole();

const container = document.getElementById('canvas-container');
const {
    scene,
    camera,
    renderer,
    composer,
    passes,
    effects,
    xLogo,
} = bootstrapMainScene(container);

const consciousnessEntity = createSdfConsciousnessEntity(scene, camera, {
    enabled: toggles.sdfEntity,
});
const gateRaysOverlay = createConsciousGateRaysOverlay(scene, camera, {
    params: consciousOverlayParams,
});
initConsciousGateRaysConsole(gateRaysOverlay);

function updateSceneWithConsciousness(time) {
    updateBaseScene(time);

    const breath = breathValue(time, breathConfig.period);
    const mouse = getRawMouse();
    updateSdfConsciousnessEntity(consciousnessEntity, {
        time,
        breath,
        mouse,
        camera,
        enabled: toggles.sdfEntity,
    });
    updateConsciousGateRaysOverlay(gateRaysOverlay, {
        time,
        camera,
    });
}

initControls(camera, container, renderer);
initNavigation({ scene, camera, renderer, xLogoGroup: xLogo.group, xLogoCamera: xLogo.camera });
initScrollUI();

const findNavMeshes = createNavMeshFinder(scene);
const applyDevValue = createDevValueApplier({
    distortionPass: passes.distortionPass,
    dofPass: passes.dofPass,
    fluidSystem: effects.fluidSystem,
    liquidSystem: effects.liquidSystem,
});

if (DEV_MODE) {
    import('./dev-panel.js').then(({ initDevPanel }) => {
        initDevPanel(applyDevValue);
    });
    import('./dev-links-panel.js').then(({ initDevLinksPanel }) => {
        initDevLinksPanel();
    });
    import('./dev-stats.js').then(({ initDevStats }) => {
        initDevStats().catch((err) => {
            console.warn('[dev-stats] init failed:', err.message);
        });
    });
}

initLanguageListeners({
    refreshGuideLang,
    refreshNavLanguage,
    refreshDevlogLanguage,
    refreshArticlesLanguage,
});

window.addEventListener(LANG_CHANGE_EVENT, (event) => {
    const nextLang = event.detail?.lang || detectLang();
    applyConsciousnessCopy(nextLang);
});

const clock = new THREE.Clock();
attachResizeHandler({ camera, xLogoCamera: xLogo.camera, renderer, composer });

startRenderLoop({
    clock,
    camera,
    scene,
    renderer,
    composer,
    passes,
    effects,
    xLogo,
    findNavMeshes,
    updateMouseSmoothing,
    updateControls,
    updateScene: updateSceneWithConsciousness,
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
