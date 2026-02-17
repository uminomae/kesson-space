import { setAutoRotateSpeed, setCameraPosition } from '../controls.js';
import { rebuildGem, rebuildXLogo, updateGemPosition, updateXLogoPosition } from '../nav-objects.js';
import {
    DEV_PARAM_REGISTRY,
    breathConfig,
    gemParams,
    liquidParams,
    sceneParams,
    toggles,
    vortexParams,
    xLogoParams,
} from '../config.js';

function updateOverlay(key, val) {
    const overlay = document.getElementById('overlay');
    const h1 = document.getElementById('title-h1');
    const sub = document.getElementById('title-sub');
    if (!overlay || !h1 || !sub) return;
    switch (key) {
        case 'titleBottom':  overlay.style.bottom = val + 'px'; break;
        case 'titleLeft':    overlay.style.left = val + 'px'; break;
        case 'titleSize':    h1.style.fontSize = val + 'rem'; break;
        case 'titleSpacing': h1.style.letterSpacing = val + 'em'; break;
        case 'subSize':      sub.style.fontSize = val + 'rem'; break;
        case 'titleGlow':    h1.style.textShadow = `0 0 ${val}px rgba(100,150,255,0.3)`; break;
        default:
            break;
    }
}

function applyLiquidUniform(liquidSystem, configKey, value) {
    if (!liquidSystem || !liquidSystem.uniforms) return;
    if (configKey == 'timestep') liquidSystem.uniforms.simulation.uTimestep.value = value;
    if (configKey == 'dissipation') liquidSystem.uniforms.simulation.uDissipation.value = value;
    if (configKey == 'forceRadius') {
        liquidSystem.uniforms.force.uRadius.value = value;
        liquidSystem.uniforms.splat.uRadius.value = value;
    }
    if (configKey == 'forceStrength') liquidSystem.uniforms.force.uStrength.value = value;
    if (configKey == 'densityMul') liquidSystem.uniforms.render.uDensityMul.value = value;
    if (configKey == 'noiseScale') liquidSystem.uniforms.render.uNoiseScale.value = value;
    if (configKey == 'noiseSpeed') liquidSystem.uniforms.render.uNoiseSpeed.value = value;
    if (configKey == 'specularPow') liquidSystem.uniforms.render.uSpecPow.value = value;
    if (configKey == 'specularInt') liquidSystem.uniforms.render.uSpecInt.value = value;
    if (configKey == 'baseColorR') liquidSystem.uniforms.render.uBaseColor.value.x = value;
    if (configKey == 'baseColorG') liquidSystem.uniforms.render.uBaseColor.value.y = value;
    if (configKey == 'baseColorB') liquidSystem.uniforms.render.uBaseColor.value.z = value;
    if (configKey == 'highlightR') liquidSystem.uniforms.render.uHighlight.value.x = value;
    if (configKey == 'highlightG') liquidSystem.uniforms.render.uHighlight.value.y = value;
    if (configKey == 'highlightB') liquidSystem.uniforms.render.uHighlight.value.z = value;
}

export function createDevValueApplier({ distortionPass, dofPass, fluidSystem, liquidSystem }) {
    return function applyDevValue(key, value) {
        const entry = DEV_PARAM_REGISTRY[key];
        if (!entry || !entry.apply) {
            updateOverlay(key, value);
            return;
        }

        const configTargets = {
            toggles,
            breathConfig,
            sceneParams,
            gemParams,
            xLogoParams,
            vortexParams,
            liquidParams,
        };

        entry.apply.forEach((action) => {
            switch (action.kind) {
                case 'toggle':
                    if (action.key in toggles) toggles[action.key] = value;
                    break;
                case 'config':
                    if (configTargets[action.object]) {
                        configTargets[action.object][action.key] = value;
                    }
                    break;
                case 'uniform': {
                    const target = action.target === 'distortionPass'
                        ? distortionPass
                        : action.target === 'dofPass'
                            ? dofPass
                            : fluidSystem;
                    if (target && target.uniforms && target.uniforms[action.uniform]) {
                        target.uniforms[action.uniform].value = value;
                    }
                    break;
                }
                case 'uniformColor': {
                    const target = action.target === 'distortionPass' ? distortionPass : null;
                    if (target && target.uniforms && target.uniforms[action.uniform]) {
                        target.uniforms[action.uniform].value[action.channel] = value;
                    }
                    break;
                }
                case 'rebuildGem':
                    rebuildGem();
                    break;
                case 'updateGemPosition':
                    updateGemPosition();
                    break;
                case 'rebuildXLogo':
                    rebuildXLogo();
                    break;
                case 'updateXLogoPosition':
                    updateXLogoPosition();
                    break;
                case 'camera':
                    setCameraPosition(sceneParams.camX, sceneParams.camY, sceneParams.camZ);
                    break;
                case 'autoRotate':
                    setAutoRotateSpeed(value);
                    break;
                case 'overlay':
                    updateOverlay(key, value);
                    break;
                case 'liquidUniform':
                    applyLiquidUniform(liquidSystem, action.key, value);
                    break;
                default:
                    break;
            }
        });
    };
}
