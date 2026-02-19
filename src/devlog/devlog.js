// COMPAT: keep this file as the public entrypoint for devlog modules.
// Protected imports:
// - ../main.js (dynamic import for refreshDevlogLanguage)
// Existing side effect contract is preserved by re-exporting runtime.js, which still auto-initializes on import.
// (Phase B-2 / 2026-02-19)
// KEPT: devlog.html does not import this module directly, so no import-path migration is required in this phase.

export {
    __DEVLOG_TEST_API__,
    destroyDevlogGallery,
    initDevlogGallery,
    refreshDevlogLanguage,
} from './runtime.js';
