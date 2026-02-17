import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { createScene } from '../scene.js';
import { createXLogoObjects } from '../nav-objects.js';
import { DistortionShader } from '../shaders/distortion-pass.js';
import { createFluidSystem } from '../shaders/fluid-field.js';
import { createLiquidSystem } from '../shaders/liquid.js';
import { liquidParams } from '../config.js';

export function bootstrapMainScene(container) {
    const { scene, camera, renderer } = createScene(container);
    renderer.autoClear = false;

    const xLogoScene = new THREE.Scene();
    const xLogoCamera = camera.clone();
    const xLogoGroup = createXLogoObjects(xLogoScene, xLogoCamera);
    const xLogoAmbient = new THREE.AmbientLight(0xffffff, 0.6);
    const xLogoKey = new THREE.DirectionalLight(0xffffff, 0.9);
    xLogoKey.position.set(10, 12, 8);
    xLogoScene.add(xLogoAmbient, xLogoKey);

    const fluidSystem = createFluidSystem(renderer);
    const liquidSystem = createLiquidSystem(renderer);
    const liquidTarget = new THREE.WebGLRenderTarget(liquidParams.textureSize, liquidParams.textureSize, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
    });

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const distortionPass = new ShaderPass(DistortionShader);
    composer.addPass(distortionPass);
    distortionPass.uniforms.uLiquidOffsetScale.value = liquidParams.refractOffsetScale;
    distortionPass.uniforms.uLiquidThreshold.value = liquidParams.refractThreshold;

    return {
        scene,
        camera,
        renderer,
        composer,
        distortionPass,
        fluidSystem,
        liquidSystem,
        liquidTarget,
        xLogoScene,
        xLogoCamera,
        xLogoGroup,
    };
}
