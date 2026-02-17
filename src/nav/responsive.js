const REF_VIEWPORT_HEIGHT = 844;
const MIN_VIEWPORT_SCALE = 0.8;
const MAX_VIEWPORT_SCALE = 1.25;

export function getViewportHeightScale({
    refHeight = REF_VIEWPORT_HEIGHT,
    minScale = MIN_VIEWPORT_SCALE,
    maxScale = MAX_VIEWPORT_SCALE,
} = {}) {
    if (typeof window === 'undefined') return 1;

    const viewportHeight = Math.max(1, window.innerHeight || refHeight);
    const rawScale = viewportHeight / refHeight;
    return Math.min(maxScale, Math.max(minScale, rawScale));
}

export function worldFromViewportHeight(baseWorldUnit, options) {
    return baseWorldUnit * getViewportHeightScale(options);
}
