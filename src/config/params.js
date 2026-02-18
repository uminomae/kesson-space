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
    particleStorm: false,  // デフォルトOFF（devパネルで手動ON）
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

// --- 波動パーティクル砂嵐パラメータ ---
export const particleStormParams = {
    speed:       0.15,    // 波の時間進行速度
    intensity:   1.0,     // 全体の明るさ
    opacity:     0.7,     // 全体の透明度
    baseFreq:    3.0,     // 基本周波数
    dispersion:  0.08,    // 分散関係 ω = dispersion * k²
    waveCount:   8.0,     // 重ね合わせ波数
    noiseAmp:    0.3,     // FBM位相ノイズ振幅
    noiseScale:  2.0,     // ノイズスケール
    grainDensity: 800.0,  // 粒の密度（ハッシュグリッド解像度）
    grainSize:   0.6,     // 粒の明るさカーブの鋭さ（0=ぼやけ 1=シャープ）
    advectStrength: 0.02, // 波動場による移流の強さ
    colorR:      0.3,     // ベース色 R
    colorG:      0.6,     // ベース色 G
    colorB:      0.9,     // ベース色 B
    posX:        0,       // メッシュ位置X
    posY:        0,       // メッシュ位置Y
    posZ:        5,       // メッシュ位置Z
    size:        60,      // メッシュスケール

    // --- 色・明るさ（NEW）---
    brightColorR:  0.7,    // 高密度域の色 R
    brightColorG:  0.85,   // 高密度域の色 G
    brightColorB:  1.0,    // 高密度域の色 B
    colorMix:      0.5,    // base↔bright の混合度（densityベース, 0=baseのみ）
    brightness:    1.0,    // 全体の明るさ乗数
    contrast:      1.0,    // 粒の明暗コントラスト（0.5=ソフト, 2.0=ハード）
    saturation:    1.0,    // 彩度（0=モノクロ, 1=通常, 2=鮮やか）

    // --- 発光（NEW）---
    glowAmount:    0.0,    // 粒の発光量（0=なし, 1=強い）
    glowSpread:    2.0,    // 発光の広がり（累乗の逆数的, 小さい=広い）
    glowColorR:    0.4,    // 発光色 R
    glowColorG:    0.7,    // 発光色 G
    glowColorB:    1.0,    // 発光色 B

    // --- ぼかし・ソフトネス（NEW）---
    softness:      0.0,    // 粒のエッジのぼかし（0=シャープ, 1=ぼやけ）
    bloomAmount:   0.0,    // 全体的なブルーム風の光にじみ（0=なし, 1=強い）

    // --- フェード・マスク（NEW）---
    edgeFadeStart: 1.8,    // エッジフェード開始距離
    edgeFadeEnd:   0.3,    // エッジフェード終了距離
    centerDim:     0.0,    // 中心の減光（0=なし, 1=中心が暗い）
    densityFloor:  0.0,    // 密度の最低値（0=完全に消える, 0.3=薄く残る）

    // --- 動き（NEW）---
    flickerSpeed:  2.0,    // 粒の明滅速度
    flickerAmount: 0.5,    // 明滅の振幅（0=明滅なし, 1=完全に消える瞬間あり）
    driftSpeed:    0.0,    // 全体のゆっくりドリフト速度
    driftAngle:    0.0,    // ドリフト方向（ラジアン）
};

// --- 後方互換（旧 DISTORTION_PARAMS） ---
export const DISTORTION_PARAMS = {
    strength: distortionParams.strength,
    chromaticAberration: distortionParams.aberration,
};
