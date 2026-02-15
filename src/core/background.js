// background.js — 共有背景生成API

import * as THREE from 'three';
import { createRenderer } from './renderer.js';
import { mergePreset } from './presets.js';
import { createBackgroundMaterial, createBackgroundMesh } from '../shaders/background.js';
import { createVortexMaterial, createVortexMesh } from '../shaders/vortex.js';
import { vortexParams } from '../config.js';
import { CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR } from '../constants.js';

/**
 * 共有背景を生成
 * @param {Object} options
 * @param {HTMLElement} options.container - 背景を配置するコンテナ
 * @param {string} options.preset - 'full' | 'lite' | 'static'
 * @param {Object} options.options - プリセット上書きオプション
 * @returns {{ scene, camera, renderer, animate, dispose }}
 */
export function createBackground({ container, preset = 'full', options = {} }) {
  const config = mergePreset(preset, options);
  
  // シーン
  const scene = new THREE.Scene();
  scene.background = null; // 透明背景
  if (config.fog) {
    scene.fog = new THREE.FogExp2(0x050510, 0.015);
  }

  // カメラ
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR);
  camera.position.set(0, 0, 50);
  
  // レンダラー
  const renderer = createRenderer({ container, alpha: true });
  
  // 背景メッシュ
  let bgMaterial = null;
  let bgMesh = null;
  if (config.background) {
    bgMaterial = createBackgroundMaterial();
    if (config.backgroundOpacity !== undefined) {
      bgMaterial.uniforms.uOpacity.value = config.backgroundOpacity;
    }
    bgMesh = createBackgroundMesh(bgMaterial);
    scene.add(bgMesh);
  }
  
  // 渦（liteでも表示）
  let vortexMaterial = null;
  let vortexMesh = null;
  if (config.vortex) {
    vortexMaterial = createVortexMaterial();
    vortexMesh = createVortexMesh(vortexMaterial);
    scene.add(vortexMesh);
  }
  
  // リサイズハンドラ
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);
  
  // アニメーションループ
  let animationId = null;
  const clock = new THREE.Clock();
  let lastFrameTime = 0;
  const frameInterval = config.targetFPS ? 1000 / config.targetFPS : 0;
  
  const animate = () => {
    if (config.animate === false) {
      // 静的モード: 1フレームだけ描画
      renderer.render(scene, camera);
      return;
    }
    
    animationId = requestAnimationFrame(animate);
    
    // FPS制限
    if (frameInterval > 0) {
      const now = performance.now();
      if (now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;
    }
    
    const time = clock.getElapsedTime();
    
    // 背景更新
    if (bgMaterial) {
      const m = (Math.sin(time * Math.PI / 20) + 1.0) * 0.5;
      bgMaterial.uniforms.uMix.value = m;
    }

    // 渦更新
    if (vortexMaterial && vortexMesh) {
      const opacity = config.backgroundOpacity || 1;
      vortexMaterial.uniforms.uTime.value = time;
      vortexMaterial.uniforms.uSpeed.value = vortexParams.speed * 0.5; // 控えめに
      vortexMaterial.uniforms.uIntensity.value = vortexParams.intensity * opacity;
      vortexMaterial.uniforms.uScale.value = vortexParams.scale;
      vortexMaterial.uniforms.uOpacity.value = (vortexParams.opacity || 0.5) * opacity;
      vortexMaterial.uniforms.uColorR.value = vortexParams.colorR;
      vortexMaterial.uniforms.uColorG.value = vortexParams.colorG;
      vortexMaterial.uniforms.uColorB.value = vortexParams.colorB;
      vortexMaterial.uniforms.uArmCount.value = vortexParams.armCount;
      vortexMesh.position.set(vortexParams.posX, vortexParams.posY, vortexParams.posZ);
      vortexMesh.scale.set(vortexParams.size, vortexParams.size, 1);
    }
    
    renderer.render(scene, camera);
  };
  
  // 破棄
  const dispose = () => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  };
  
  return { scene, camera, renderer, animate, dispose, config };
}
