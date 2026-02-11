// main.js — エントリポイント
// DEV_MODE: true でパラメータ調整パネルを表示

import * as THREE from 'three';
import { createScene, updateScene, sceneParams } from './scene.js';
import { initControls, updateControls } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';

// ============================
// DEV_MODE: trueでパネル表示
// ============================
const DEV_MODE = true;

const container = document.getElementById('canvas-container');
const { scene, camera, renderer } = createScene(container);

initControls(camera, container, renderer);
initNavigation({ scene, camera, renderer });

// --- devパネル ---
if (DEV_MODE) {
    import('./dev-panel.js').then(({ initDevPanel }) => {
        initDevPanel((key, value) => {
            // パネルのスライダー変更 → sceneParamsに反映
            if (key in sceneParams) {
                sceneParams[key] = value;
            }
            // 自動回転速度はcontrolsに直接渡す（別モジュール）
            if (key === 'autoRotateSpd') {
                import('./controls.js').then(({ setAutoRotateSpeed }) => {
                    if (setAutoRotateSpeed) setAutoRotateSpeed(value);
                });
            }
        });
    });
}

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
