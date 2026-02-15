// renderer.js — レンダラー生成ユーティリティ

import * as THREE from 'three';

export function createRenderer({ container, alpha = true, antialias = true, pixelRatio = null }) {
  const renderer = new THREE.WebGLRenderer({ antialias, alpha });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(pixelRatio || Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  return renderer;
}
