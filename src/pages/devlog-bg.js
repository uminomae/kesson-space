// devlog-bg.js — devlog.html用Three.js背景
// 設定値は devlog-config.js で一元管理

import * as THREE from 'three';
import { createScene, updateScene } from '../scene.js';
import { toggles } from '../config.js';
import { devlogParams } from '../devlog-config.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- 初期化 ---

function initBackground(container) {
  const sceneBundle = createScene(container);
  const { scene, camera, renderer } = sceneBundle;
  renderer.setClearColor(0x000000, 0);

  applyToggles();
  applyCamera(camera);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  startAnimationLoop(scene, camera, renderer);

  window.addEventListener('beforeunload', () => {
    renderer.dispose();
  });

  return { scene, camera, renderer };
}

function applyToggles() {
  const t = devlogParams.toggles;
  toggles.background = t.background;
  toggles.water = t.water;
  toggles.kessonLights = t.kessonLights;
  toggles.vortex = t.vortex;
  toggles.fog = t.fog;
}

function applyCamera(camera) {
  camera.position.y = devlogParams.camera.positionY;
  camera.lookAt(0, devlogParams.camera.lookAtY, 0);
}

function startAnimationLoop(scene, camera, renderer) {
  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    updateScene(time);
    renderer.render(scene, camera);
  };
  animate();
}

// --- メイン実行 ---

const container = document.getElementById('bg-container');
let scene = null;
let camera = null;

if (container && !prefersReducedMotion) {
  const bundle = initBackground(container);
  scene = bundle.scene;
  camera = bundle.camera;
}

// --- Dev Panel（?dev パラメータで表示） ---

const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

if (DEV_MODE && container) {
  initDevPanel(scene, camera);
}

function initDevPanel(sceneRef, cameraRef) {
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
    <h4>Devlog Background</h4>

    <label>Overlay Opacity <span class="value" id="val-overlay">${devlogParams.overlay.opacityMid.toFixed(2)}</span></label>
    <input type="range" id="slider-overlay" min="0" max="1" step="0.05" value="${devlogParams.overlay.opacityMid}">

    <label>Camera Y <span class="value" id="val-camY">${devlogParams.camera.positionY}</span></label>
    <input type="range" id="slider-camY" min="-100" max="50" step="5" value="${devlogParams.camera.positionY}">

    <label>Fog Density <span class="value" id="val-fog">${devlogParams.fog.density.toFixed(3)}</span></label>
    <input type="range" id="slider-fog" min="0" max="0.05" step="0.001" value="${devlogParams.fog.density}">
  `;
  document.body.appendChild(panel);

  // Overlay Opacity
  const sliderOverlay = document.getElementById('slider-overlay');
  const valOverlay = document.getElementById('val-overlay');
  const contentOverlay = document.getElementById('content-overlay');
  const bgColor = devlogParams.overlay.bgColor;

  sliderOverlay.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valOverlay.textContent = v.toFixed(2);
    if (contentOverlay) {
      const start = Math.min(1, v * 0.6);
      const mid = v;
      const end = Math.min(1, v * 1.4);
      contentOverlay.style.background = `linear-gradient(to bottom, rgba(${bgColor}, ${start}) 0%, rgba(${bgColor}, ${mid}) 30%, rgba(${bgColor}, ${end}) 100%)`;
    }
  });

  // Camera Y
  const sliderCamY = document.getElementById('slider-camY');
  const valCamY = document.getElementById('val-camY');

  sliderCamY.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valCamY.textContent = v.toString();
    if (cameraRef) {
      cameraRef.position.y = v;
      cameraRef.lookAt(0, v, 0);
    }
  });

  // Fog Density
  const sliderFog = document.getElementById('slider-fog');
  const valFog = document.getElementById('val-fog');

  sliderFog.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    valFog.textContent = v.toFixed(3);
    if (sceneRef && sceneRef.fog) {
      sceneRef.fog.density = v;
    }
  });
}
