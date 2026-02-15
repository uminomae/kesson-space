// devlog-bg.js — devlog.html用Three.js背景（フルシーン版）

import * as THREE from 'three';
import { createScene, updateScene } from '../scene.js';
import { sceneParams, toggles } from '../config.js';

console.log('[devlog-bg] Script loaded');

// prefers-reduced-motion対応
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 背景コンテナ取得
const container = document.getElementById('bg-container');

if (container && !prefersReducedMotion) {
  console.log('[devlog-bg] container:', container);

  // devlogでもフルシーンを使用
  const { scene, camera, renderer } = createScene(container);
  renderer.setClearColor(0x000000, 0);

  // devlog用に視覚要素を有効化
  toggles.background = true;
  toggles.water = true;
  toggles.kessonLights = true;
  toggles.vortex = true;
  toggles.fog = true;

  // カメラY位置を下にずらす（深海の下層）
  camera.position.y = -50;
  camera.lookAt(0, -50, 0);
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
