// main.js — エントリポイント

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { createScene, updateScene, sceneParams, getCamera } from './scene.js';
import { initControls, updateControls, setAutoRotateSpeed, setCameraPosition, getScrollProgress } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';
import { getOrbScreenData, updateNavLabels } from './nav-objects.js';
import { rebuildGem, updateGemPosition } from './nav-objects.js';
import { initLangToggle } from './lang-toggle.js';
import { detectLang, t } from './i18n.js';
import { DistortionShader } from './shaders/distortion-pass.js';
import { createFluidSystem } from './shaders/fluid-field.js';
import { toggles, breathConfig, distortionParams, fluidParams, gemParams, vortexParams } from './config.js';
import { initScrollUI, updateScrollUI } from './scroll-ui.js';
import { initMouseTracking, updateMouseSmoothing } from './mouse-state.js';

let composer;
let distortionPass;
let fluidSystem;
let navMeshesCache = [];

const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

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

// ========================================
// T-008: devパネル用 applyDevValue ルックアップテーブル
// if-elseチェーンをカテゴリ別Mapに置換
// ========================================

// --- distortionPass uniform直接代入 ---
const DISTORTION_UNIFORM_MAP = {
    distStrength:   'uStrength',
    distAberration: 'uAberration',
    turbulence:     'uTurbulence',
    baseBlur:       'uBaseBlur',
    orbBlur:        'uBlurAmount',
    innerGlow:      'uInnerGlow',
    haloIntensity:  'uHaloIntensity',
    haloWidth:      'uHaloWidth',
    heatHaze:       'uHeatHaze',
    heatHazeRadius: 'uHeatHazeRadius',
    heatHazeSpeed:  'uHeatHazeSpeed',
    dofStrength:    'uDofStrength',
    dofFocusRadius: 'uDofFocusRadius',
    fluidInfluence: 'uFluidInfluence',
};

// --- distortionPass haloColor成分 (.value.x/y/z) ---
const HALO_COLOR_MAP = {
    haloColorR: 'x',
    haloColorG: 'y',
    haloColorB: 'z',
};

// --- fluidSystem uniform直接代入 ---
const FLUID_UNIFORM_MAP = {
    fluidForce:  'uForce',
    fluidCurl:   'uCurl',
    fluidDecay:  'uDecay',
    fluidRadius: 'uRadius',
};

// --- gemParams: config代入 + rebuildGem() ---
const GEM_REBUILD_MAP = {
    gemMeshScale:           'meshScale',
    gemGlowStrength:        'glowStrength',
    gemRimPower:            'rimPower',
    gemInnerGlow:           'innerGlow',
    gemTurbulence:          'turbulence',
    gemHaloWidth:           'haloWidth',
    gemHaloIntensity:       'haloIntensity',
    gemChromaticAberration: 'chromaticAberration',
};

// --- gemParams: config代入 + updateGemPosition() ---
const GEM_POSITION_MAP = {
    gemPosX: 'posX',
    gemPosY: 'posY',
    gemPosZ: 'posZ',
};

// --- vortexParams: config直接代入 ---
const VORTEX_MAP = {
    vortexSpeed:     'speed',
    vortexIntensity: 'intensity',
    vortexScale:     'scale',
    vortexOpacity:   'opacity',
    vortexArmCount:  'armCount',
    vortexColorR:    'colorR',
    vortexColorG:    'colorG',
    vortexColorB:    'colorB',
    vortexPosX:      'posX',
    vortexPosY:      'posY',
    vortexPosZ:      'posZ',
    vortexSize:      'size',
};

function applyDevValue(key, value) {
    // --- config直接参照（toggles / breathConfig / sceneParams） ---
    if (key in toggles) { toggles[key] = value; return; }
    if (key in breathConfig) { breathConfig[key] = value; return; }
    if (key in sceneParams) sceneParams[key] = value;

    // --- カメラ位置 ---
    if (key === 'camX' || key === 'camY' || key === 'camZ') {
        setCameraPosition(sceneParams.camX, sceneParams.camY, sceneParams.camZ);
        return;
    }
    if (key === 'autoRotateSpd') { setAutoRotateSpeed(value); return; }

    // --- distortion uniform ---
    if (key in DISTORTION_UNIFORM_MAP) {
        distortionPass.uniforms[DISTORTION_UNIFORM_MAP[key]].value = value;
        return;
    }

    // --- haloColor成分 ---
    if (key in HALO_COLOR_MAP) {
        distortionPass.uniforms.uHaloColor.value[HALO_COLOR_MAP[key]] = value;
        return;
    }

    // --- fluid uniform ---
    if (key in FLUID_UNIFORM_MAP) {
        fluidSystem.uniforms[FLUID_UNIFORM_MAP[key]].value = value;
        return;
    }

    // --- gem: パラメータ更新 + rebuild ---
    if (key in GEM_REBUILD_MAP) {
        gemParams[GEM_REBUILD_MAP[key]] = value;
        rebuildGem();
        return;
    }

    // --- gem: labelYOffset（rebuildなし） ---
    if (key === 'gemLabelYOffset') { gemParams.labelYOffset = value; return; }

    // --- gem: 位置更新 ---
    if (key in GEM_POSITION_MAP) {
        gemParams[GEM_POSITION_MAP[key]] = value;
        updateGemPosition();
        return;
    }

    // --- vortex ---
    if (key in VORTEX_MAP) {
        vortexParams[VORTEX_MAP[key]] = value;
        return;
    }

    // --- HTMLオーバーレイ（title/subtitle位置・サイズ） ---
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

// --- T-014: resizeリスナーをクリーンアップ可能に ---
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // --- 統一呼吸値 ---
    const breathVal = (Math.sin(time * Math.PI / breathConfig.period - Math.PI / 2) + 1) * 0.5;

    // --- スクロール進捗 ---
    const scrollProg = getScrollProgress();

    // --- スクロールUI更新 ---
    updateScrollUI(scrollProg, breathVal);

    // --- マウススムージング（T-010: mouse-state.js から取得） ---
    const mouse = updateMouseSmoothing();

    updateControls(time, breathVal);
    updateScene(time);
    updateNavigation(time);

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

    if (toggles.postProcess) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

animate();
