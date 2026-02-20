import {
  breathConfig,
  consciousnessParams,
  navOrbParams,
  sceneParams,
  vortexParams,
  distortionParams,
  gemParams,
  xLogoParams,
  fluidParams,
  liquidParams,
  toggles,
} from './params.js';

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
    { key: 'sdfEntity',     label: '意識SDF' },
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
        id: 'consciousnessSdf',
        title: '意識SDF（保存用）',
        params: {
            csFlowSpeed:      { label: '流速',            min: 0.1,  max: 2.2,  step: 0.01,  default: consciousnessParams.csFlowSpeed },
            csFreqLow:        { label: '周波数 低',        min: 0.5,  max: 4.5,  step: 0.05,  default: consciousnessParams.csFreqLow },
            csFreqHigh:       { label: '周波数 高',        min: 1.0,  max: 7.0,  step: 0.05,  default: consciousnessParams.csFreqHigh },
            csThicknessLow:   { label: '膜厚 始点',        min: 0.04, max: 0.4,  step: 0.005, default: consciousnessParams.csThicknessLow },
            csThicknessHigh:  { label: '膜厚 終点',        min: 0.02, max: 0.2,  step: 0.005, default: consciousnessParams.csThicknessHigh },
            csEnvelopeRadius: { label: '束半径',           min: 0.6,  max: 2.5,  step: 0.02,  default: consciousnessParams.csEnvelopeRadius },
            csDensityGain:    { label: '発光密度',         min: 0.01, max: 0.2,  step: 0.002, default: consciousnessParams.csDensityGain },
            csStepNear:       { label: '近距離ステップ',    min: 0.02, max: 0.12, step: 0.002, default: consciousnessParams.csStepNear },
            csStepFar:        { label: '遠距離ステップ',    min: 0.06, max: 0.3,  step: 0.005, default: consciousnessParams.csStepFar },
            csGateTint:       { label: 'ゲート干渉色',      min: 0.0,  max: 1.0,  step: 0.01,  default: consciousnessParams.csGateTint },
            csVignette:       { label: '周辺減光',         min: 0.0,  max: 0.6,  step: 0.01,  default: consciousnessParams.csVignette },
            csMouseParallax:  { label: 'マウス視差',       min: 0.0,  max: 0.2,  step: 0.005, default: consciousnessParams.csMouseParallax },
        }
    },
    {
        id: 'consciousnessColor',
        title: '意識SDF 色・光',
        params: {
            csLightBoost: { label: '光量ブースト', min: 0.2, max: 3.0, step: 0.05, default: consciousnessParams.csLightBoost },
            csPreGamma:   { label: 'トーン硬さ',   min: 0.6, max: 2.2, step: 0.02, default: consciousnessParams.csPreGamma },
            csExposure:   { label: '露光',         min: 0.4, max: 3.0, step: 0.05, default: consciousnessParams.csExposure },
            csCoolR:      { label: '始点色 R',     min: 0.0, max: 1.5, step: 0.02, default: consciousnessParams.csCoolR },
            csCoolG:      { label: '始点色 G',     min: 0.0, max: 1.5, step: 0.02, default: consciousnessParams.csCoolG },
            csCoolB:      { label: '始点色 B',     min: 0.0, max: 1.5, step: 0.02, default: consciousnessParams.csCoolB },
            csWarmR:      { label: '終点色 R',     min: 0.0, max: 1.5, step: 0.02, default: consciousnessParams.csWarmR },
            csWarmG:      { label: '終点色 G',     min: 0.0, max: 1.5, step: 0.02, default: consciousnessParams.csWarmG },
            csWarmB:      { label: '終点色 B',     min: 0.0, max: 1.5, step: 0.02, default: consciousnessParams.csWarmB },
            csGateR:      { label: '干渉色 R',     min: 0.0, max: 1.5, step: 0.02, default: consciousnessParams.csGateR },
            csGateG:      { label: '干渉色 G',     min: 0.0, max: 1.5, step: 0.02, default: consciousnessParams.csGateG },
            csGateB:      { label: '干渉色 B',     min: 0.0, max: 1.5, step: 0.02, default: consciousnessParams.csGateB },
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
            dofStrength:   { label: 'DOFボケ強度',   min: 0.0, max: 0.04, step: 0.0005, default: distortionParams.dofStrength },
            dofFocusRadius:{ label: 'DOF深度(フォーカス半径)', min: 0.05, max: 1.0, step: 0.01, default: distortionParams.dofFocusRadius },
        }
    },
    {
        id: 'orbLayout',
        title: 'ナビオーブ配置',
        params: {
            orbCenterX:    { label: '球中心 X',      min: -30, max: 30, step: 0.5, default: navOrbParams.centerX },
            orbCenterY:    { label: '球中心 Y',      min: -25, max: 20, step: 0.5, default: navOrbParams.centerY },
            orbCenterZ:    { label: '球中心 Z',      min: -30, max: 30, step: 0.5, default: navOrbParams.centerZ },
            orbRadius:     { label: '球配置 半径',   min: 1, max: 20, step: 0.5, default: navOrbParams.radius },
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
            camTargetX:    { label: '注視点 X',      min: -30, max: 30, step: 0.5, default: sceneParams.camTargetX },
            camTargetY:    { label: '注視点 Y',      min: -30, max: 30, step: 0.5, default: sceneParams.camTargetY },
            camTargetZ:    { label: '注視点 Z',      min: -30, max: 30, step: 0.5, default: sceneParams.camTargetZ },
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
