// devlog-bg.js — devlog.html用Three.js背景（フルシーン版）

import * as THREE from 'three';
import { createScene, updateScene } from '../scene.js';
import { sceneParams, toggles } from '../config.js';

console.log('[devlog-bg] Script loaded');

// prefers-reduced-motion対応
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 背景コンテナ取得
const container = document.getElementById('bg-container');
let scene = null;
let camera = null;
let renderer = null;

if (container && !prefersReducedMotion) {
  console.log('[devlog-bg] container:', container);

  // devlogでもフルシーンを使用
  const sceneBundle = createScene(container);
  scene = sceneBundle.scene;
  camera = sceneBundle.camera;
  renderer = sceneBundle.renderer;
  renderer.setClearColor(0x000000, 0);

  // devlog用に視覚要素を有効化
  toggles.background = true;
  toggles.water = true;
  toggles.kessonLights = true;
  toggles.vortex = true;
  toggles.fog = true;

  // カメラY位置を深海レベルに設定
  camera.position.y = -40;
  camera.lookAt(0, -40, 0);
  console.log('[devlog-bg] Scene created, camera at Y:', camera.position.y);

  // リサイズハンドラ
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  // アニメーションループ
  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    updateScene(time);
    renderer.render(scene, camera);
  };

  console.log('[devlog-bg] Starting animation loop');
  animate();

  // ページ離脱時にクリーンアップ
  window.addEventListener('beforeunload', () => {
    renderer.dispose();
  });
} else if (prefersReducedMotion) {
  console.log('[devlog-bg] Reduced motion preference detected, skipping animation');
}

// === Dev Panel（?dev パラメータで表示） ===
const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

if (DEV_MODE && container) {
  const panel = document.createElement('div');
  panel.id = 'devlog-dev-panel';
  panel.innerHTML = `
    <style>
      #devlog-dev-panel {
        position: fixed;
        top: 60px;
        right: 10px;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        padding: 12px;
        border-radius: 6px;
        font-family: monospace;
        font-size: 12px;
        min-width: 220px;
      }
      #devlog-dev-panel h4 {
        margin: 0 0 10px 0;
        color: #6af;
        font-size: 13px;
      }
      #devlog-dev-panel label {
        display: block;
        margin: 8px 0 4px 0;
        color: #aaa;
      }
      #devlog-dev-panel input[type="range"] {
        width: 100%;
      }
      #devlog-dev-panel .value {
        color: #6f6;
        float: right;
      }
    </style>
    <h4>🎛️ Devlog Background</h4>
    
    <label>Overlay Opacity <span class="value" id="val-overlay">0.50</span></label>
    <input type="range" id="slider-overlay" min="0" max="1" step="0.05" value="0.5">
    
    <label>Camera Y <span class="value" id="val-camY">-40</span></label>
    <input type="range" id="slider-camY" min="-100" max="50" step="5" value="-40">
    
    <label>Fog Density <span class="value" id="val-fog">0.012</span></label>
    <input type="range" id="slider-fog" min="0" max="0.05" step="0.001" value="0.012">
  `;
  document.body.appendChild(panel);

  // Overlay Opacity
  const sliderOverlay = document.getElementById('slider-overlay');
  const valOverlay = document.getElementById('val-overlay');
  const contentOverlay = document.getElementById('content-overlay');
  
  sliderOverlay.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valOverlay.textContent = v.toFixed(2);
    if (contentOverlay) {
      const mid = v;
      const end = Math.min(1, v * 1.4);
      const start = Math.min(1, v * 0.6);
      contentOverlay.style.background = `linear-gradient(\n        to bottom,\n        rgba(5, 5, 8, ${start}) 0%,\n        rgba(5, 5, 8, ${mid}) 30%,\n        rgba(5, 5, 8, ${end}) 100%\n      )`;
    }
  });

  // Camera Y
  const sliderCamY = document.getElementById('slider-camY');
  const valCamY = document.getElementById('val-camY');
  
  sliderCamY.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valCamY.textContent = v.toString();
    if (camera) {
      camera.position.y = v;
      camera.lookAt(0, v, 0);
    }
  });

  // Fog Density
  const sliderFog = document.getElementById('slider-fog');
  const valFog = document.getElementById('val-fog');
  
  sliderFog.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valFog.textContent = v.toFixed(3);
    if (scene && scene.fog) {
      scene.fog.density = v;
    }
  });

  console.log('[devlog-bg] Dev panel enabled');
}
