// dev-panel.js — Bootstrapベースのdevパネル
// ★ default値は config.js を参照し、ハードコードしない
// CHANGED: Bootstrap CSS/JS を動的ロード（?dev時のみ読み込まれる）

import { toggles, breathConfig, DEV_TOGGLES, DEV_SECTIONS } from './config.js';
import { injectStyles } from './dom-utils.js';

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

function formatValue(val, step) {
    const str = step.toString();
    const dot = str.indexOf('.');
    const decimals = dot === -1 ? 0 : str.length - dot - 1;
    return Number(val).toFixed(decimals);
}

function createPanel() {
    DEV_SECTIONS.forEach(section => {
        Object.keys(section.params).forEach(key => {
            _values[key] = section.params[key].default;
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
            <button class="btn btn-outline-secondary btn-sm w-100 dev-export-btn" id="dev-export-btn">値をコピー</button>
            <pre class="mt-2 p-2 bg-black rounded text-info-emphasis" id="dev-export-result"></pre>
        </div>
    `;

    panel.innerHTML = html;
    document.body.appendChild(panel);

    bindToggleEvents();
    bindSliderEvents();
    bindExportEvent();
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
        return `
            <div class="dev-slider-row">
                <div class="dev-slider-header">
                    <span>${p.label}</span>
                    <span class="dev-slider-val" id="val-${key}">${formatValue(p.default, p.step)}</span>
                </div>
                <input type="range" class="form-range" id="slider-${key}"
                    min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}">
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

function bindExportEvent() {
    document.getElementById('dev-export-btn').addEventListener('click', () => {
        const result = document.getElementById('dev-export-result');
        const exportData = {
            toggles: { ...toggles },
            breathConfig: { ...breathConfig },
            sceneParams: { ..._values },
        };
        const text = JSON.stringify(exportData, null, 2);
        result.textContent = text;
        result.style.display = 'block';
        navigator.clipboard?.writeText(text).then(() => {
            const btn = document.getElementById('dev-export-btn');
            btn.textContent = 'コピーしました';
            setTimeout(() => { btn.textContent = '値をコピー'; }, 2000);
        });
    });
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
