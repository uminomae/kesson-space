// presets.js — Three.js背景プリセット定義

export const PRESETS = {
  full: {
    postProcess: true,
    fluidField: true,
    liquid: true,
    navOrbs: true,
    orbRefraction: true,
    vortex: true,
    kessonLights: true,
    water: true,
    fog: true,
    background: true,
    heatHaze: true,
    dof: true,
    targetFPS: 60,
    backgroundOpacity: 1.0,
  },
  lite: {
    postProcess: false,
    fluidField: false,
    liquid: false,
    navOrbs: false,
    orbRefraction: false,
    vortex: true,
    kessonLights: false,
    water: false,
    fog: true,
    background: true,
    heatHaze: false,
    dof: false,
    targetFPS: 30,
    backgroundOpacity: 0.3,
  },
  static: {
    postProcess: false,
    fluidField: false,
    liquid: false,
    navOrbs: false,
    orbRefraction: false,
    vortex: false,
    kessonLights: false,
    water: false,
    fog: true,
    background: true,
    heatHaze: false,
    dof: false,
    animate: false,
    backgroundOpacity: 0.2,
  }
};

export function getPreset(name) {
  return PRESETS[name] || PRESETS.full;
}

export function mergePreset(presetName, overrides = {}) {
  const base = getPreset(presetName);
  return { ...base, ...overrides };
}
