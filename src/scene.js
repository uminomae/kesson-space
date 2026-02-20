// scene.js — シーン構築・更新のオーケストレーション

import * as THREE from 'three';
import {
    sceneParams, toggles, vortexParams,
    FOG_V002_COLOR, FOG_V002_DENSITY,
    FOG_V004_COLOR, FOG_V004_DENSITY,
} from './config.js';
import { CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR } from './constants.js';
import { lerp } from './animation-utils.js';
import { createBackgroundMaterial, createBackgroundMesh } from './shaders/background.js';
import { createWaterMaterial, createWaterMesh } from './shaders/water.js';
import { createKessonMaterial, createKessonMeshes } from './shaders/kesson.js';
import { createVortexMaterial, createVortexMesh } from './shaders/vortex.js';
import { createConsciousArrowBundle, updateConsciousArrowBundle } from './consciousness/conscious-arrow-bundle.js';

export { sceneParams } from './config.js';

let _waterMaterial;
let _waterMesh;
let _kessonMeshes = [];
let _camera;
let _bgMat;
let _bgMesh;
let _scene;
let _vortexMaterial;
let _vortexMesh;
let _consciousArrowBundle;

// GC削減: フォグ色を事前確保（毎フレーム new しない）
const _fogColor = new THREE.Color();
const _kessonLegacyPos = new THREE.Vector3();
const _kessonWrapPos = new THREE.Vector3();
const _kessonToCam = new THREE.Vector3();
const KESSON_CAMERA_WRAP_MIN_DISTANCE = 7.0;

/**
 * カメラZ距離をアスペクト比から算出
 */
function calcCamZ(aspect) {
    if (aspect >= 1) return sceneParams.camZ;
    const t = Math.max(0, (aspect - 0.5) * 2.0);
    return sceneParams.camZ * t;
}

export function createScene(container) {
    const scene = new THREE.Scene();
    _scene = scene;

    scene.fog = new THREE.FogExp2(FOG_V004_COLOR.getHex(), FOG_V004_DENSITY);

    // 背景
    _bgMat = createBackgroundMaterial();
    _bgMesh = createBackgroundMesh(_bgMat);
    scene.add(_bgMesh);

    // カメラ
    const aspect = window.innerWidth / window.innerHeight;
    const camZ = calcCamZ(aspect);

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR);
    camera.position.set(sceneParams.camX, sceneParams.camY, camZ);
    camera.lookAt(sceneParams.camTargetX, sceneParams.camTargetY, sceneParams.camTargetZ);
    _camera = camera;

    // レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 水面
    _waterMaterial = createWaterMaterial(camera);
    _waterMesh = createWaterMesh(_waterMaterial);
    scene.add(_waterMesh);

    // 光（欠損）
    const kessonMaterial = createKessonMaterial();
    _kessonMeshes = createKessonMeshes(scene, kessonMaterial);

    // 渦（M2-4）
    _vortexMaterial = createVortexMaterial();
    _vortexMesh = createVortexMesh(_vortexMaterial);
    scene.add(_vortexMesh);

    _consciousArrowBundle = createConsciousArrowBundle();
    scene.add(_consciousArrowBundle);

    return { scene, camera, renderer, kessonMeshes: _kessonMeshes };
}

export function getCamera() {
    return _camera;
}

export function updateScene(time) {
    const mixCycle = sceneParams.mixCycle;
    const styleCycle = sceneParams.styleCycle;

    const m = (Math.sin(time * Math.PI / mixCycle) + 1.0) * 0.5;
    const s = (Math.sin(time * Math.PI / styleCycle) + 1.0) * 0.5;

    // --- 背景 ---
    _bgMesh.visible = toggles.background;
    if (toggles.background) {
        _bgMat.uniforms.uMix.value = m;
    }

    // --- フォグ ---
    if (toggles.fog) {
        _fogColor.lerpColors(FOG_V002_COLOR, FOG_V004_COLOR, m);
        _scene.fog.color.copy(_fogColor);
        const baseFogV002 = FOG_V002_DENSITY;
        const baseFogV004 = sceneParams.fogDensity;
        _scene.fog.density = lerp(baseFogV002, baseFogV004, m);
    } else {
        _scene.fog.density = 0;
    }

    // --- 水面 ---
    _waterMesh.visible = toggles.water;
    if (toggles.water) {
        _waterMaterial.uniforms.uTime.value = time;
        _waterMaterial.uniforms.uCameraPos.value.copy(_camera.position);
    }

    // --- 光（欠損）---
    _kessonMeshes.forEach(mesh => {
        mesh.visible = toggles.kessonLights;
        if (!toggles.kessonLights) return;

        const u = mesh.material.uniforms;
        u.uTime.value = time;
        u.uMix.value = m;
        u.uStyle.value = s;
        u.uBrightness.value = sceneParams.brightness;
        u.uGlowCore.value = sceneParams.glowCore;
        u.uGlowSpread.value = sceneParams.glowSpread;
        u.uBreathAmp.value = sceneParams.breathAmp;
        u.uWarpAmount.value = sceneParams.warpAmount;
        u.uTintR.value = sceneParams.tintR;
        u.uTintG.value = sceneParams.tintG;
        u.uTintB.value = sceneParams.tintB;

        const wobble = Math.sin(time * mesh.userData.speed + mesh.userData.id);
        if (mesh.userData.cameraWrap) {
            const orbitT = (time * mesh.userData.orbitSpeed) + mesh.userData.orbitPhase;
            const orbitRadius = mesh.userData.orbitRadius + (wobble * 0.8);
            _kessonWrapPos.set(
                _camera.position.x + Math.sin(orbitT) * orbitRadius,
                _camera.position.y + mesh.userData.orbitHeight + Math.sin(orbitT * 1.7 + mesh.userData.id) * 1.2,
                _camera.position.z + Math.cos(orbitT) * orbitRadius
            );

            _kessonToCam.copy(_kessonWrapPos).sub(_camera.position);
            const camDist = _kessonToCam.length();
            if (camDist < KESSON_CAMERA_WRAP_MIN_DISTANCE && camDist > 0.0001) {
                _kessonToCam.normalize().multiplyScalar(KESSON_CAMERA_WRAP_MIN_DISTANCE);
                _kessonWrapPos.copy(_camera.position).add(_kessonToCam);
            }
            mesh.position.copy(_kessonWrapPos);
        } else {
            // それ以外はワールド空間に散在させる
            mesh.position.set(
                mesh.userData.baseX + Math.cos(time * mesh.userData.speed * 0.5 + mesh.userData.id) * 2,
                mesh.userData.baseY + wobble * 2,
                mesh.userData.baseZ + Math.sin(time * mesh.userData.speed * 0.35 + mesh.userData.id) * 2
            );
        }
        mesh.lookAt(_camera.position);
    });

    // --- 渦（M2-4: FBM spiral）---
    _vortexMesh.visible = toggles.vortex;
    if (toggles.vortex) {
        const vu = _vortexMaterial.uniforms;
        vu.uTime.value = time;
        vu.uSpeed.value = vortexParams.speed;
        vu.uIntensity.value = vortexParams.intensity;
        vu.uScale.value = vortexParams.scale;
        vu.uOpacity.value = vortexParams.opacity;
        vu.uColorR.value = vortexParams.colorR;
        vu.uColorG.value = vortexParams.colorG;
        vu.uColorB.value = vortexParams.colorB;
        vu.uArmCount.value = vortexParams.armCount;
        _vortexMesh.position.set(vortexParams.posX, vortexParams.posY, vortexParams.posZ);
        _vortexMesh.scale.set(vortexParams.size, vortexParams.size, 1);
    }

    if (_consciousArrowBundle) {
        _consciousArrowBundle.visible = toggles.kessonLights;
        if (_consciousArrowBundle.visible) {
            updateConsciousArrowBundle(_consciousArrowBundle, time);
        }
    }
}
