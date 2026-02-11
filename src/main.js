// main.js — エントリポイント（初期化 + animate loop）
// v005: モジュール分割版

import * as THREE from 'three';
import { createScene, updateScene } from './scene.js';
import { initControls, updateControls } from './controls.js';
import { initNavigation } from './navigation.js';

// --- 初期化 ---
const container = document.getElementById('canvas-container');
const { scene, camera, renderer, kessonMeshes } = createScene(container);

initControls(camera, container);
initNavigation(camera, kessonMeshes, renderer);

// --- アニメーションループ ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    updateControls(time);
    updateScene(time);

    renderer.render(scene, camera);
}

// --- リサイズ ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
