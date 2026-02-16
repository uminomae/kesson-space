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

    injectStyles('dev-panel-styles', `
        #dev-toggle {
            position: fixed;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            z-index: 1001;
            background: rgba(20, 30, 50, 0.7);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(100, 150, 255, 0.15);
            border-right: none;
            border-radius: 4px 0 0 4px;
            color: rgba(180, 200, 255, 0.6);
            font-size: 0.65rem;
            font-family: monospace;
            padding: 8px 5px;
            cursor: pointer;
            writing-mode: vertical-rl;
            letter-spacing: 0.15em;
            transition: all 0.3s ease;
        }
        #dev-toggle:hover {
            color: rgba(200, 220, 255, 0.9);
            background: rgba(30, 45, 70, 0.8);
        }
        #dev-toggle.open { right: 300px; }

        #dev-panel {
            position: fixed;
            top: 0;
            right: -300px;
            width: 300px;
            height: 100%;
            z-index: 1000;
            overflow-y: auto;
            transition: right 0.35s cubic-bezier(0.22, 1, 0.36, 1);
            background: rgba(13, 17, 23, 0.95);
            backdrop-filter: blur(12px);
            border-left: 1px solid rgba(100, 150, 255, 0.1);
        }
        #dev-panel.open { right: 0; }
        #dev-panel::-webkit-scrollbar { width: 4px; }
        #dev-panel::-webkit-scrollbar-thumb { background: rgba(100,150,255,0.2); border-radius: 2px; }

        #dev-panel .accordion-button {
            padding: 0.5rem 0.75rem;
            font-size: 0.72rem;
            font-family: monospace;
            letter-spacing: 0.05em;
            background: rgba(20, 28, 40, 0.9);
            color: rgba(140, 170, 220, 0.8);
            border: none;
            box-shadow: none;
        }
        #dev-panel .accordion-button:not(.collapsed) {
            background: rgba(30, 45, 70, 0.7);
            color: rgba(160, 190, 255, 0.9);
        }
        #dev-panel .accordion-button::after {
            filter: invert(0.6) sepia(1) saturate(2) hue-rotate(190deg);
        }
        #dev-panel .accordion-body {
            padding: 0.5rem 0.75rem;
            background: rgba(10, 15, 25, 0.8);
        }
        #dev-panel .accordion-item {
            background: transparent;
            border: none;
            border-bottom: 1px solid rgba(100, 150, 255, 0.06);
        }

        #dev-panel .form-check {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.25rem 0;
            margin: 0;
        }
        #dev-panel .form-check-label {
            font-size: 0.68rem;
            font-family: monospace;
            color: rgba(180, 200, 230, 0.7);
            order: -1;
            padding-left: 0;
        }
        #dev-panel .form-check-input {
            margin: 0;
            cursor: pointer;
        }

        .dev-slider-row { margin-bottom: 0.4rem; }
        .dev-slider-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.65rem;
            font-family: monospace;
            color: rgba(180, 200, 230, 0.6);
            margin-bottom: 0.15rem;
        }
        .dev-slider-val {
            color: rgba(130, 200, 255, 0.9);
            min-width: 36px;
            text-align: right;
        }
        #dev-panel .form-range { height: 0.5rem; padding: 0; }
        #dev-panel .form-range::-webkit-slider-thumb {
            width: 12px; height: 12px;
            background: rgba(100, 160, 255, 0.8);
            border: 1px solid rgba(150, 200, 255, 0.3);
        }

        #dev-export-result {
            font-size: 0.58rem;
            max-height: 180px;
            overflow-y: auto;
            display: none;
            user-select: all;
        }
    `);

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

    let html = '<div class="px-3 py-2 border-bottom border-secondary-subtle"><small class="text-secondary-emphasis" style="font-family:monospace;letter-spacing:0.1em">パラメータ調整</small></div>';
    html += '<div class="accordion accordion-flush" id="devAccordion">';

    html += accordionItem('toggles', '表示 ON/OFF', buildTogglesHTML(), true);
    DEV_SECTIONS.forEach(section => {
        html += accordionItem(section.id, section.title, buildSlidersHTML(section));
    });

    html += '</div>';
    html += `
        <div class="p-2 border-top border-secondary-subtle">
            <button class="btn btn-outline-secondary btn-sm w-100" id="dev-export-btn" style="font-size:0.68rem">値をコピー</button>
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
