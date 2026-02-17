const REF_VIEWPORT_HEIGHT = 844;
const MIN_VIEWPORT_SCALE = 0.8;
const MAX_VIEWPORT_SCALE = 1.25;
const INTERACTION_SMALL_GAIN = 0.6;
const INTERACTION_LARGE_GAIN = 0.5;

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

export function getInteractionScaleFromViewportHeight(options) {
    const viewportScale = getViewportHeightScale(options);
    if (viewportScale < 1) {
        return 1 + (1 - viewportScale) * INTERACTION_SMALL_GAIN;
    }
    return 1 + (viewportScale - 1) * INTERACTION_LARGE_GAIN;
}

export function interactionWorldFromViewportHeight(baseWorldUnit, options) {
    return baseWorldUnit * getInteractionScaleFromViewportHeight(options);
}
