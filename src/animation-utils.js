// animation-utils.js — アニメーション共通ユーティリティ

export const DEFAULT_BREATH_PHASE = -Math.PI / 2;

export function breathValue(time, period, phase = DEFAULT_BREATH_PHASE) {
    if (!period) return 0;
    return (Math.sin(time * Math.PI / period + phase) + 1) * 0.5;
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}
