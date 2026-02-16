// dev-panel.js — Bootstrapベースのdevパネル
// ★ default値は config.js を参照し、ハードコードしない
// CHANGED: Bootstrap CSS/JS を動的ロード（?dev時のみ読み込まれる）

import { toggles, breathConfig, sceneParams, fluidParams, liquidParams, distortionParams, gemParams, xLogoParams, vortexParams } from './config.js';
import { injectStyles } from './dom-utils.js';

const BOOTSTRAP_CSS_URL = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
const BOOTSTRAP_JS_URL = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js';

function findBootstrapCssLink() {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
        .find((el) => el.href.includes('/bootstrap@5.3.3/dist/css/bootstrap.min.css'));
}

function findBootstrapJsScript() {
    return Array.from(document.querySelectorAll('script[src]'))
        .find((el) => el.src.includes('/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'));
}

function ensureBootstrapCss() {
    if (findBootstrapCssLink()) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = BOOTSTRAP_CSS_URL;
    document.head.appendChild(link);
}

function ensureBootstrapJs() {
    if (window.bootstrap) return Promise.resolve();
    const existingScript = findBootstrapJsScript();
    if (existingScript) {
        return new Promise((resolve, reject) => {
            existingScript.addEventListener('load', resolve, { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Bootstrap JS load failed')), { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = BOOTSTRAP_JS_URL;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Bootstrap JS load failed'));
        document.body.appendChild(script);
    });
}

// --- CHANGED: Bootstrap動的ローダー（既存読込があれば再注入しない） ---
function loadBootstrap() {
    ensureBootstrapCss();
    return ensureBootstrapJs();
}

const TOGGLES = [
    { key: 'background',    label: '背景' },
    { key: 'kessonLights',  label: '欠損ライト' },
    { key: 'water',         label: '水面' },
    { key: 'navOrbs',       label: 'ナビオーブ' },
    { key: 'fog',           label: 'フォグ' },
    { key: 'fovBreath',     label: 'FOV呼吸' },
    { key: 'htmlBreath',    label: 'HTML呼吸' },
    { key: 'autoRotate',    label: '自動回転' },
    { key: 'postProcess',   label: 'ポストプロセス' },
    { key: 'fluidField',    label: '流体かき混ぜ' },
    { key: 'liquid',        label: 'リキッド' },
    { key: 'heatHaze',      label: '熱波' },
    { key: 'dof',           label: '被写界深度' },
    { key: 'orbRefraction', label: 'オーブ屈折' },
    { key: 'vortex',        label: '渦' },
    { key: 'liquid',        label: 'リキッド' },
];

const SECTIONS = [
    {
        id: 'breath',
        title: '呼吸（同期）',
        params: {
            period:          { label: '周期(s)',       min: 2.0, max: 30.0, step: 0.5, default: breathConfig.period, target: 'breath' },
            htmlMinOpacity:  { label: 'HTML最小透明度', min: 0.0, max: 0.5, step: 0.05, default: breathConfig.htmlMinOpacity, target: 'breath' },
            htmlMaxOpacity:  { label: 'HTML最大透明度', min: 0.3, max: 1.0, step: 0.05, default: breathConfig.htmlMaxOpacity, target: 'breath' },
            htmlMaxBlur:     { label: 'HTMLぼかし(px)', min: 0.0, max: 8.0, step: 0.5, default: breathConfig.htmlMaxBlur, target: 'breath' },
            htmlMinScale:    { label: 'HTML最小スケール', min: 0.8, max: 1.0, step: 0.01, default: breathConfig.htmlMinScale, target: 'breath' },
            fovAmplitude:    { label: 'FOV振幅(deg)',   min: 0.0, max: 5.0, step: 0.1, default: breathConfig.fovAmplitude, target: 'breath' },
        }
    },
    {
        id: 'shader',
        title: '光シェーダー',
        params: {
            brightness:    { label: '光の強さ',      min: 0.0, max: 2.0, step: 0.05, default: sceneParams.brightness },
            glowCore:      { label: 'コア強度',      min: 0.01, max: 0.5, step: 0.01, default: sceneParams.glowCore },
            glowSpread:    { label: '広がり',        min: 0.005, max: 0.1, step: 0.005, default: sceneParams.glowSpread },
            breathAmp:     { label: '呼吸の深さ',    min: 0.0, max: 0.5, step: 0.05, default: sceneParams.breathAmp },
            warpAmount:    { label: '揺らぎ量',      min: 0.0, max: 1.5, step: 0.05, default: sceneParams.warpAmount },
            tintR:         { label: '色調 R',        min: 0.0, max: 2.0, step: 0.05, default: sceneParams.tintR },
            tintG:         { label: '色調 G',        min: 0.0, max: 2.0, step: 0.05, default: sceneParams.tintG },
            tintB:         { label: '色調 B',        min: 0.0, max: 2.0, step: 0.05, default: sceneParams.tintB },
        }
    },
    {
        id: 'vortex',
        title: '渦（M2-4）',
        params: {
            vortexSpeed:    { label: '回転速度',     min: 0.0,  max: 2.0,   step: 0.05, default: vortexParams.speed },
            vortexIntensity:{ label: '強度',         min: 0.0,  max: 3.0,   step: 0.1,  default: vortexParams.intensity },
            vortexScale:    { label: 'スケール',     min: 1.0,  max: 10.0,  step: 0.5,  default: vortexParams.scale },
            vortexOpacity:  { label: '透明度',       min: 0.0,  max: 1.0,   step: 0.05, default: vortexParams.opacity },
            vortexArmCount: { label: '腕の数',       min: 1.0,  max: 6.0,   step: 1.0,  default: vortexParams.armCount },
            vortexColorR:   { label: '色 R',         min: 0.0,  max: 3.0,   step: 0.1,  default: vortexParams.colorR },
            vortexColorG:   { label: '色 G',         min: 0.0,  max: 3.0,   step: 0.1,  default: vortexParams.colorG },
            vortexColorB:   { label: '色 B',         min: 0.0,  max: 3.0,   step: 0.1,  default: vortexParams.colorB },
            vortexPosX:     { label: '位置 X',       min: -100, max: 100,   step: 1,    default: vortexParams.posX },
            vortexPosY:     { label: '位置 Y',       min: -50,  max: 50,    step: 1,    default: vortexParams.posY },
            vortexPosZ:     { label: '位置 Z',       min: -100, max: 100,   step: 1,    default: vortexParams.posZ },
            vortexSize:     { label: 'サイズ',       min: 10,   max: 500,   step: 10,   default: vortexParams.size },
        }
    },
    {
        id: 'orbs',
        title: '鬼火オーブ（屈折球）',
        params: {
            distStrength:  { label: '屈折の強さ',    min: 0.0, max: 0.5, step: 0.01, default: distortionParams.strength },
            distAberration:{ label: '色収差',        min: 0.0, max: 0.3, step: 0.005, default: distortionParams.aberration },
            turbulence:    { label: '乱流の強さ',    min: 0.0, max: 3.0, step: 0.05, default: distortionParams.turbulence },
            baseBlur:      { label: '全体ボケ',      min: 0.0, max: 0.2, step: 0.005, default: distortionParams.baseBlur },
            orbBlur:       { label: 'エッジボケ',    min: 0.0, max: 0.5, step: 0.01, default: distortionParams.blurAmount },
            innerGlow:     { label: '内側グロー',    min: 0.0, max: 1.0, step: 0.05, default: distortionParams.innerGlow },
            haloIntensity: { label: '後光の強さ',    min: 0.0, max: 1.5, step: 0.05, default: distortionParams.haloIntensity },
            haloWidth:     { label: '後光の幅',      min: 0.05, max: 1.0, step: 0.05, default: distortionParams.haloWidth },
            haloColorR:    { label: '後光色 R',      min: 0.0, max: 1.0, step: 0.05, default: distortionParams.haloColorR },
            haloColorG:    { label: '後光色 G',      min: 0.0, max: 1.0, step: 0.05, default: distortionParams.haloColorG },
            haloColorB:    { label: '後光色 B',      min: 0.0, max: 1.0, step: 0.05, default: distortionParams.haloColorB },
        }
    },
    {
        id: 'gem',
        title: 'Gem 四芒星',
        params: {
            gemMeshScale:           { label: 'スケール',     min: 0.3, max: 4.0, step: 0.1, default: gemParams.meshScale },
            gemGlowStrength:        { label: 'グロー強度',   min: 0.0, max: 5.0, step: 0.1, default: gemParams.glowStrength },
            gemRimPower:            { label: 'リム鋭さ',     min: 0.5, max: 8.0, step: 0.1, default: gemParams.rimPower },
            gemInnerGlow:           { label: '中心グロー',   min: 0.0, max: 3.0, step: 0.1, default: gemParams.innerGlow },
            gemTurbulence:          { label: '乱流',         min: 0.0, max: 2.0, step: 0.05, default: gemParams.turbulence },
            gemHaloWidth:           { label: 'Halo幅',       min: 0.05, max: 1.0, step: 0.05, default: gemParams.haloWidth },
            gemHaloIntensity:       { label: 'Halo強度',     min: 0.0, max: 2.0, step: 0.05, default: gemParams.haloIntensity },
            gemChromaticAberration: { label: '色収差',       min: 0.0, max: 0.5, step: 0.01, default: gemParams.chromaticAberration },
            gemLabelYOffset:        { label: 'ラベル距離',   min: 0.0, max: 8.0, step: 0.25, default: gemParams.labelYOffset },
            gemPosX:                { label: '位置 X',       min: -30, max: 30, step: 1, default: gemParams.posX },
            gemPosY:                { label: '位置 Y',       min: -15, max: 15, step: 1, default: gemParams.posY },
            gemPosZ:                { label: '位置 Z',       min: -10, max: 40, step: 1, default: gemParams.posZ },
        }
    },
    {
        id: 'xlogo',
        title: 'X ロゴ',
        params: {
            xLogoMeshScale:    { label: 'サイズ',       min: 0.1, max: 4.0, step: 0.1, default: xLogoParams.meshScale },
            xLogoGlowStrength: { label: '発光強度',     min: 0.0, max: 5.0, step: 0.1, default: xLogoParams.glowStrength },
            xLogoRimPower:     { label: '金属感',       min: 0.5, max: 10.0, step: 0.1, default: xLogoParams.rimPower },
            xLogoInnerGlow:    { label: '中心発光',     min: 0.0, max: 5.0, step: 0.1, default: xLogoParams.innerGlow },
            xLogoLabelYOffset: { label: 'ラベル距離',   min: 0.0, max: 8.0, step: 0.25, default: xLogoParams.labelYOffset },
            xLogoPosX:          { label: '位置 X',       min: -30, max: 30, step: 1, default: xLogoParams.posX },
            xLogoPosY:          { label: '位置 Y',       min: -15, max: 15, step: 1, default: xLogoParams.posY },
            xLogoPosZ:          { label: '位置 Z',       min: -10, max: 40, step: 1, default: xLogoParams.posZ },
        }
    },
    {
        id: 'fluid',
        title: '流体かき混ぜ',
        params: {
            fluidForce:    { label: '押す力',        min: 0.0, max: 1.0, step: 0.05, default: fluidParams.force },
            fluidCurl:     { label: '渦の強さ',      min: 0.0, max: 1.0, step: 0.05, default: fluidParams.curl },
            fluidDecay:    { label: '減衰率',        min: 0.9, max: 0.999, step: 0.001, default: fluidParams.decay },
            fluidRadius:   { label: '影響半径',      min: 0.03, max: 0.4, step: 0.01, default: fluidParams.radius },
            fluidInfluence:{ label: '画面への影響',  min: 0.0, max: 0.06, step: 0.001, default: fluidParams.influence },
        }
    },
    {
        id: 'liquid',
        title: 'リキッド（液体）',
        params: {
            liquidTimestep:    { label: 'タイムステップ',  min: 0.001, max: 0.05, step: 0.001, default: liquidParams.timestep },
            liquidDissipation: { label: '減衰率',          min: 0.9, max: 0.999, step: 0.001, default: liquidParams.dissipation },
            liquidForceRadius: { label: '力の半径',        min: 0.05, max: 0.5, step: 0.01, default: liquidParams.forceRadius },
            liquidForceStrength:{ label: '力の強さ',       min: 0.5, max: 10.0, step: 0.5, default: liquidParams.forceStrength },
            liquidDensityMul:  { label: '密度倍率',        min: 0.5, max: 5.0, step: 0.1, default: liquidParams.densityMul },
            liquidNoiseScale:  { label: 'ノイズスケール',  min: 1.0, max: 10.0, step: 0.5, default: liquidParams.noiseScale },
            liquidNoiseSpeed:  { label: 'ノイズ速度',      min: 0.01, max: 0.5, step: 0.01, default: liquidParams.noiseSpeed },
            liquidSpecPow:     { label: '光沢の鋭さ',      min: 4.0, max: 64.0, step: 2.0, default: liquidParams.specularPow },
            liquidSpecInt:     { label: '光沢の強さ',      min: 0.0, max: 2.0, step: 0.1, default: liquidParams.specularInt },
            liquidBaseR:       { label: '基本色 R',        min: 0.0, max: 1.0, step: 0.05, default: liquidParams.baseColorR },
            liquidBaseG:       { label: '基本色 G',        min: 0.0, max: 1.0, step: 0.05, default: liquidParams.baseColorG },
            liquidBaseB:       { label: '基本色 B',        min: 0.0, max: 1.0, step: 0.05, default: liquidParams.baseColorB },
            liquidHighR:       { label: 'ハイライト R',    min: 0.0, max: 1.0, step: 0.05, default: liquidParams.highlightR },
            liquidHighG:       { label: 'ハイライト G',    min: 0.0, max: 1.0, step: 0.05, default: liquidParams.highlightG },
            liquidHighB:       { label: 'ハイライト B',    min: 0.0, max: 1.0, step: 0.05, default: liquidParams.highlightB },
        }
    },
    {
        id: 'heatdof',
        title: '熱波・被写界深度',
        params: {
            heatHaze:      { label: '熱波の強さ',    min: 0.0, max: 0.06, step: 0.001, default: distortionParams.heatHaze },
            heatHazeRadius:{ label: '熱波半径',      min: 0.05, max: 0.8, step: 0.01, default: distortionParams.heatHazeRadius },
            heatHazeSpeed: { label: '熱波速度',      min: 0.5, max: 10.0, step: 0.5, default: distortionParams.heatHazeSpeed },
            dofStrength:   { label: 'DOFボケ強度',   min: 0.0, max: 0.02, step: 0.0005, default: distortionParams.dofStrength },
            dofFocusRadius:{ label: 'DOFフォーカス半径', min: 0.05, max: 0.6, step: 0.01, default: distortionParams.dofFocusRadius },
        }
    },
    {
        id: 'timing',
        title: 'タイミング',
        params: {
            mixCycle:      { label: '背景周期(s)',    min: 2.0, max: 30.0, step: 1.0, default: sceneParams.mixCycle },
            styleCycle:    { label: 'スタイル周期(s)', min: 4.0, max: 60.0, step: 2.0, default: sceneParams.styleCycle },
        }
    },
    {
        id: 'camera',
        title: 'カメラ・環境',
        params: {
            camX:          { label: 'カメラ X',      min: -50, max: 50, step: 1, default: sceneParams.camX },
            camY:          { label: 'カメラ Y',      min: -20, max: 80, step: 1, default: sceneParams.camY },
            camZ:          { label: 'カメラ Z',      min: -20, max: 60, step: 1, default: sceneParams.camZ },
            camTargetY:    { label: '注視点 Y',      min: -30, max: 10, step: 1, default: sceneParams.camTargetY },
            fogDensity:    { label: 'フォグ濃度',    min: 0.0, max: 0.06, step: 0.002, default: sceneParams.fogDensity },
            autoRotateSpd: { label: '自動回転速度',   min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
        }
    },
    {
        id: 'overlay',
        title: 'HTMLオーバーレイ',
        // ★ titleOpacity / subOpacity は意図的に除外。
        //    h1/subtitleのcolorはCSS固定（index.html）であり、inline styleで上書きしない。
        //    表示制御は scroll-ui.js の overlay opacity/filter/transform で行う。
        //    この方針により、LLM修正時にdefault値矛盾で色が暗くなる問題を防止する。
        params: {
            titleBottom:   { label: '下からの距離(px)', min: 10, max: 300, step: 5, default: 60 },
            titleLeft:     { label: '左からの距離(px)', min: 10, max: 300, step: 5, default: 40 },
            titleSize:     { label: 'タイトル文字(rem)', min: 0.5, max: 5.0, step: 0.1, default: 2.7 },
            titleSpacing:  { label: '文字間隔(em)',   min: 0.0, max: 2.0, step: 0.05, default: 0.8 },
            subSize:       { label: 'サブ文字(rem)',   min: 0.3, max: 3.0, step: 0.1, default: 1.3 },
            titleGlow:     { label: '発光(px)',       min: 0, max: 80, step: 5, default: 30 },
        }
    },
];

let _isOpen = false;
let _values = {};
let _onChange = null;

function formatValue(val, step) {
    const str = step.toString();
    const dot = str.indexOf('.');
    const decimals = dot === -1 ? 0 : str.length - dot - 1;
    return Number(val).toFixed(decimals);
}

function createPanel() {
    SECTIONS.forEach(section => {
        Object.keys(section.params).forEach(key => {
            _values[key] = section.params[key].default;
        });
    });

    injectStyles('dev-panel-styles', `
        #dev-toggle {
            position: fixed;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            z-index: 1001;
            background: rgba(20, 30, 50, 0.7);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(100, 150, 255, 0.15);
            border-right: none;
            border-radius: 4px 0 0 4px;
            color: rgba(180, 200, 255, 0.6);
            font-size: 0.65rem;
            font-family: monospace;
            padding: 8px 5px;
            cursor: pointer;
            writing-mode: vertical-rl;
            letter-spacing: 0.15em;
            transition: all 0.3s ease;
        }
        #dev-toggle:hover {
            color: rgba(200, 220, 255, 0.9);
            background: rgba(30, 45, 70, 0.8);
        }
        #dev-toggle.open { right: 300px; }

        #dev-panel {
            position: fixed;
            top: 0;
            right: -300px;
            width: 300px;
            height: 100%;
            z-index: 1000;
            overflow-y: auto;
            transition: right 0.35s cubic-bezier(0.22, 1, 0.36, 1);
            background: rgba(13, 17, 23, 0.95);
            backdrop-filter: blur(12px);
            border-left: 1px solid rgba(100, 150, 255, 0.1);
        }
        #dev-panel.open { right: 0; }
        #dev-panel::-webkit-scrollbar { width: 4px; }
        #dev-panel::-webkit-scrollbar-thumb { background: rgba(100,150,255,0.2); border-radius: 2px; }

        #dev-panel .accordion-button {
            padding: 0.5rem 0.75rem;
            font-size: 0.72rem;
            font-family: monospace;
            letter-spacing: 0.05em;
            background: rgba(20, 28, 40, 0.9);
            color: rgba(140, 170, 220, 0.8);
            border: none;
            box-shadow: none;
        }
        #dev-panel .accordion-button:not(.collapsed) {
            background: rgba(30, 45, 70, 0.7);
            color: rgba(160, 190, 255, 0.9);
        }
        #dev-panel .accordion-button::after {
            filter: invert(0.6) sepia(1) saturate(2) hue-rotate(190deg);
        }
        #dev-panel .accordion-body {
            padding: 0.5rem 0.75rem;
            background: rgba(10, 15, 25, 0.8);
        }
        #dev-panel .accordion-item {
            background: transparent;
            border: none;
            border-bottom: 1px solid rgba(100, 150, 255, 0.06);
        }

        #dev-panel .form-check {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.25rem 0;
            margin: 0;
        }
        #dev-panel .form-check-label {
            font-size: 0.68rem;
            font-family: monospace;
            color: rgba(180, 200, 230, 0.7);
            order: -1;
            padding-left: 0;
        }
        #dev-panel .form-check-input {
            margin: 0;
            cursor: pointer;
        }

        .dev-slider-row { margin-bottom: 0.4rem; }
        .dev-slider-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.65rem;
            font-family: monospace;
            color: rgba(180, 200, 230, 0.6);
            margin-bottom: 0.15rem;
        }
        .dev-slider-val {
            color: rgba(130, 200, 255, 0.9);
            min-width: 36px;
            text-align: right;
        }
        #dev-panel .form-range { height: 0.5rem; padding: 0; }
        #dev-panel .form-range::-webkit-slider-thumb {
            width: 12px; height: 12px;
            background: rgba(100, 160, 255, 0.8);
            border: 1px solid rgba(150, 200, 255, 0.3);
        }

        #dev-export-result {
            font-size: 0.58rem;
            max-height: 180px;
            overflow-y: auto;
            display: none;
            user-select: all;
        }
    `);

    const tab = document.createElement('div');
    tab.id = 'dev-toggle';
    tab.textContent = 'DEV';
    tab.addEventListener('click', () => {
        _isOpen = !_isOpen;
        tab.classList.toggle('open', _isOpen);
        panel.classList.toggle('open', _isOpen);
    });
    document.body.appendChild(tab);

    const panel = document.createElement('div');
    panel.id = 'dev-panel';
    panel.setAttribute('data-bs-theme', 'dark');

    let html = '<div class="px-3 py-2 border-bottom border-secondary-subtle"><small class="text-secondary-emphasis" style="font-family:monospace;letter-spacing:0.1em">パラメータ調整</small></div>';
    html += '<div class="accordion accordion-flush" id="devAccordion">';

    html += accordionItem('toggles', '表示 ON/OFF', buildTogglesHTML(), true);
    SECTIONS.forEach(section => {
        html += accordionItem(section.id, section.title, buildSlidersHTML(section));
    });

    html += '</div>';
    html += `
        <div class="p-2 border-top border-secondary-subtle">
            <button class="btn btn-outline-secondary btn-sm w-100" id="dev-export-btn" style="font-size:0.68rem">値をコピー</button>
            <pre class="mt-2 p-2 bg-black rounded text-info-emphasis" id="dev-export-result"></pre>
        </div>
    `;

    panel.innerHTML = html;
    document.body.appendChild(panel);

    bindToggleEvents();
    bindSliderEvents();
    bindExportEvent();
}

function accordionItem(id, title, bodyHTML, show = false) {
    return `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button ${show ? '' : 'collapsed'}" type="button"
                    data-bs-toggle="collapse" data-bs-target="#collapse-${id}">
                    ${title}
                </button>
            </h2>
            <div id="collapse-${id}" class="accordion-collapse collapse ${show ? 'show' : ''}" data-bs-parent="#devAccordion">
                <div class="accordion-body">${bodyHTML}</div>
            </div>
        </div>
    `;
}

function buildTogglesHTML() {
    return TOGGLES.map(t => {
        const checked = toggles[t.key] ? 'checked' : '';
        return `
            <div class="form-check form-switch">
                <label class="form-check-label" for="toggle-${t.key}">${t.label}</label>
                <input class="form-check-input" type="checkbox" role="switch" id="toggle-${t.key}" ${checked}>
            </div>
        `;
    }).join('');
}

function buildSlidersHTML(section) {
    return Object.keys(section.params).map(key => {
        const p = section.params[key];
        return `
            <div class="dev-slider-row">
                <div class="dev-slider-header">
                    <span>${p.label}</span>
                    <span class="dev-slider-val" id="val-${key}">${formatValue(p.default, p.step)}</span>
                </div>
                <input type="range" class="form-range" id="slider-${key}"
                    min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}">
            </div>
        `;
    }).join('');
}

function bindToggleEvents() {
    TOGGLES.forEach(t => {
        document.getElementById(`toggle-${t.key}`).addEventListener('change', (e) => {
            if (_onChange) _onChange(t.key, e.target.checked);
        });
    });
}

function bindSliderEvents() {
    SECTIONS.forEach(section => {
        Object.keys(section.params).forEach(key => {
            const p = section.params[key];
            const slider = document.getElementById(`slider-${key}`);
            const valEl = document.getElementById(`val-${key}`);
            slider.addEventListener('input', () => {
                const val = parseFloat(slider.value);
                _values[key] = val;
                valEl.textContent = formatValue(val, p.step);
                if (_onChange) _onChange(key, val);
            });
        });
    });
}

function bindExportEvent() {
    document.getElementById('dev-export-btn').addEventListener('click', () => {
        const result = document.getElementById('dev-export-result');
        const exportData = {
            toggles: { ...toggles },
            breathConfig: { ...breathConfig },
            sceneParams: { ..._values },
        };
        const text = JSON.stringify(exportData, null, 2);
        result.textContent = text;
        result.style.display = 'block';
        navigator.clipboard?.writeText(text).then(() => {
            const btn = document.getElementById('dev-export-btn');
            btn.textContent = 'コピーしました';
            setTimeout(() => { btn.textContent = '値をコピー'; }, 2000);
        });
    });
}

// CHANGED: Bootstrap読み込み完了を待ってからパネル生成
export async function initDevPanel(onChange) {
    _onChange = onChange;
    try {
        await loadBootstrap();
    } catch (err) {
        console.warn('[dev-panel] Bootstrap load failed:', err.message);
    }
    createPanel();
    return { ..._values };
}

export function getDevValues() {
    return { ..._values };
}

export function getDevParam(key) {
    return _values[key];
}
