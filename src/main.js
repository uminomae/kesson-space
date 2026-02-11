// main.js — エントリポイント

import * as THREE from 'three';
import { createScene, updateScene } from './scene.js';
import { initControls, updateControls } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';

const container = document.getElementById('canvas-container');
const { scene, camera, renderer } = createScene(container);

initControls(camera, container, renderer);
initNavigation({ scene, camera, renderer });

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    updateControls(time);
    updateScene(time);
    updateNavigation(time);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
