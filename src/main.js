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
// CHANGED(2026-03-24): #151 — Devlog feature hidden; skip initialization to avoid unnecessary resource loading
// import { refreshDevlogLanguage } from './devlog/devlog.js';
import { initLangToggle } from './lang-toggle.js';
import { initMobileNavAutoCollapse } from './main/mobile-nav.js';
import { initTopbarConsole } from './topbar-console.js';
import { initFontSizeCtrl } from './font-size-ctrl.js';
import { detectLang } from './i18n.js';
import { breathConfig, liquidParams, toggles } from './config.js';
import { initScrollUI, refreshGuideLang, updateScrollUI } from './scroll-ui.js';
import { initMouseTracking, updateMouseSmoothing } from './mouse-state.js';
import { refreshArticlesLanguage } from './pages/articles-section.js';
import { initGuides, setGuidesLanguage } from './guides.js';
import { createSdfEntity } from './sdf-entity.js';

const DEV_MODE = new URLSearchParams(window.location.search).has('dev');
const devApplierRef = {
    // Keep dev font controls usable even when WebGL bootstrap fails.
    current: createDevValueApplier({
        distortionPass: null,
        dofPass: null,
        fluidSystem: null,
        liquidSystem: null,
    }),
};

function applyDevValue(key, value) {
    try {
        devApplierRef.current(key, value);
    } catch (error) {
        console.warn(`[dev-panel] Failed to apply "${key}"`, error);
    }
}

initMouseTracking();

applyPageLanguage(detectLang());
initLangToggle();
initMobileNavAutoCollapse();
initTopbarConsole();
initFontSizeCtrl();
initScrollUI();
initGuides({ lang: detectLang() });

if (DEV_MODE) {
    import('./dev-panel.js').then(({ initDevPanel }) => {
        initDevPanel(applyDevValue);
    });
    import('./dev-links-panel.js').then(({ initDevLinksPanel }) => {
        initDevLinksPanel();
    });
    // CHANGED(2026-03-25): #169 — Dev hub panel (footer link + modal shortcuts)
    import('./dev-hub-panel.js').then(({ initDevHubPanel }) => {
        initDevHubPanel();
    });
}

initLanguageListeners({
    refreshGuideLang,
    refreshNavLanguage,
    // CHANGED(2026-03-24): #151 — Devlog hidden; skip language refresh
    // refreshDevlogLanguage,
    refreshDevlogLanguage: () => {},
    refreshArticlesLanguage,
    refreshGuidesLanguage: () => setGuidesLanguage(detectLang()),
});

try {
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

    const sdfEntity = createSdfEntity();
    sdfEntity.mesh.visible = Boolean(toggles.sdfEntity);
    scene.add(sdfEntity.mesh);

    const findNavMeshes = createNavMeshFinder(scene);
    devApplierRef.current = createDevValueApplier({
        distortionPass: passes.distortionPass,
        dofPass: passes.dofPass,
        fluidSystem: effects.fluidSystem,
        liquidSystem: effects.liquidSystem,
    });

    if (DEV_MODE) {
        import('./dev-stats.js').then(({ initDevStats }) => {
            initDevStats().catch((err) => {
                console.warn('[dev-stats] init failed:', err.message);
            });
        });
    }

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
} catch (error) {
    console.warn('[main] Scene bootstrap failed; continuing without WebGL scene.', error);
}
