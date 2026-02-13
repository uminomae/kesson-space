// scene.js — シーン構築・更新のオーケストレーション

import * as THREE from 'three';
import {
    sceneParams, toggles, vortexParams,
    FOG_V002_COLOR, FOG_V002_DENSITY,
    FOG_V004_COLOR, FOG_V004_DENSITY,
} from './config.js';
import { createBackgroundMaterial, createBackgroundMesh } from './shaders/background.js';
import { createWaterMaterial, createWaterMesh } from './shaders/water.js';
import { createKessonMaterial, createKessonMeshes } from './shaders/kesson.js';
import { createVortexMaterial, createVortexMesh } from './shaders/vortex.js';

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

// GC削減: フォグ色を事前確保（毎フレーム new しない）
const _fogColor = new THREE.Color();

/**
 * カメラZ距離をアスペクト比から算出
 * - landscape (aspect >= 1): デスクトップ値そのまま (34)
 * - portrait: aspect 0.5→0, aspect 1.0→34 の線形補間
 *   iPhone 9:16 (0.56) → camZ ≈ 4
 *   iPad 3:4  (0.75) → camZ ≈ 17
 */
function calcCamZ(aspect) {
    if (aspect >= 1) return sceneParams.camZ;
    const t = Math.max(0, (aspect - 0.5) * 2.0);  // 0.5→0, 1.0→1
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

    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(sceneParams.camX, sceneParams.camY, camZ);
    camera.lookAt(0, sceneParams.camTargetY, -10);
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
        _scene.fog.density = baseFogV002 + (baseFogV004 - baseFogV002) * m;
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
        mesh.position.y = mesh.userData.baseY + Math.sin(time * mesh.userData.speed + mesh.userData.id) * 2;
        mesh.position.x = mesh.userData.baseX + Math.cos(time * mesh.userData.speed * 0.5 + mesh.userData.id) * 2;
        mesh.lookAt(_camera.position);
    });

    // --- 渦（M2-4）---
    _vortexMesh.visible = toggles.vortex;
    if (toggles.vortex) {
        const vu = _vortexMaterial.uniforms;
        vu.uTime.value = time;
        vu.uSpeed.value = vortexParams.speed;
        vu.uIntensity.value = vortexParams.intensity;
        vu.uScale.value = vortexParams.scale;
        vu.uOpacity.value = vortexParams.opacity;
        _vortexMesh.position.set(vortexParams.posX, vortexParams.posY, vortexParams.posZ);
        _vortexMesh.scale.set(vortexParams.size, vortexParams.size, 1);
    }
}
