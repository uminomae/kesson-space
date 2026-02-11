// main.js — エントリポイント（初期化 + animate loop）

import * as THREE from 'three';
import { createScene, updateScene } from './scene.js';
import { initControls, updateControls } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';

// --- 初期化 ---
const container = document.getElementById('canvas-container');
const { scene, camera, renderer, kessonMeshes } = createScene(container);

initControls(camera, container, renderer);
initNavigation({ scene, camera, renderer });

// --- アニメーションループ ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    updateControls(time);
    updateScene(time);
    updateNavigation(time);

    renderer.render(scene, camera);
}

// --- リサイズ ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
