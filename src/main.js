// main.js — エントリポイント

import * as THREE from 'three';

import { updateScene } from './scene.js';
import { initControls, updateControls, getScrollProgress } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';
import { createDevValueApplier } from './main/dev-apply.js';
import { bootstrapMainScene } from './main/bootstrap.js';
// DECISION: page-language stays under main/ because it is a startup-only concern tied to main.js orchestration.
// Keeping the file adjacent to bootstrap/render-loop reduces cross-folder hops when editing entry flow. (Phase A-1 / 2026-02-19)
import { applyPageLanguage, initLanguageListeners } from './main/page-language.js';
import { attachResizeHandler, createNavMeshFinder, startRenderLoop } from './main/render-loop.js';
import { getOrbScreenData, refreshNavLanguage, updateNavLabels, updateXLogo, updateXLogoLabel } from './nav-objects.js';
import { refreshDevlogLanguage } from './devlog/devlog.js';
import { initLangToggle } from './lang-toggle.js';
import { initTopbarConsole } from './topbar-console.js';
import { detectLang } from './i18n.js';
import { breathConfig, liquidParams, toggles } from './config.js';
import { initScrollUI, refreshGuideLang, updateScrollUI } from './scroll-ui.js';
import { initMouseTracking, updateMouseSmoothing } from './mouse-state.js';
import { refreshArticlesLanguage } from './pages/articles-section.js';
import { createSdfEntity } from './sdf-entity.js';

const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

initMouseTracking();

applyPageLanguage(detectLang());
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

initControls(camera, container, renderer);
initNavigation({ scene, camera, renderer, xLogoGroup: xLogo.group, xLogoCamera: xLogo.camera });
initScrollUI();

let sdfEntity = null;
if (toggles.sdfEntity) {
    sdfEntity = createSdfEntity();
    scene.add(sdfEntity.mesh);
}

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
    sdfEntity,
});
