// font-size-ctrl.js
// CHANGED(2026-03-07): #114 — フォントサイズステップ制御 (-1〜+4, 1step = +0.1rem)

const STEP_REM = 0.1;
const MIN_STEP = -1;
const MAX_STEP = 4;
const STORAGE_KEY = 'kesson-font-step';

// 変更対象の CSS 変数と基底値のマップ
const FONT_VARS = {
  '--kesson-font-size-ui-xs': 0.65,
  '--kesson-font-size-ui-sm': 0.70,
};

// 直接指定クラスの基底値 (rem)
const CLASS_VARS = {
  '--ks-section-heading':    0.75,
  '--ks-card-title':         0.80,
  '--ks-card-text':          0.70,
  '--ks-card-summary':       0.68,
  // navi 以外の追加対象
  '--ks-overlay-tagline':    0.55,
  '--ks-overlay-tagline-en': 0.48,
  '--ks-control-guide':      0.45,
  '--ks-footer-line':        0.45,
};

export function initFontSizeCtrl() {
  const step = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
  applyStep(step);

  document.getElementById('font-size-down')?.addEventListener('click', () => {
    const cur = getCurrentStep();
    if (cur > MIN_STEP) setStep(cur - 1);
  });
  document.getElementById('font-size-up')?.addEventListener('click', () => {
    const cur = getCurrentStep();
    if (cur < MAX_STEP) setStep(cur + 1);
  });
  document.getElementById('font-size-reset')?.addEventListener('click', () => {
    setStep(0);
  });
}

function getCurrentStep() {
  return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
}

function setStep(step) {
  localStorage.setItem(STORAGE_KEY, String(step));
  applyStep(step);
}

function applyStep(step) {
  const root = document.documentElement;

  for (const [varName, base] of Object.entries(FONT_VARS)) {
    root.style.setProperty(varName, `${(base + step * STEP_REM).toFixed(2)}rem`);
  }
  for (const [varName, base] of Object.entries(CLASS_VARS)) {
    root.style.setProperty(varName, `${(base + step * STEP_REM).toFixed(2)}rem`);
  }

  const down  = document.getElementById('font-size-down');
  const up    = document.getElementById('font-size-up');
  const reset = document.getElementById('font-size-reset');
  if (down)  down.disabled  = step <= MIN_STEP;
  if (up)    up.disabled    = step >= MAX_STEP;
  if (reset) reset.disabled = step === 0;
}
