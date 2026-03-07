// dev-panel.js — Bootstrapベースのdevパネル
// ★ default値は config.js を参照し、ハードコードしない
// CHANGED: Bootstrap CSS/JS を動的ロード（?dev時のみ読み込まれる）

import { toggles, breathConfig, DEV_TOGGLES, DEV_SECTIONS } from './config.js';
import { buildFontDefaultsCss, FONT_STEP_CHANGE_EVENT, getCurrentStep } from './font-size-ctrl.js';

const BOOTSTRAP_CSS_URL = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
const BOOTSTRAP_JS_URL = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js';

function findBootstrapCssLink() {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
        .find((el) => el.href.includes('/bootstrap@5.3.3/dist/css/bootstrap.min.css'));
}

function findBootstrapJsScript() {
    return Array.from(document.querySelectorAll('script[src]'))
        .find((el) => el.src.includes('/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'));
}

function ensureBootstrapCss() {
    if (findBootstrapCssLink()) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = BOOTSTRAP_CSS_URL;
    document.head.appendChild(link);
}

function ensureBootstrapJs() {
    if (window.bootstrap) return Promise.resolve();
    const existingScript = findBootstrapJsScript();
    if (existingScript) {
        return new Promise((resolve, reject) => {
            existingScript.addEventListener('load', resolve, { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Bootstrap JS load failed')), { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = BOOTSTRAP_JS_URL;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Bootstrap JS load failed'));
        document.body.appendChild(script);
    });
}

// --- CHANGED: Bootstrap動的ローダー（既存読込があれば再注入しない） ---
function loadBootstrap() {
    ensureBootstrapCss();
    return ensureBootstrapJs();
}



let _isOpen = false;
let _values = {};
let _onChange = null;
let _fontStepListenerBound = false;

function formatValue(val, step) {
    const str = step.toString();
    const dot = str.indexOf('.');
    const decimals = dot === -1 ? 0 : str.length - dot - 1;
    return Number(val).toFixed(decimals);
}

function getParamConfig(key) {
    for (const section of DEV_SECTIONS) {
        if (Object.prototype.hasOwnProperty.call(section.params, key)) {
            return section.params[key];
        }
    }
    return null;
}

function syncSliderUI(key, value) {
    _values[key] = value;

    const slider = document.getElementById(`slider-${key}`);
    const valEl = document.getElementById(`val-${key}`);
    const param = getParamConfig(key);

    if (slider) slider.value = String(value);
    if (valEl && param) valEl.textContent = formatValue(value, param.step);
}

function copyTextWithFeedback({ buttonId, text, successText }) {
    const result = document.getElementById('dev-export-result');
    const button = document.getElementById(buttonId);
    if (result) {
        result.textContent = text;
        result.style.display = 'block';
    }

    const reset = () => {
        if (button) button.textContent = successText.initial;
    };

    if (button) button.textContent = successText.pending;

    const clipboard = navigator.clipboard?.writeText?.(text);
    if (clipboard && typeof clipboard.then === 'function') {
        clipboard.then(() => {
            if (button) button.textContent = successText.done;
            setTimeout(reset, 2000);
        }).catch(() => {
            console.log(text);
            if (button) button.textContent = successText.fallback;
            setTimeout(reset, 2000);
        });
        return;
    }

    console.log(text);
    if (button) button.textContent = successText.fallback;
    setTimeout(reset, 2000);
}

function createPanel() {
    DEV_SECTIONS.forEach(section => {
        Object.keys(section.params).forEach(key => {
            _values[key] = key === 'fontStep'
                ? getCurrentStep()
                : section.params[key].default;
        });
    });

    // CHANGED(2026-02-16): T-018 — CSS moved to src/styles/main.css

    const tab = document.createElement('div');
    tab.id = 'dev-toggle';
    tab.textContent = 'DEV';
    tab.addEventListener('click', () => {
        _isOpen = !_isOpen;
        tab.classList.toggle('open', _isOpen);
        panel.classList.toggle('open', _isOpen);
    });
    document.body.appendChild(tab);

    const panel = document.createElement('div');
    panel.id = 'dev-panel';
    panel.setAttribute('data-bs-theme', 'dark');

    // CHANGED(2026-02-16): T-018 — inline style → CSS class
    let html = '<div class="px-3 py-2 border-bottom border-secondary-subtle"><small class="text-secondary-emphasis dev-panel-header-text">パラメータ調整</small></div>';
    html += '<div class="accordion accordion-flush" id="devAccordion">';

    html += accordionItem('toggles', '表示 ON/OFF', buildTogglesHTML(), true);
    DEV_SECTIONS.forEach(section => {
        html += accordionItem(section.id, section.title, buildSlidersHTML(section));
    });

    html += '</div>';
    html += `
        <div class="p-2 border-top border-secondary-subtle">
            <button class="btn btn-outline-info btn-sm w-100 mb-2 dev-export-btn" id="dev-copy-defaults-btn">Copy defaults</button>
            <button class="btn btn-outline-secondary btn-sm w-100 dev-export-btn" id="dev-export-btn">状態をコピー</button>
            <pre class="mt-2 p-2 bg-black rounded text-info-emphasis" id="dev-export-result"></pre>
        </div>
    `;

    panel.innerHTML = html;
    document.body.appendChild(panel);

    bindToggleEvents();
    bindSliderEvents();
    bindCopyDefaultsEvent();
    bindExportEvent();
    bindFontStepSync();
}

function accordionItem(id, title, bodyHTML, show = false) {
    return `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button ${show ? '' : 'collapsed'}" type="button"
                    data-bs-toggle="collapse" data-bs-target="#collapse-${id}">
                    ${title}
                </button>
            </h2>
            <div id="collapse-${id}" class="accordion-collapse collapse ${show ? 'show' : ''}" data-bs-parent="#devAccordion">
                <div class="accordion-body">${bodyHTML}</div>
            </div>
        </div>
    `;
}

function buildTogglesHTML() {
    return DEV_TOGGLES.map(t => {
        const checked = toggles[t.key] ? 'checked' : '';
        return `
            <div class="form-check form-switch">
                <label class="form-check-label" for="toggle-${t.key}">${t.label}</label>
                <input class="form-check-input" type="checkbox" role="switch" id="toggle-${t.key}" ${checked}>
            </div>
        `;
    }).join('');
}

function buildSlidersHTML(section) {
    return Object.keys(section.params).map(key => {
        const p = section.params[key];
        const currentValue = _values[key];
        return `
            <div class="dev-slider-row">
                <div class="dev-slider-header">
                    <span>${p.label}</span>
                    <span class="dev-slider-val" id="val-${key}">${formatValue(currentValue, p.step)}</span>
                </div>
                <input type="range" class="form-range" id="slider-${key}"
                    min="${p.min}" max="${p.max}" step="${p.step}" value="${currentValue}">
            </div>
        `;
    }).join('');
}

function bindToggleEvents() {
    DEV_TOGGLES.forEach(t => {
        document.getElementById(`toggle-${t.key}`).addEventListener('change', (e) => {
            if (_onChange) _onChange(t.key, e.target.checked);
        });
    });
}

function bindSliderEvents() {
    DEV_SECTIONS.forEach(section => {
        Object.keys(section.params).forEach(key => {
            const p = section.params[key];
            const slider = document.getElementById(`slider-${key}`);
            const valEl = document.getElementById(`val-${key}`);
            slider.addEventListener('input', () => {
                const val = parseFloat(slider.value);
                _values[key] = val;
                valEl.textContent = formatValue(val, p.step);
                if (_onChange) _onChange(key, val);
            });
        });
    });
}

function bindCopyDefaultsEvent() {
    document.getElementById('dev-copy-defaults-btn').addEventListener('click', () => {
        copyTextWithFeedback({
            buttonId: 'dev-copy-defaults-btn',
            text: buildFontDefaultsCss(),
            successText: {
                initial: 'Copy defaults',
                pending: 'Copying...',
                done: 'Copied',
                fallback: 'Console output',
            },
        });
    });
}

function bindExportEvent() {
    document.getElementById('dev-export-btn').addEventListener('click', () => {
        const exportData = {
            toggles: { ...toggles },
            breathConfig: { ...breathConfig },
            values: { ..._values },
        };
        copyTextWithFeedback({
            buttonId: 'dev-export-btn',
            text: JSON.stringify(exportData, null, 2),
            successText: {
                initial: '状態をコピー',
                pending: 'Copying...',
                done: 'コピーしました',
                fallback: 'Console output',
            },
        });
    });
}

function bindFontStepSync() {
    if (_fontStepListenerBound || typeof window === 'undefined') return;

    window.addEventListener(FONT_STEP_CHANGE_EVENT, (event) => {
        const nextStep = event.detail?.step;
        if (typeof nextStep !== 'number') return;
        syncSliderUI('fontStep', nextStep);
    });

    _fontStepListenerBound = true;
}

// CHANGED: Bootstrap読み込み完了を待ってからパネル生成
export async function initDevPanel(onChange) {
    _onChange = onChange;
    try {
        await loadBootstrap();
    } catch (err) {
        console.warn('[dev-panel] Bootstrap load failed:', err.message);
    }
    createPanel();
    return { ..._values };
}

export function getDevValues() {
    return { ..._values };
}

export function getDevParam(key) {
    return _values[key];
}
