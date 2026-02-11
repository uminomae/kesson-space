// main.js — エントリポイント
// 左下ボタンでグラデーション遷移

import * as THREE from 'three';
import { createScene, updateScene, setMix, getMix } from './scene.js';
import { initControls, updateControls } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';

// --- 初期化 ---
const container = document.getElementById('canvas-container');
const { scene, camera, renderer, kessonMeshes } = createScene(container);

initControls(camera, container, renderer);
initNavigation({ scene, camera, renderer });

// --- シーン切替 UI ---
createSceneSwitcher();

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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

// --- 切替ボタン ---
function createSceneSwitcher() {
    const switcher = document.createElement('div');
    switcher.id = 'scene-switcher';

    const scenes = [
        { mix: 0.0, label: 'deep dark' },
        { mix: 1.0, label: 'slate blue' },
    ];

    scenes.forEach(s => {
        const btn = document.createElement('button');
        btn.textContent = s.label;
        btn.className = 'scene-btn' + (s.mix === getMix() ? ' active' : '');
        btn.addEventListener('click', () => {
            setMix(s.mix);
            switcher.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        switcher.appendChild(btn);
    });

    document.body.appendChild(switcher);

    const style = document.createElement('style');
    style.textContent = `
        #scene-switcher {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 100;
            display: flex;
            gap: 8px;
        }
        .scene-btn {
            padding: 4px 10px;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 2px;
            color: rgba(255, 255, 255, 0.25);
            font-family: monospace;
            font-size: 0.65rem;
            letter-spacing: 0.05em;
            cursor: pointer;
            transition: all 0.4s ease;
        }
        .scene-btn:hover {
            color: rgba(255, 255, 255, 0.6);
            border-color: rgba(255, 255, 255, 0.2);
        }
        .scene-btn.active {
            color: rgba(140, 180, 255, 0.7);
            border-color: rgba(140, 180, 255, 0.3);
        }
    `;
    document.head.appendChild(style);
}
