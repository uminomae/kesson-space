// scene.js — シーン構築・更新のオーケストレーション

import * as THREE from 'three';
import {
    sceneParams, toggles,
    FOG_V002_COLOR, FOG_V002_DENSITY,
    FOG_V004_COLOR, FOG_V004_DENSITY,
} from './config.js';
import { createBackgroundMaterial, createBackgroundMesh } from './shaders/background.js';
import { createWaterMaterial, createWaterMesh } from './shaders/water.js';
import { createKessonMaterial, createKessonMeshes } from './shaders/kesson.js';

export { sceneParams } from './config.js';

let _waterMaterial;
let _waterMesh;
let _kessonMeshes = [];
let _camera;
let _bgMat;
let _bgMesh;
let _scene;

export function createScene(container) {
    const scene = new THREE.Scene();
    _scene = scene;

    scene.fog = new THREE.FogExp2(FOG_V004_COLOR.getHex(), FOG_V004_DENSITY);

    // 背景
    _bgMat = createBackgroundMaterial();
    _bgMesh = createBackgroundMesh(_bgMat);
    scene.add(_bgMesh);

    // カメラ
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(sceneParams.camX, sceneParams.camY, sceneParams.camZ);
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
        const fogColor = new THREE.Color().lerpColors(FOG_V002_COLOR, FOG_V004_COLOR, m);
        _scene.fog.color.copy(fogColor);
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
}
