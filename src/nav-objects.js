// nav-objects.js — compatibility barrel for navigation object modules.

import { refreshOrbLanguage } from './nav/orb-objects.js';
import { refreshXLogoLanguage } from './nav/x-logo-objects.js';

// COMPAT: keep this file as the public import surface so existing paths remain stable.
// Protected imports:
// - ./main.js
// - ./navigation.js
// - ./main/bootstrap.js
// - ./main/dev-apply.js
// - ./main/render-loop.js
// (Phase B-1 / 2026-02-19)
// KEPT: ./nav/gem.js and ./nav/labels.js remain focused leaf modules; we did not split them further in this phase.

export * from './nav/orb-objects.js';
export * from './nav/x-logo-objects.js';

export function refreshNavLanguage() {
    refreshOrbLanguage();
    refreshXLogoLanguage();
}
