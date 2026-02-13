// main.js — エントリポイント

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { createScene, updateScene, sceneParams, getCamera } from './scene.js';
import { initControls, updateControls, setAutoRotateSpeed, setCameraPosition, setTarget, getScrollProgress } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';
import { getOrbScreenData, updateNavLabels } from './nav-objects.js';
import { rebuildGem, updateGemPosition } from './nav-objects.js';
import { initLangToggle } from './lang-toggle.js';
import { detectLang, t } from './i18n.js';
import { DistortionShader } from './shaders/distortion-pass.js';
import { createFluidSystem } from './shaders/fluid-field.js';
import { toggles, breathConfig, distortionParams, fluidParams, gemParams, vortexParams } from './config.js';
import { initScrollUI, updateScrollUI } from './scroll-ui.js';

let composer;
let distortionPass;
let fluidSystem;
let navMeshesCache = [];

const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

// ============================
// マウストラッキング
// ============================
let _mouseX = 0.5, _mouseY = 0.5;
let _smoothMouseX = 0.5, _smoothMouseY = 0.5;
let _prevMouseX = 0.5, _prevMouseY = 0.5;

window.addEventListener('mousemove', (e) => {
    _mouseX = e.clientX / window.innerWidth;
    _mouseY = 1.0 - (e.clientY / window.innerHeight);
});
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        _mouseX = e.touches[0].clientX / window.innerWidth;
        _mouseY = 1.0 - (e.touches[0].clientY / window.innerHeight);
    }
});

// ============================
// 言語初期化
// ============================
const lang = detectLang();
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
    strings.taglines.forEach(text => {
        const p = document.createElement('p');
        p.className = isEn ? 'tagline-en' : 'tagline';
        p.textContent = text;
        taglineContainer.appendChild(p);
    });
}

document.documentElement.lang = lang;
initLangToggle();

const container = document.getElementById('canvas-container');
const { scene, camera, renderer } = createScene(container);

// ============================
// 流体システム
// ============================
fluidSystem = createFluidSystem(renderer);

// ============================
// EffectComposer
// ============================
composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

distortionPass = new ShaderPass(DistortionShader);
composer.addPass(distortionPass);

initControls(camera, container, renderer);
initNavigation({ scene, camera, renderer });
initScrollUI();

function findNavMeshes() {
    if (navMeshesCache.length > 0) return navMeshesCache;
    const found = [];
    scene.traverse((obj) => {
        if (obj.isGroup && obj.userData && typeof obj.userData.index === 'number' && obj.userData.core) {
            found.push(obj);
        }
    });
    found.sort((a, b) => a.userData.index - b.userData.index);
    navMeshesCache = found;
    return found;
}

// --- HTMLオーバーレイ ---
function updateOverlay(key, val) {
    const overlay = document.getElementById('overlay');
    const h1 = document.getElementById('title-h1');
    const sub = document.getElementById('title-sub');
    if (!overlay || !h1 || !sub) return;
    switch (key) {
        case 'titleBottom':  overlay.style.bottom = val + 'px'; break;
        case 'titleLeft':    overlay.style.left = val + 'px'; break;
        case 'titleSize':    h1.style.fontSize = val + 'rem'; break;
        case 'titleSpacing': h1.style.letterSpacing = val + 'em'; break;
        case 'titleOpacity': h1.style.color = `rgba(255,255,255,${val})`; break;
        case 'subSize':      sub.style.fontSize = val + 'rem'; break;
        case 'subOpacity':   sub.style.color = `rgba(255,255,255,${val})`; break;
        case 'titleGlow':    h1.style.textShadow = `0 0 ${val}px rgba(100,150,255,0.3)`; break;
    }
}

// --- devパネル用：スライダー値をユニフォームに反映 ---
function applyDevValue(key, value) {
    if (key in toggles) { toggles[key] = value; return; }
    if (key in breathConfig) { breathConfig[key] = value; return; }
    if (key in sceneParams) sceneParams[key] = value;

    if (key === 'camX' || key === 'camY' || key === 'camZ') {
        setCameraPosition(sceneParams.camX, sceneParams.camY, sceneParams.camZ);
    }
    if (key === 'camTargetY') setTarget(0, value, -10);
    if (key === 'autoRotateSpd') setAutoRotateSpeed(value);

    if (key === 'distStrength')   distortionPass.uniforms.uStrength.value = value;
    if (key === 'distAberration') distortionPass.uniforms.uAberration.value = value;
    if (key === 'turbulence')     distortionPass.uniforms.uTurbulence.value = value;
    if (key === 'baseBlur')       distortionPass.uniforms.uBaseBlur.value = value;
    if (key === 'orbBlur')        distortionPass.uniforms.uBlurAmount.value = value;
    if (key === 'innerGlow')      distortionPass.uniforms.uInnerGlow.value = value;
    if (key === 'haloIntensity')  distortionPass.uniforms.uHaloIntensity.value = value;
    if (key === 'haloWidth')      distortionPass.uniforms.uHaloWidth.value = value;
    if (key === 'haloColorR')     distortionPass.uniforms.uHaloColor.value.x = value;
    if (key === 'haloColorG')     distortionPass.uniforms.uHaloColor.value.y = value;
    if (key === 'haloColorB')     distortionPass.uniforms.uHaloColor.value.z = value;

    if (key === 'fluidForce')     fluidSystem.uniforms.uForce.value = value;
    if (key === 'fluidCurl')      fluidSystem.uniforms.uCurl.value = value;
    if (key === 'fluidDecay')     fluidSystem.uniforms.uDecay.value = value;
    if (key === 'fluidRadius')    fluidSystem.uniforms.uRadius.value = value;
    if (key === 'fluidInfluence') distortionPass.uniforms.uFluidInfluence.value = value;

    if (key === 'heatHaze')       distortionPass.uniforms.uHeatHaze.value = value;
    if (key === 'heatHazeRadius') distortionPass.uniforms.uHeatHazeRadius.value = value;
    if (key === 'heatHazeSpeed')  distortionPass.uniforms.uHeatHazeSpeed.value = value;
    if (key === 'dofStrength')    distortionPass.uniforms.uDofStrength.value = value;
    if (key === 'dofFocusRadius') distortionPass.uniforms.uDofFocusRadius.value = value;

    // --- Gemパラメータ ---
    if (key === 'gemMeshScale')           { gemParams.meshScale = value; rebuildGem(); }
    if (key === 'gemGlowStrength')        { gemParams.glowStrength = value; rebuildGem(); }
    if (key === 'gemRimPower')            { gemParams.rimPower = value; rebuildGem(); }
    if (key === 'gemInnerGlow')           { gemParams.innerGlow = value; rebuildGem(); }
    if (key === 'gemTurbulence')          { gemParams.turbulence = value; rebuildGem(); }
    if (key === 'gemHaloWidth')           { gemParams.haloWidth = value; rebuildGem(); }
    if (key === 'gemHaloIntensity')       { gemParams.haloIntensity = value; rebuildGem(); }
    if (key === 'gemChromaticAberration') { gemParams.chromaticAberration = value; rebuildGem(); }
    if (key === 'gemLabelYOffset')        { gemParams.labelYOffset = value; }
    if (key === 'gemPosX')                { gemParams.posX = value; updateGemPosition(); }
    if (key === 'gemPosY')                { gemParams.posY = value; updateGemPosition(); }
    if (key === 'gemPosZ')                { gemParams.posZ = value; updateGemPosition(); }

    // --- 渦パラメータ（scene.jsがvortexParamsを毎フレーム参照）---
    if (key === 'vortexSpeed')     vortexParams.speed = value;
    if (key === 'vortexIntensity') vortexParams.intensity = value;
    if (key === 'vortexScale')     vortexParams.scale = value;
    if (key === 'vortexOpacity')   vortexParams.opacity = value;
    if (key === 'vortexPosX')      vortexParams.posX = value;
    if (key === 'vortexPosY')      vortexParams.posY = value;
    if (key === 'vortexPosZ')      vortexParams.posZ = value;
    if (key === 'vortexSize')      vortexParams.size = value;

    updateOverlay(key, value);
}

// --- dev-panel（?dev でのみ有効） ---
if (DEV_MODE) {
    import('./dev-panel.js').then(({ initDevPanel }) => {
        initDevPanel(applyDevValue);
    });
}

// --- スクロールコンテンツ（常時有効） ---
import('./dev-log.js').then(({ renderDevLog }) => {
    renderDevLog();
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // --- 統一呼吸値 ---
    const breathVal = (Math.sin(time * Math.PI / breathConfig.period - Math.PI / 2) + 1) * 0.5;

    // --- スクロール進捗 ---
    const scrollProg = getScrollProgress();

    // --- スクロールUI更新 ---
    updateScrollUI(scrollProg, breathVal);

    // --- マウススムージング ---
    _smoothMouseX += (_mouseX - _smoothMouseX) * 0.08;
    _smoothMouseY += (_mouseY - _smoothMouseY) * 0.08;
    const velX = _smoothMouseX - _prevMouseX;
    const velY = _smoothMouseY - _prevMouseY;
    _prevMouseX = _smoothMouseX;
    _prevMouseY = _smoothMouseY;

    updateControls(time, breathVal);
    updateScene(time);
    updateNavigation(time);

    // --- ナビメッシュ取得（フレームで1回のみ） ---
    const navs = findNavMeshes();

    // --- 流体フィールド ---
    if (toggles.fluidField) {
        fluidSystem.uniforms.uMouse.value.set(_smoothMouseX, _smoothMouseY);
        fluidSystem.uniforms.uMouseVelocity.value.set(velX, velY);
        fluidSystem.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
        fluidSystem.update();
        distortionPass.uniforms.tFluidField.value = fluidSystem.getTexture();
    } else {
        distortionPass.uniforms.uFluidInfluence.value = 0;
    }

    // --- オーブ情報更新 ---
    if (toggles.navOrbs && toggles.orbRefraction) {
        if (navs.length > 0) {
            const orbData = getOrbScreenData(navs, camera);
            for (let i = 0; i < 3; i++) {
                if (i < orbData.length) {
                    distortionPass.uniforms.uOrbs.value[i].set(orbData[i].x, orbData[i].y);
                    distortionPass.uniforms.uOrbStrengths.value[i] = orbData[i].strength;
                    distortionPass.uniforms.uOrbRadii.value[i] = orbData[i].radius;
                } else {
                    distortionPass.uniforms.uOrbStrengths.value[i] = 0.0;
                    distortionPass.uniforms.uOrbRadii.value[i] = 0.0;
                }
            }
        }
    } else {
        for (let i = 0; i < 3; i++) {
            distortionPass.uniforms.uOrbStrengths.value[i] = 0.0;
        }
    }

    distortionPass.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
    distortionPass.uniforms.uTime.value = time;
    distortionPass.uniforms.uMouse.value.set(_smoothMouseX, _smoothMouseY);

    if (!toggles.heatHaze) distortionPass.uniforms.uHeatHaze.value = 0;
    if (!toggles.dof) distortionPass.uniforms.uDofStrength.value = 0;

    updateNavLabels(navs, camera);

    if (toggles.postProcess) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

animate();
