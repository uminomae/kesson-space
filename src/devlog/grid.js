/**
 * grid.js — Instagram風 3×N グリッド配置
 *
 * 最新が左上、古いのが右下。
 * カメラはz軸方向を向き、yスクロールで移動。
 */

import * as THREE from 'three';

export function createGrid(count, opts = {}) {
    const columns = opts.columns || 3;
    const cardSize = opts.cardSize || 2.0;
    const gap = opts.gap || 0.3;
    const step = cardSize + gap;
    const totalWidth = columns * cardSize + (columns - 1) * gap;
    const offsetX = -totalWidth / 2 + cardSize / 2;
    const positions = [];
    for (let i = 0; i < count; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = offsetX + col * step;
        const y = -row * step;
        positions.push(new THREE.Vector3(x, y, 0));
    }
    return positions;
}

export function getGridHeight(count, opts = {}) {
    const columns = opts.columns || 3;
    const cardSize = opts.cardSize || 2.0;
    const gap = opts.gap || 0.3;
    const rows = Math.ceil(count / columns);
    return rows * (cardSize + gap);
}

export function updateGrid(cards, positions) {
    cards.forEach((card, i) => {
        if (positions[i]) {
            card.userData.gridPosition = positions[i].clone();
            card.position.copy(positions[i]);
        }
    });
}
