import * as THREE from 'three';
import { breathIntensity, breathValue } from '../animation-utils.js';
import { distortionParams, fluidParams } from '../config.js';

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
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        xLogoCamera.aspect = camera.aspect;
        xLogoCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);
    return onResize;
}

export function startRenderLoop({
    clock,
    camera,
    xLogoCamera,
    scene,
    xLogoScene,
    renderer,
    composer,
    distortionPass,
    dofPass,
    fluidSystem,
    liquidSystem,
    liquidTarget,
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
    xLogoAmbient,
    xLogoKey,
}) {
    const liquidMousePos = new THREE.Vector2();
    const liquidMouseVel = new THREE.Vector2();
    const syncXLogoCameraOptics = (srcCamera, dstCamera) => {
        if (!srcCamera || !dstCamera || srcCamera === dstCamera) return;
        dstCamera.fov = srcCamera.fov;
        dstCamera.aspect = srcCamera.aspect;
        dstCamera.near = srcCamera.near;
        dstCamera.far = srcCamera.far;
        dstCamera.updateProjectionMatrix();
    };

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        const breathVal = breathValue(time, breathConfig.period);
        // xLogoシーンのライトをメインの呼吸に同期（暗部を強く、明部は1.3まで）
        const breathDim = breathIntensity(breathVal);
        if (xLogoAmbient) xLogoAmbient.intensity = 0.6 * breathDim;
        if (xLogoKey) xLogoKey.intensity = 0.9 * breathDim;
        const scrollProg = getScrollProgress();
        updateScrollUI(scrollProg, breathVal);

        const mouse = updateMouseSmoothing();

        updateControls(time, breathVal);
        // xLogo は別シーン。カメラ位置/回転は固定し、光学パラメータのみ同期する。
        syncXLogoCameraOptics(camera, xLogoCamera);
        updateScene(time);
        updateNavigation(time);
        updateXLogo(time, xLogoCamera, breathVal);

        const navs = findNavMeshes();

        if (toggles.fluidField) {
            distortionPass.uniforms.uFluidInfluence.value = fluidParams.influence;
            fluidSystem.uniforms.uMouse.value.set(mouse.smoothX, mouse.smoothY);
            fluidSystem.uniforms.uMouseVelocity.value.set(mouse.velX, mouse.velY);
            fluidSystem.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
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

        distortionPass.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
        distortionPass.uniforms.uTime.value = time;
        distortionPass.uniforms.uMouse.value.set(mouse.smoothX, mouse.smoothY);
        dofPass.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
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

        renderer.clear();
        if (toggles.postProcess) {
            composer.render();
        } else {
            renderer.render(scene, camera);
            renderer.clearDepth();
            renderer.render(xLogoScene, xLogoCamera);
        }
    }

    animate();
}
