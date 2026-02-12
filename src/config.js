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
    heatHaze: false,
    dof: true,
    orbRefraction: true,
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

// --- Gem四芒星パラメータ（Gemini設計: 乱流+Haloグロー版） ---
export const gemParams = {
    meshScale:           1.0,    // GLTFメッシュのスケール
    glowStrength:        2.0,    // フレネルグロー強度
    rimPower:            2.5,    // リムの鋭さ
    innerGlow:           0.3,    // 中心グロー（低め→暗闇感）
    turbulence:          0.5,    // 法線擾乱強度（乱流）
    haloWidth:           0.3,    // Haloの幅
    haloIntensity:       0.6,    // Haloの強度
    chromaticAberration: 0.15,   // 色収差
    posX: 10,
    posY: 3,
    posZ: 18,
};

// --- 後方互換（旧 DISTORTION_PARAMS） ---
export const DISTORTION_PARAMS = {
    strength: distortionParams.strength,
    chromaticAberration: distortionParams.aberration,
};
