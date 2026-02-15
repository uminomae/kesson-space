// devlog-bg.js — devlog.html用Three.js背景

import { createBackground } from '../core/background.js';

// prefers-reduced-motion対応
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// モバイル検出
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// プリセット決定
let preset = 'lite';
if (prefersReducedMotion) {
  preset = 'static';
} else if (isMobile) {
  // モバイルでもliteを使用（FPS制限あり）
  preset = 'lite';
}

// 背景コンテナ取得
const container = document.getElementById('bg-container');

if (container) {
  const { animate, dispose } = createBackground({
    container,
    preset,
    options: {
      backgroundOpacity: 0.25,
    }
  });
  
  // アニメーション開始
  animate();
  
  // ページ離脱時にクリーンアップ
  window.addEventListener('beforeunload', dispose);
  
  // Visibility API対応（タブ非表示時に停止）
  let isAnimating = true;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isAnimating) {
      // 停止処理（将来的に実装）
    } else if (!document.hidden && !isAnimating) {
      // 再開処理（将来的に実装）
    }
  });
}
