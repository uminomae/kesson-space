// config.js — 設定値・定数の一元管理

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
    heatHaze: true,
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

// --- 歪みエフェクト定数 ---
export const DISTORTION_PARAMS = {
    strength: 0.03,
    chromaticAberration: 0.1,
};

// --- devパネル連携パラメータ ---
export const sceneParams = {
    brightness: 1.0,
    glowCore: 0.07,
    glowSpread: 0.08,
    breathAmp: 0.15,
    warpAmount: 1.0,
    mixCycle: 2.0,
    styleCycle: 14.0,
    fogDensity: 0.0,
    camX: -14,
    camY: 0,
    camZ: 34,
    camTargetY: -1,
};
