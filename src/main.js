// main.js — エントリポイント

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { createScene, updateScene, sceneParams, getCamera } from './scene.js';
import { initControls, updateControls, setAutoRotateSpeed, setCameraPosition, getScrollProgress } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';
import { getOrbScreenData, updateNavLabels, updateXLogoLabel, updateXLogo, createXLogoObjects } from './nav-objects.js';
import { rebuildGem, updateGemPosition, rebuildXLogo, updateXLogoPosition } from './nav-objects.js';
import { initLangToggle } from './lang-toggle.js';
import { detectLang, t } from './i18n.js';
import { DistortionShader } from './shaders/distortion-pass.js';
import { createFluidSystem } from './shaders/fluid-field.js';
import { createLiquidSystem } from './shaders/liquid.js';
import { toggles, breathConfig, distortionParams, fluidParams, liquidParams, gemParams, xLogoParams, vortexParams, DEV_PARAM_REGISTRY } from './config.js';
import { initScrollUI, updateScrollUI } from './scroll-ui.js';
import { initMouseTracking, updateMouseSmoothing } from './mouse-state.js';
import { breathValue } from './animation-utils.js';

let composer;
let distortionPass;
let fluidSystem;
let liquidSystem;
let liquidTarget;  // 液体レンダリング用
let navMeshesCache = [];

const DEV_MODE = new URLSearchParams(window.location.search).has('dev');
const liquidMousePos = new THREE.Vector2();
const liquidMouseVel = new THREE.Vector2();

// ============================
// マウストラッキング（T-010: mouse-state.js に統合）
// ============================
initMouseTracking();

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
renderer.autoClear = false;

// --- Xロゴ専用シーン + 固定カメラ ---
const xLogoScene = new THREE.Scene();
const xLogoCamera = camera.clone();
const xLogoGroup = createXLogoObjects(xLogoScene);
const xLogoAmbient = new THREE.AmbientLight(0xffffff, 0.6);
const xLogoKey = new THREE.DirectionalLight(0xffffff, 0.9);
xLogoKey.position.set(10, 12, 8);
xLogoScene.add(xLogoAmbient, xLogoKey);

// ============================
// 流体システム
// ============================
fluidSystem = createFluidSystem(renderer);

// ============================
// リキッドシステム
// ============================
liquidSystem = createLiquidSystem(renderer);
liquidTarget = new THREE.WebGLRenderTarget(liquidParams.textureSize, liquidParams.textureSize, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
});

// ============================
// EffectComposer
// ============================
composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

distortionPass = new ShaderPass(DistortionShader);
composer.addPass(distortionPass);
distortionPass.uniforms.uLiquidOffsetScale.value = liquidParams.refractOffsetScale;
distortionPass.uniforms.uLiquidThreshold.value = liquidParams.refractThreshold;

initControls(camera, container, renderer);
initNavigation({ scene, camera, renderer, xLogoGroup, xLogoCamera });
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
// ★ h1/subtitleの color は CSS 固定。inline style で上書きしない。
//    表示制御は scroll-ui.js の overlay opacity/filter/transform のみで行う。
//    この方針により、devパネルやLLM修正で色が意図せず変わる問題を防止する。
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
        // REMOVED: titleOpacity — h1.style.color による inline 上書きを禁止
        // REMOVED: subOpacity  — sub.style.color による inline 上書きを禁止
        case 'subSize':      sub.style.fontSize = val + 'rem'; break;
        case 'titleGlow':    h1.style.textShadow = `0 0 ${val}px rgba(100,150,255,0.3)`; break;
    }
}

function applyLiquidUniform(configKey, value) {
    if (!liquidSystem || !liquidSystem.uniforms) return;
    if (configKey == 'timestep') liquidSystem.uniforms.simulation.uTimestep.value = value;
    if (configKey == 'dissipation') liquidSystem.uniforms.simulation.uDissipation.value = value;
    if (configKey == 'forceRadius') {
        liquidSystem.uniforms.force.uRadius.value = value;
        liquidSystem.uniforms.splat.uRadius.value = value;
    }
    if (configKey == 'forceStrength') liquidSystem.uniforms.force.uStrength.value = value;
    if (configKey == 'densityMul') liquidSystem.uniforms.render.uDensityMul.value = value;
    if (configKey == 'noiseScale') liquidSystem.uniforms.render.uNoiseScale.value = value;
    if (configKey == 'noiseSpeed') liquidSystem.uniforms.render.uNoiseSpeed.value = value;
    if (configKey == 'specularPow') liquidSystem.uniforms.render.uSpecPow.value = value;
    if (configKey == 'specularInt') liquidSystem.uniforms.render.uSpecInt.value = value;
    if (configKey == 'baseColorR') liquidSystem.uniforms.render.uBaseColor.value.x = value;
    if (configKey == 'baseColorG') liquidSystem.uniforms.render.uBaseColor.value.y = value;
    if (configKey == 'baseColorB') liquidSystem.uniforms.render.uBaseColor.value.z = value;
    if (configKey == 'highlightR') liquidSystem.uniforms.render.uHighlight.value.x = value;
    if (configKey == 'highlightG') liquidSystem.uniforms.render.uHighlight.value.y = value;
    if (configKey == 'highlightB') liquidSystem.uniforms.render.uHighlight.value.z = value;
}

function applyDevValue(key, value) {
    const entry = DEV_PARAM_REGISTRY[key];
    if (!entry || !entry.apply) {
        updateOverlay(key, value);
        return;
    }

    const configTargets = {
        toggles,
        breathConfig,
        sceneParams,
        gemParams,
        xLogoParams,
        vortexParams,
        liquidParams,
    };

    entry.apply.forEach((action) => {
        switch (action.kind) {
            case 'toggle':
                if (action.key in toggles) toggles[action.key] = value;
                break;
            case 'config':
                if (configTargets[action.object]) {
                    configTargets[action.object][action.key] = value;
                }
                break;
            case 'uniform': {
                const target = action.target === 'distortionPass' ? distortionPass : fluidSystem;
                if (target && target.uniforms && target.uniforms[action.uniform]) {
                    target.uniforms[action.uniform].value = value;
                }
                break;
            }
            case 'uniformColor': {
                const target = action.target === 'distortionPass' ? distortionPass : null;
                if (target && target.uniforms && target.uniforms[action.uniform]) {
                    target.uniforms[action.uniform].value[action.channel] = value;
                }
                break;
            }
            case 'rebuildGem':
                rebuildGem();
                break;
            case 'updateGemPosition':
                updateGemPosition();
                break;
            case 'rebuildXLogo':
                rebuildXLogo();
                break;
            case 'updateXLogoPosition':
                updateXLogoPosition();
                break;
            case 'camera':
                setCameraPosition(sceneParams.camX, sceneParams.camY, sceneParams.camZ);
                break;
            case 'autoRotate':
                setAutoRotateSpeed(value);
                break;
            case 'overlay':
                updateOverlay(key, value);
                break;
            case 'liquidUniform':
                applyLiquidUniform(action.key, value);
                break;
            default:
                break;
        }
    });
}

// --- dev-panel（?dev でのみ有効） ---
if (DEV_MODE) {
    import('./dev-panel.js').then(({ initDevPanel }) => {
        initDevPanel(applyDevValue);
    });
}

// --- テキストログ描画を削除 ---
// dev-log.js の呼び出しを削除。ログはギャラリーの詳細パネルで表示する。

// --- Devlog Gallery（IntersectionObserverで遅延初期化） ---
import('./devlog/devlog.js');

const clock = new THREE.Clock();

// --- T-014: resizeリスナーをクリーンアップ可能に ---
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    xLogoCamera.aspect = camera.aspect;
    xLogoCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // --- 統一呼吸値 ---
    const breathVal = breathValue(time, breathConfig.period);

    // --- スクロール進捗 ---
    const scrollProg = getScrollProgress();

    // --- スクロールUI更新 ---
    updateScrollUI(scrollProg, breathVal);

    // --- マウススムージング（T-010: mouse-state.js から取得） ---
    const mouse = updateMouseSmoothing();

    updateControls(time, breathVal);
    updateScene(time);
    updateNavigation(time);
    updateXLogo(time);

    // --- ナビメッシュ取得（フレームで1回のみ） ---
    const navs = findNavMeshes();

    // --- 流体フィールド ---
    if (toggles.fluidField) {
        fluidSystem.uniforms.uMouse.value.set(mouse.smoothX, mouse.smoothY);
        fluidSystem.uniforms.uMouseVelocity.value.set(mouse.velX, mouse.velY);
        fluidSystem.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
        fluidSystem.update();
        distortionPass.uniforms.tFluidField.value = fluidSystem.getTexture();
    } else {
        distortionPass.uniforms.uFluidInfluence.value = 0;
    }

    // --- リキッドエフェクト ---
    if (toggles.liquid) {
        liquidMousePos.set(mouse.smoothX, mouse.smoothY);
        liquidMouseVel.set(mouse.velX, mouse.velY);
        liquidSystem.update(liquidMousePos, liquidMouseVel);
        liquidSystem.setTime(time);
        liquidSystem.copyDensityTo(liquidTarget);  // 密度を白テクスチャとしてコピー
        distortionPass.uniforms.tLiquid.value = liquidTarget.texture;  // レンダリング結果を使用
        distortionPass.uniforms.uLiquidStrength.value = liquidParams.densityMul;
    } else {
        distortionPass.uniforms.uLiquidStrength.value = 0;
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
    distortionPass.uniforms.uMouse.value.set(mouse.smoothX, mouse.smoothY);

    if (!toggles.heatHaze) distortionPass.uniforms.uHeatHaze.value = 0;
    if (!toggles.dof) distortionPass.uniforms.uDofStrength.value = 0;

    updateNavLabels(navs, camera);
    updateXLogoLabel(xLogoCamera);

    renderer.clear();
    if (toggles.postProcess) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
    renderer.clearDepth();
    renderer.render(xLogoScene, xLogoCamera);
}

animate();
