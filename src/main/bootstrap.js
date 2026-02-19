import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { createScene } from '../scene.js';
import { createXLogoObjects } from '../nav-objects.js';
import { CameraDofShader, DistortionShader } from '../shaders/distortion-pass.js';
import { createFluidSystem } from '../shaders/fluid-field.js';
import { createLiquidSystem } from '../shaders/liquid.js';
import { liquidParams, sceneParams } from '../config.js';

function finiteOr(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
}

function applyStableXLogoCameraPose(xLogoCamera, sourceCamera) {
    const fallbackPos = sourceCamera?.position || { x: 0, y: 8, z: 24 };
    const posX = finiteOr(sceneParams?.camX, finiteOr(fallbackPos.x, 0));
    const posY = finiteOr(sceneParams?.camY, finiteOr(fallbackPos.y, 8));
    const rawPosZ = finiteOr(sceneParams?.camZ, finiteOr(fallbackPos.z, 24));
    // KEPT: x-logo camera is fixed-scene; avoid z=0 edge case that can push x-logo/gem out of stable framing.
    const posZ = Math.abs(rawPosZ) < 1e-3 ? 1 : rawPosZ;

    const targetX = finiteOr(sceneParams?.camTargetX, 0);
    const targetY = finiteOr(sceneParams?.camTargetY, 0);
    const targetZ = finiteOr(sceneParams?.camTargetZ, 0);

    xLogoCamera.position.set(posX, posY, posZ);
    xLogoCamera.lookAt(targetX, targetY, targetZ);
    xLogoCamera.updateProjectionMatrix();
    xLogoCamera.updateMatrixWorld(true);
}

export function bootstrapMainScene(container) {
    const { scene, camera, renderer } = createScene(container);
    renderer.autoClear = false;

    const xLogoScene = new THREE.Scene();
    const xLogoCamera = camera.clone();
    // DECISION: xLogo camera is intentionally fixed-scene, so do not inherit portrait-only camZ=0 bootstrap value.
    // KEPT: render-loop still syncs optics only; transform remains fixed for x-logo composition consistency.
    // TODO(refactor): if we ever animate x-logo camera transform, replace fixed pose with a dedicated camera controller.
    // (mobile portrait hardening / 2026-02-19)
    applyStableXLogoCameraPose(xLogoCamera, camera);
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
    const xLogoPass = new RenderPass(xLogoScene, xLogoCamera);
    xLogoPass.clear = false;
    xLogoPass.clearDepth = true;
    composer.addPass(xLogoPass);

    const distortionPass = new ShaderPass(DistortionShader);
    composer.addPass(distortionPass);
    distortionPass.uniforms.uLiquidOffsetScale.value = liquidParams.refractOffsetScale;
    distortionPass.uniforms.uLiquidThreshold.value = liquidParams.refractThreshold;

    // DOFは一眼レフのレンズボケのように「最終画像全体」に掛けたいので最後段で適用する。
    // 先に掛けると、その後段のオーブ屈折などがシャープに再描画されてボケ対象から外れて見える。
    const dofPass = new ShaderPass(CameraDofShader);
    composer.addPass(dofPass);

    // DECISION: keep scene/camera/renderer/composer flat because they are cross-cutting core dependencies.
    // passes/effects/xLogo are grouped since their usage is local to render-loop and dev-control touchpoints.
    // (Phase A-2 / 2026-02-19)
    return {
        scene,
        camera,
        renderer,
        composer,
        passes: {
            distortionPass,
            dofPass,
        },
        effects: {
            fluidSystem,
            liquidSystem,
            liquidTarget,
        },
        xLogo: {
            scene: xLogoScene,
            camera: xLogoCamera,
            group: xLogoGroup,
            ambient: xLogoAmbient,
            key: xLogoKey,
        },
    };
}
