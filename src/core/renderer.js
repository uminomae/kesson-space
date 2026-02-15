// renderer.js — レンダラー生成ユーティリティ

import * as THREE from 'three';

export function createRenderer({ container, alpha = true, antialias = true, pixelRatio = null }) {
  const renderer = new THREE.WebGLRenderer({ antialias, alpha });
  if (alpha) {
    renderer.setClearColor(0x000000, 0);
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(pixelRatio || Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  console.log('[renderer] canvas appended to container', container);
  return renderer;
}
