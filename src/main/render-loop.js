import * as THREE from 'three';
import { breathIntensity, breathValue } from '../animation-utils.js';
import { distortionParams, fluidParams } from '../config.js';
import { statsBegin, statsEnd } from '../dev-stats.js';
import { updateSdfEntity } from '../sdf-entity.js';

export function createNavMeshFinder(scene) {
    let navMeshesCache = [];
    return function findNavMeshes() {
        if (navMeshesCache.length > 0) return navMeshesCache;
        const found = [];
        scene.traverse((obj) => {
            if (obj.isGroup && obj.userData && typeof obj.userData.index === 'number' && obj.userData.core) {
                found.push(obj);
            }
        });
        found.sort((a, b) => a.userData.index - b.userData.index);
        navMeshesCache = found;
        return found;
    };
}

export function attachResizeHandler({ camera, xLogoCamera, renderer, composer }) {
    const getSafeViewport = () => {
        const width = Number.isFinite(window.innerWidth) ? Math.max(1, window.innerWidth) : 1;
        const height = Number.isFinite(window.innerHeight) ? Math.max(1, window.innerHeight) : 1;
        return { width, height, aspect: width / height };
    };

    function onResize() {
        const { width, height, aspect } = getSafeViewport();
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        if (xLogoCamera) {
            xLogoCamera.aspect = aspect;
            xLogoCamera.updateProjectionMatrix();
        }
        renderer.setSize(width, height);
        composer.setSize(width, height);
    }
    window.addEventListener('resize', onResize);
    return onResize;
}

export function startRenderLoop({
    clock,
    camera,
    scene,
    renderer,
    composer,
    passes,
    effects,
    xLogo,
    findNavMeshes,
    updateMouseSmoothing,
    updateControls,
    updateScene,
    updateNavigation,
    updateXLogo,
    updateScrollUI,
    getScrollProgress,
    updateNavLabels,
    updateXLogoLabel,
    getOrbScreenData,
    toggles,
    breathConfig,
    liquidParams,
    sdfEntity,
}) {
    // DECISION: destructure grouped inputs once at the boundary so animate() keeps flat local names.
    // This avoids repetitive dot access in the hot path while preserving the grouped external API. (Phase A-2 / 2026-02-19)
    const { distortionPass, dofPass } = passes;
    const { fluidSystem, liquidSystem, liquidTarget } = effects;
    const {
        camera: xLogoCamera,
        scene: xLogoScene,
        ambient: xLogoAmbient,
        key: xLogoKey,
    } = xLogo;

    const liquidMousePos = new THREE.Vector2();
    const liquidMouseVel = new THREE.Vector2();
    const getViewportAspect = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            return Number.isFinite(camera?.aspect) && camera.aspect > 0 ? camera.aspect : 1;
        }
        return width / height;
    };
    const syncXLogoCameraOptics = (srcCamera, dstCamera) => {
        if (!srcCamera || !dstCamera || srcCamera === dstCamera) return;
        if (!Number.isFinite(srcCamera.fov)) return;
        const nextAspect = Number.isFinite(srcCamera.aspect) && srcCamera.aspect > 0
            ? srcCamera.aspect
            : getViewportAspect();
        const nextNear = Number.isFinite(srcCamera.near) && srcCamera.near > 0 ? srcCamera.near : dstCamera.near;
        const nextFar = Number.isFinite(srcCamera.far) && srcCamera.far > nextNear ? srcCamera.far : dstCamera.far;
        dstCamera.fov = srcCamera.fov;
        dstCamera.aspect = nextAspect;
        dstCamera.near = nextNear;
        dstCamera.far = nextFar;
        dstCamera.updateProjectionMatrix();
    };

    // DECISION: breath/light/scroll are grouped because they share the same breathVal source and must stay in lockstep.
    // (Phase B-3 / 2026-02-19)
    function updateBreathAndScroll(time) {
        const breathVal = breathValue(time, breathConfig.period);
        // xLogoシーンのライトをメインの呼吸に同期（暗部を強く、明部は1.3まで）
        const breathDim = breathIntensity(breathVal);
        if (xLogoAmbient) xLogoAmbient.intensity = 0.6 * breathDim;
        if (xLogoKey) xLogoKey.intensity = 0.9 * breathDim;
        const scrollProg = getScrollProgress();
        updateScrollUI(scrollProg, breathVal);
        return breathVal;
    }

    // DECISION: controls/scene/navigation/x-logo updates remain in one phase to preserve camera-optics sync ordering.
    // KEPT: this stays separate from effects so post-process uniforms always see the post-update scene state. (Phase B-3 / 2026-02-19)
    function updateScenePhase(time, breathVal, mouse) {
        updateControls(time, breathVal);
        // xLogo は別シーン。カメラ位置/回転は固定し、光学パラメータのみ同期する。
        syncXLogoCameraOptics(camera, xLogoCamera);
        updateScene(time);
        updateNavigation(time);

        if (sdfEntity) {
            sdfEntity.mesh.visible = Boolean(toggles.sdfEntity);
            if (sdfEntity.mesh.visible) {
                sdfEntity.mesh.lookAt(camera.position);
                updateSdfEntity(sdfEntity.material, time, breathVal, mouse);
            }
        }

        updateXLogo(time, xLogoCamera);
    }

    // DECISION: fluid/liquid/orb refraction are grouped as effect feeds into distortion uniforms before post-process pass.
    // (Phase B-3 / 2026-02-19)
    function updateEffects(time, mouse, navs) {
        if (toggles.fluidField) {
            distortionPass.uniforms.uFluidInfluence.value = fluidParams.influence;
            fluidSystem.uniforms.uMouse.value.set(mouse.smoothX, mouse.smoothY);
            fluidSystem.uniforms.uMouseVelocity.value.set(mouse.velX, mouse.velY);
            fluidSystem.uniforms.uAspect.value = getViewportAspect();
            fluidSystem.update();
            distortionPass.uniforms.tFluidField.value = fluidSystem.getTexture();
        } else {
            distortionPass.uniforms.uFluidInfluence.value = 0;
        }

        if (toggles.liquid) {
            liquidMousePos.set(mouse.smoothX, mouse.smoothY);
            liquidMouseVel.set(mouse.velX, mouse.velY);
            liquidSystem.update(liquidMousePos, liquidMouseVel);
            liquidSystem.setTime(time);
            liquidSystem.copyDensityTo(liquidTarget);
            distortionPass.uniforms.tLiquid.value = liquidTarget.texture;
            distortionPass.uniforms.uLiquidStrength.value = liquidParams.densityMul;
        } else {
            distortionPass.uniforms.uLiquidStrength.value = 0;
        }

        if (toggles.navOrbs && toggles.orbRefraction) {
            if (navs.length > 0) {
                const orbData = getOrbScreenData(navs, camera);
                for (let i = 0; i < 3; i++) {
                    if (i < orbData.length) {
                        distortionPass.uniforms.uOrbs.value[i].set(orbData[i].x, orbData[i].y);
                        distortionPass.uniforms.uOrbStrengths.value[i] = orbData[i].strength;
                        distortionPass.uniforms.uOrbRadii.value[i] = orbData[i].radius;
                    } else {
                        distortionPass.uniforms.uOrbStrengths.value[i] = 0.0;
                        distortionPass.uniforms.uOrbRadii.value[i] = 0.0;
                    }
                }
            }
        } else {
            for (let i = 0; i < 3; i++) {
                distortionPass.uniforms.uOrbStrengths.value[i] = 0.0;
            }
        }
    }

    // DECISION: all post uniforms and label projection updates stay together so per-frame screen-space values are coherent.
    // KEPT: label updates remain here (not in renderFrame) because they depend on finalized uniform/mouse state, not draw calls.
    // (Phase B-3 / 2026-02-19)
    function updatePostProcess(time, mouse, navs) {
        const aspect = getViewportAspect();
        distortionPass.uniforms.uAspect.value = aspect;
        distortionPass.uniforms.uTime.value = time;
        distortionPass.uniforms.uMouse.value.set(mouse.smoothX, mouse.smoothY);
        dofPass.uniforms.uAspect.value = aspect;
        dofPass.uniforms.uMouse.value.set(mouse.smoothX, mouse.smoothY);

        if (toggles.heatHaze) {
            distortionPass.uniforms.uHeatHaze.value = distortionParams.heatHaze;
            distortionPass.uniforms.uHeatHazeRadius.value = distortionParams.heatHazeRadius;
            distortionPass.uniforms.uHeatHazeSpeed.value = distortionParams.heatHazeSpeed;
        } else {
            distortionPass.uniforms.uHeatHaze.value = 0;
        }
        if (toggles.dof) {
            dofPass.uniforms.uDofStrength.value = distortionParams.dofStrength;
            dofPass.uniforms.uDofFocusRadius.value = distortionParams.dofFocusRadius;
        } else {
            dofPass.uniforms.uDofStrength.value = 0;
        }

        updateNavLabels(navs, camera);
        updateXLogoLabel(xLogoCamera);
    }

    // DECISION: render stays as a dedicated terminal phase because post-process toggle decides final draw path.
    // (Phase B-3 / 2026-02-19)
    function renderFrame() {
        renderer.clear();
        if (toggles.postProcess) {
            composer.render();
        } else {
            renderer.render(scene, camera);
            renderer.clearDepth();
            renderer.render(xLogoScene, xLogoCamera);
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        statsBegin();
        const time = clock.getElapsedTime();

        const breathVal = updateBreathAndScroll(time);
        const mouse = updateMouseSmoothing();
        updateScenePhase(time, breathVal, mouse);

        const navs = findNavMeshes();
        updateEffects(time, mouse, navs);
        updatePostProcess(time, mouse, navs);
        renderFrame();

        statsEnd();
    }

    animate();
}
