// config.js — 設定値・定数の一元管理

import * as THREE from 'three';

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
