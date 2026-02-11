// main.js — エントリポイント
// URLパラメータでシーン切り替え: ?scene=v002

import * as THREE from 'three';
import { initControls, updateControls } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';

// --- シーン選択 ---
const params = new URLSearchParams(window.location.search);
const sceneId = params.get('scene') || 'default';

const SCENE_MAP = {
    'default': './scene.js',
    'v002': './scenes/scene-v002.js',
    'v004': './scene.js',
};

const scenePath = SCENE_MAP[sceneId] || SCENE_MAP['default'];

// --- 起動 ---
async function boot() {
    const { createScene, updateScene } = await import(scenePath);

    const container = document.getElementById('canvas-container');
    const { scene, camera, renderer, kessonMeshes } = createScene(container);

    initControls(camera, container, renderer);
    initNavigation({ scene, camera, renderer });

    // シーン切替 UI
    createSceneSwitcher(sceneId);

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
}

// --- シーン切替ボタン ---
function createSceneSwitcher(currentId) {
    const switcher = document.createElement('div');
    switcher.id = 'scene-switcher';

    const scenes = [
        { id: 'default', label: 'v004 slate blue' },
        { id: 'v002', label: 'v002 fractal' },
    ];

    scenes.forEach(s => {
        const btn = document.createElement('a');
        btn.href = `?scene=${s.id}`;
        btn.textContent = s.label;
        btn.className = 'scene-btn' + (s.id === currentId ? ' active' : '');
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
            text-decoration: none;
            font-family: monospace;
            font-size: 0.65rem;
            letter-spacing: 0.05em;
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

boot();
