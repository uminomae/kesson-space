/**
 * grid.js — Instagram風 3×N グリッド配置
 *
 * 最新が左上、古いのが右下。
 * カメラはz軸方向を向き、yスクロールで移動。
 */

import * as THREE from 'three';

export function createGrid(count, opts = {}) {
    const columns = opts.columns || 3;
    const cardWidth = opts.cardWidth || opts.cardSize || 2.0;
    const cardHeight = opts.cardHeight || cardWidth * (9 / 16);  // 16:9 デフォルト
    const gap = opts.gap || 0.3;
    const stepX = cardWidth + gap;
    const stepY = cardHeight + gap;
    const totalWidth = columns * cardWidth + (columns - 1) * gap;
    const offsetX = -totalWidth / 2 + cardWidth / 2;
    const positions = [];
    for (let i = 0; i < count; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = offsetX + col * stepX;
        const y = -row * stepY;
        positions.push(new THREE.Vector3(x, y, 0));
    }
    return positions;
}

export function getGridHeight(count, opts = {}) {
    const columns = opts.columns || 3;
    const cardWidth = opts.cardWidth || opts.cardSize || 2.0;
    const cardHeight = opts.cardHeight || cardWidth * (9 / 16);
    const gap = opts.gap || 0.3;
    const rows = Math.ceil(count / columns);
    return rows * (cardHeight + gap);
}

export function updateGrid(cards, positions) {
    cards.forEach((card, i) => {
        if (positions[i]) {
            card.userData.gridPosition = positions[i].clone();
            card.position.copy(positions[i]);
        }
    });
}
