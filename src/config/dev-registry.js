import {
  breathConfig,
  sceneParams,
  gemParams,
  xLogoParams,
  vortexParams,
  liquidParams,
  quantumWaveParams,
  particleStormParams,
  toggles,
} from './params.js';
import { DEV_TOGGLES, DEV_SECTIONS } from './dev-ui.js';

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
    fluidInfluence: 'uFluidInfluence',
};

const DOF_UNIFORM_MAP = {
    dofStrength:    'uDofStrength',
    dofFocusRadius: 'uDofFocusRadius',
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

const QUANTUM_WAVE_MAP = {
    qwStrength:    'strength',
    qwSpeed:       'speed',
    qwBaseFreq:    'baseFreq',
    qwDispersion:  'dispersion',
    qwNoiseAmp:    'noiseAmp',
    qwNoiseScale:  'noiseScale',
    qwWaveCount:   'waveCount',
    qwEnvelope:    'envelope',
    qwYInfluence:  'yInfluence',
    qwGlowAmount:  'glowAmount',
    qwGlowColorR:  'glowColorR',
    qwGlowColorG:  'glowColorG',
    qwGlowColorB:  'glowColorB',
    qwCaberration: 'caberration',
    qwRimBright:   'rimBright',
    qwBlurAmount:  'blurAmount',
    qwFogDensity:  'fogDensity',
    qwFogColorR:   'fogColorR',
    qwFogColorG:   'fogColorG',
    qwFogColorB:   'fogColorB',
    qwDarken:      'darken',
    qwTurbulence:  'turbulence',
    qwSharpness:   'sharpness',
};

const PARTICLE_STORM_MAP = {
    psSpeed:        'speed',
    psIntensity:    'intensity',
    psOpacity:      'opacity',
    psBaseFreq:     'baseFreq',
    psDispersion:   'dispersion',
    psWaveCount:    'waveCount',
    psNoiseAmp:     'noiseAmp',
    psNoiseScale:   'noiseScale',
    psGrainDensity: 'grainDensity',
    psGrainSize:    'grainSize',
    psAdvect:       'advectStrength',
    psColorR:       'colorR',
    psColorG:       'colorG',
    psColorB:       'colorB',
    psBrightR:      'brightColorR',
    psBrightG:      'brightColorG',
    psBrightB:      'brightColorB',
    psColorMix:     'colorMix',
    psBrightness:   'brightness',
    psContrast:     'contrast',
    psSaturation:   'saturation',
    psGlowAmount:   'glowAmount',
    psGlowSpread:   'glowSpread',
    psGlowColorR:   'glowColorR',
    psGlowColorG:   'glowColorG',
    psGlowColorB:   'glowColorB',
    psSoftness:     'softness',
    psBloom:        'bloomAmount',
    psEdgeFadeStart:'edgeFadeStart',
    psEdgeFadeEnd:  'edgeFadeEnd',
    psCenterDim:    'centerDim',
    psDensityFloor: 'densityFloor',
    psFlickerSpeed: 'flickerSpeed',
    psFlickerAmt:   'flickerAmount',
    psDriftSpeed:   'driftSpeed',
    psDriftAngle:   'driftAngle',
    psPosX:         'posX',
    psPosY:         'posY',
    psPosZ:         'posZ',
    psSize:         'size',
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

            if (key in DOF_UNIFORM_MAP) {
                entry.uniform = DOF_UNIFORM_MAP[key];
                entry.description = entry.label;
                entry.apply.push({ kind: 'uniform', target: 'dofPass', uniform: DOF_UNIFORM_MAP[key] });
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

            if (key in QUANTUM_WAVE_MAP) {
                entry.apply.push({ kind: 'config', object: 'quantumWaveParams', key: QUANTUM_WAVE_MAP[key] });
            }

            if (key in PARTICLE_STORM_MAP) {
                entry.apply.push({ kind: 'config', object: 'particleStormParams', key: PARTICLE_STORM_MAP[key] });
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
