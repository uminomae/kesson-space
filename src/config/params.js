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
    quantumField: false,  // デフォルトOFF
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
    meshScale:     0.6,
    glowStrength:  0.4,
    rimPower:      0.5,
    innerGlow:     0.1,
    posX: -20,
    posY: 5,
    posZ: 11,
    labelYOffset: 1.5,
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

// --- 量子場波動関数パラメータ ---
export const quantumFieldParams = {
    speed:            0.3,     // 時間進行速度
    intensity:        1.2,     // 全体輝度
    waveCount:        12.0,    // 重ね合わせ波の数
    baseFreq:         3.0,     // 基本波数
    dispersion:       0.08,    // 分散関係の強さ（ω = dispersion * k²）
    noiseAmp:         1.5,     // 位相ノイズ振幅（大→リキッド感強）
    noiseScale:       0.8,     // 位相ノイズ空間周波数
    envelopeWidth:    2.0,     // ガウシアンエンベロープ幅
    transitionCenter: 0.2,     // 波動→集中 遷移の中心x座標
    transitionWidth:  0.8,     // 遷移の幅（大→緩やか）
    colorR:           0.04,    // ベースカラー（深い青）
    colorG:           0.10,
    colorB:           0.18,
    glowR:            0.10,    // 発光カラー（シアン）
    glowG:            0.35,
    glowB:            0.55,
    opacity:          0.85,
    posX:             8,
    posY:             -5,
    posZ:             5,
    size:             15,
};

// --- 後方互換（旧 DISTORTION_PARAMS） ---
export const DISTORTION_PARAMS = {
    strength: distortionParams.strength,
    chromaticAberration: distortionParams.aberration,
};
