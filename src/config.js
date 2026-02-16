// config.js — 設定値・定数の一元管理
// ★ すべてのデフォルト値はここで定義し、他ファイルから参照する

import * as THREE from 'three';

// --- 表示トグル ---
export const toggles = {
    background: true,
    kessonLights: true,
    water: true,
    navOrbs: true,
    fog: true,
    fovBreath: true,
    htmlBreath: true,
    autoRotate: true,
    postProcess: true,
    fluidField: true,
    liquid: true,
    heatHaze: false,
    dof: true,
    orbRefraction: true,
    vortex: false,  // デフォルトOFF（手動でONにする）
};

// --- 呼吸設定（HTML + FOV 同期）---
export const breathConfig = {
    period: 8.0,
    htmlMinOpacity: 0.1,
    htmlMaxOpacity: 0.8,
    htmlMaxBlur: 3.0,
    htmlMinScale: 0.95,
    fovBase: 60,
    fovAmplitude: 1.0,
};

// --- 背景色定数 ---
export const BG_V002_CENTER = new THREE.Color(0x050508);
export const BG_V002_EDGE = new THREE.Color(0x050508);
export const BG_V004_CENTER = new THREE.Color(0x2a3a4a);
export const BG_V004_EDGE = new THREE.Color(0x0a1520);

// --- フォグ定数 ---
export const FOG_V002_COLOR = new THREE.Color(0x050508);
export const FOG_V002_DENSITY = 0.025;
export const FOG_V004_COLOR = new THREE.Color(0x0a1520);
export const FOG_V004_DENSITY = 0.02;

// --- 光の色パレット ---
export const WARM_COLORS = [0xff7744, 0xff9955, 0xff5522];
export const COOL_COLORS = [0x4477ff, 0x5599ff, 0x2255ee];

// --- 光シェーダーパラメータ ---
export const sceneParams = {
    brightness: 1.0,
    glowCore: 0.07,
    glowSpread: 0.08,
    breathAmp: 0.15,
    warpAmount: 1.0,
    tintR: 1.25,
    tintG: 2.0,
    tintB: 0.8,
    mixCycle: 2.0,
    styleCycle: 14.0,
    fogDensity: 0.0,
    camX: -14,
    camY: 0,
    camZ: 34,
    camTargetY: -1,
};

// --- 流体フィールドパラメータ ---
export const fluidParams = {
    force:     1.0,
    curl:      1.0,
    decay:     0.948,
    radius:    0.21,
    influence: 0.06,
};

// --- リキッド（Metaball液体）パラメータ ---
// ★ dev panel調整済みデフォルト値
export const liquidParams = {
    // テクスチャ解像度（シミュレーション用RT / コピー用RT）
    textureSize: 128,
    // シミュレーション
    timestep:    0.001,
    dissipation: 0.904,
    iterations:  12,
    // マウス反応
    forceRadius: 0.08,
    forceStrength: 4.5,
    // 密度付与（マウスのスプラット量）
    splatGain:   5.0,
    // 見た目
    densityMul:  2.0,
    noiseScale:  9.5,
    noiseSpeed:  0.02,
    noiseAmp:    0.1,
    // 光沢
    specularPow: 8.0,
    specularInt: 1.8,
    // レンダリング微調整（magic number のconfig.js化）
    normalZ:     0.3,
    diffuseGain: 0.3,
    densityEdge: 0.5,
    alphaEdge:   0.3,
    alphaMax:    0.9,
    // ポスト（屈折）側の微調整
    refractOffsetScale: 0.05,
    refractThreshold:   0.01,
    // 色（明るめ）
    baseColorR:  0.8,
    baseColorG:  0.85,
    baseColorB:  0.85,
    highlightR:  0.9,
    highlightG:  0.9,
    highlightB:  0.9,
};

// --- ポストプロセス（歪み・オーブ・熱波・DOF）パラメータ ---
export const distortionParams = {
    strength:       0.03,
    aberration:     0.1,
    turbulence:     0.4,
    baseBlur:       0.06,
    blurAmount:     0.15,
    innerGlow:      0.1,
    haloIntensity:  0.2,
    haloWidth:      1.0,
    haloColorR:     0.3,
    haloColorG:     0.2,
    haloColorB:     0.05,
    heatHaze:       0.024,
    heatHazeRadius: 0.5,
    heatHazeSpeed:  1.0,
    dofStrength:    0.009,
    dofFocusRadius: 0.32,
};

// --- Gem四芒星パラメータ（dev panel export反映） ---
export const gemParams = {
    meshScale:           0.3,
    glowStrength:        1.0,
    rimPower:            8.0,
    innerGlow:           3.0,
    turbulence:          2.0,
    haloWidth:           0.2,
    haloIntensity:       0.5,
    chromaticAberration: 0.0,
    posX: 10,
    posY: 2,
    posZ: 15,
    labelYOffset: 1.25,
};

// --- Xロゴパラメータ ---
export const xLogoParams = {
    meshScale:     0.3,
    glowStrength:  0.4,
    rimPower:      0.5,
    innerGlow:     0.1,
    posX: -20,
    posY: 5,
    posZ: 11,
    labelYOffset: 0.5,
};

// --- 渦パラメータ（M2 段階4: 個の立ち上がり）---
// CHANGED: FBM spiral vortex, water-matched colors
export const vortexParams = {
    speed:    0.3,
    intensity: 1.0,
    scale:    4.0,
    opacity:  0.8,
    colorR:   1.0,
    colorG:   1.0,
    colorB:   1.0,
    armCount: 3.0,
    posX:     0,
    posY:     -20,   // water surface level
    posZ:     0,
    size:     200,
};

// --- 後方互換（旧 DISTORTION_PARAMS） ---
export const DISTORTION_PARAMS = {
    strength: distortionParams.strength,
    chromaticAberration: distortionParams.aberration,
};

export const DEV_TOGGLES = [
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

export const DEV_SECTIONS = [
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

const HALO_COLOR_MAP = {
    haloColorR: 'x',
    haloColorG: 'y',
    haloColorB: 'z',
};

const FLUID_UNIFORM_MAP = {
    fluidForce:  'uForce',
    fluidCurl:   'uCurl',
    fluidDecay:  'uDecay',
    fluidRadius: 'uRadius',
};

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

const GEM_POSITION_MAP = {
    gemPosX: 'posX',
    gemPosY: 'posY',
    gemPosZ: 'posZ',
};

const XLOGO_REBUILD_MAP = {
    xLogoMeshScale:    'meshScale',
    xLogoGlowStrength: 'glowStrength',
    xLogoRimPower:     'rimPower',
    xLogoInnerGlow:    'innerGlow',
};

const XLOGO_POSITION_MAP = {
    xLogoPosX: 'posX',
    xLogoPosY: 'posY',
    xLogoPosZ: 'posZ',
};

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

const LIQUID_CONFIG_MAP = {
    liquidTimestep:     'timestep',
    liquidDissipation:  'dissipation',
    liquidForceRadius:  'forceRadius',
    liquidForceStrength:'forceStrength',
    liquidDensityMul:   'densityMul',
    liquidNoiseScale:   'noiseScale',
    liquidNoiseSpeed:   'noiseSpeed',
    liquidSpecPow:      'specularPow',
    liquidSpecInt:      'specularInt',
    liquidBaseR:        'baseColorR',
    liquidBaseG:        'baseColorG',
    liquidBaseB:        'baseColorB',
    liquidHighR:        'highlightR',
    liquidHighG:        'highlightG',
    liquidHighB:        'highlightB',
};

const OVERLAY_KEYS = new Set([
    'titleBottom',
    'titleLeft',
    'titleSize',
    'titleSpacing',
    'subSize',
    'titleGlow',
]);

export const DEV_PARAM_REGISTRY = (() => {
    const registry = {};

    DEV_TOGGLES.forEach((toggle) => {
        registry[toggle.key] = {
            type: 'toggle',
            label: toggle.label,
            apply: [{ kind: 'toggle', key: toggle.key }],
        };
    });

    DEV_SECTIONS.forEach((section) => {
        Object.entries(section.params).forEach(([key, param]) => {
            const entry = { ...param, type: 'range', apply: [] };

            if (key in breathConfig) {
                entry.apply.push({ kind: 'config', object: 'breathConfig', key });
            }

            if (key in sceneParams) {
                entry.apply.push({ kind: 'config', object: 'sceneParams', key });
            }

            if (key in DISTORTION_UNIFORM_MAP) {
                entry.uniform = DISTORTION_UNIFORM_MAP[key];
                entry.description = entry.label;
                entry.apply.push({ kind: 'uniform', target: 'distortionPass', uniform: DISTORTION_UNIFORM_MAP[key] });
            }

            if (key in HALO_COLOR_MAP) {
                entry.uniform = `uHaloColor.${HALO_COLOR_MAP[key]}`;
                entry.description = entry.label;
                entry.apply.push({ kind: 'uniformColor', target: 'distortionPass', uniform: 'uHaloColor', channel: HALO_COLOR_MAP[key] });
            }

            if (key in FLUID_UNIFORM_MAP) {
                entry.uniform = FLUID_UNIFORM_MAP[key];
                entry.description = entry.label;
                entry.apply.push({ kind: 'uniform', target: 'fluidSystem', uniform: FLUID_UNIFORM_MAP[key] });
            }

            if (key in GEM_REBUILD_MAP) {
                entry.apply.push({ kind: 'config', object: 'gemParams', key: GEM_REBUILD_MAP[key] });
                entry.apply.push({ kind: 'rebuildGem' });
            }

            if (key === 'gemLabelYOffset') {
                entry.apply.push({ kind: 'config', object: 'gemParams', key: 'labelYOffset' });
            }

            if (key in GEM_POSITION_MAP) {
                entry.apply.push({ kind: 'config', object: 'gemParams', key: GEM_POSITION_MAP[key] });
                entry.apply.push({ kind: 'updateGemPosition' });
            }

            if (key in XLOGO_REBUILD_MAP) {
                entry.apply.push({ kind: 'config', object: 'xLogoParams', key: XLOGO_REBUILD_MAP[key] });
                entry.apply.push({ kind: 'rebuildXLogo' });
            }

            if (key === 'xLogoLabelYOffset') {
                entry.apply.push({ kind: 'config', object: 'xLogoParams', key: 'labelYOffset' });
            }

            if (key in XLOGO_POSITION_MAP) {
                entry.apply.push({ kind: 'config', object: 'xLogoParams', key: XLOGO_POSITION_MAP[key] });
                entry.apply.push({ kind: 'updateXLogoPosition' });
            }

            if (key in VORTEX_MAP) {
                entry.apply.push({ kind: 'config', object: 'vortexParams', key: VORTEX_MAP[key] });
            }

            if (key in LIQUID_CONFIG_MAP) {
                entry.apply.push({ kind: 'config', object: 'liquidParams', key: LIQUID_CONFIG_MAP[key] });
                entry.apply.push({ kind: 'liquidUniform', key: LIQUID_CONFIG_MAP[key] });
            }

            if (OVERLAY_KEYS.has(key)) {
                entry.apply.push({ kind: 'overlay' });
            }

            if (key === 'autoRotateSpd') {
                entry.apply.push({ kind: 'autoRotate' });
            }

            if (key === 'camX' || key === 'camY' || key === 'camZ') {
                entry.apply.push({ kind: 'camera' });
            }

            registry[key] = entry;
        });
    });

    return registry;
})();
