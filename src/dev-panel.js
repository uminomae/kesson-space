// dev-panel.js — Bootstrapベースのdevパネル

import { toggles, breathConfig } from './config.js';

// --- トグル定義 ---
const TOGGLES = [
    { key: 'background',    label: '背景' },
    { key: 'kessonLights',  label: '欠損ライト' },
    { key: 'water',         label: '水面' },
    { key: 'navOrbs',       label: 'ナビオーブ' },
    { key: 'fog',           label: 'フォグ' },
    { key: 'fovBreath',     label: 'FOV呼吸（熱波）' },
    { key: 'htmlBreath',    label: 'HTML呼吸' },
    { key: 'autoRotate',    label: '自動回転' },
];

// --- スライダー定義 ---
const SECTIONS = [
    {
        id: 'breath',
        title: '呼吸（同期）',
        params: {
            period:          { label: '周期(s)',       min: 2.0, max: 30.0, step: 0.5, default: 8.0, target: 'breath' },
            htmlMinOpacity:  { label: 'HTML最小透明度', min: 0.0, max: 0.5, step: 0.05, default: 0.1, target: 'breath' },
            htmlMaxOpacity:  { label: 'HTML最大透明度', min: 0.3, max: 1.0, step: 0.05, default: 0.8, target: 'breath' },
            htmlMaxBlur:     { label: 'HTMLぼかし(px)', min: 0.0, max: 8.0, step: 0.5, default: 3.0, target: 'breath' },
            htmlMinScale:    { label: 'HTML最小スケール', min: 0.8, max: 1.0, step: 0.01, default: 0.95, target: 'breath' },
            fovAmplitude:    { label: 'FOV振幅(deg)',   min: 0.0, max: 5.0, step: 0.1, default: 1.0, target: 'breath' },
        }
    },
    {
        id: 'shader',
        title: '光シェーダー',
        params: {
            brightness:    { label: '光の強さ',      min: 0.0, max: 2.0, step: 0.05, default: 1.0 },
            glowCore:      { label: 'コア強度',      min: 0.01, max: 0.5, step: 0.01, default: 0.07 },
            glowSpread:    { label: '広がり',        min: 0.005, max: 0.1, step: 0.005, default: 0.08 },
            breathAmp:     { label: '呼吸の深さ',    min: 0.0, max: 0.5, step: 0.05, default: 0.15 },
            warpAmount:    { label: '揺らぎ量',      min: 0.0, max: 1.5, step: 0.05, default: 1.0 },
        }
    },
    {
        id: 'timing',
        title: 'タイミング',
        params: {
            mixCycle:      { label: '背景周期(s)',    min: 2.0, max: 30.0, step: 1.0, default: 2.0 },
            styleCycle:    { label: 'スタイル周期(s)', min: 4.0, max: 60.0, step: 2.0, default: 14.0 },
        }
    },
    {
        id: 'camera',
        title: 'カメラ・環境',
        params: {
            camX:          { label: 'カメラ X',      min: -50, max: 50, step: 1, default: -14 },
            camY:          { label: 'カメラ Y',      min: -20, max: 80, step: 1, default: 0 },
            camZ:          { label: 'カメラ Z',      min: -20, max: 60, step: 1, default: 34 },
            camTargetY:    { label: '注視点 Y',      min: -30, max: 10, step: 1, default: -1 },
            fogDensity:    { label: 'フォグ濃度',    min: 0.0, max: 0.06, step: 0.002, default: 0.0 },
            autoRotateSpd: { label: '自動回転速度',   min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
        }
    },
    {
        id: 'overlay',
        title: 'HTMLオーバーレイ',
        params: {
            titleBottom:   { label: '下からの距離(px)', min: 10, max: 300, step: 5, default: 60 },
            titleLeft:     { label: '左からの距離(px)', min: 10, max: 300, step: 5, default: 40 },
            titleSize:     { label: 'タイトル文字(rem)', min: 0.5, max: 5.0, step: 0.1, default: 2.7 },
            titleSpacing:  { label: '文字間隔(em)',   min: 0.0, max: 2.0, step: 0.05, default: 0.8 },
            titleOpacity:  { label: 'タイトル透明度', min: 0.0, max: 1.0, step: 0.05, default: 0.5 },
            subSize:       { label: 'サブ文字(rem)',   min: 0.3, max: 3.0, step: 0.1, default: 1.3 },
            subOpacity:    { label: 'サブ透明度',     min: 0.0, max: 1.0, step: 0.05, default: 0.5 },
            titleGlow:     { label: '発光(px)',       min: 0, max: 80, step: 5, default: 30 },
        }
    },
];

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
    SECTIONS.forEach(section => {
        Object.keys(section.params).forEach(key => {
            _values[key] = section.params[key].default;
        });
    });

    const style = document.createElement('style');
    style.textContent = `
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

        /* --- Bootstrapカスタマイズ --- */
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

        /* --- トグルスイッチ --- */
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

        /* --- スライダー --- */
        .dev-slider-row {
            margin-bottom: 0.4rem;
        }
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
        #dev-panel .form-range {
            height: 0.5rem;
            padding: 0;
        }
        #dev-panel .form-range::-webkit-slider-thumb {
            width: 12px;
            height: 12px;
            background: rgba(100, 160, 255, 0.8);
            border: 1px solid rgba(150, 200, 255, 0.3);
        }

        /* --- エクスポート --- */
        #dev-export-result {
            font-size: 0.58rem;
            max-height: 180px;
            overflow-y: auto;
            display: none;
            user-select: all;
        }
    `;
    document.head.appendChild(style);

    // --- DEVタブ ---
    const tab = document.createElement('div');
    tab.id = 'dev-toggle';
    tab.textContent = 'DEV';
    tab.addEventListener('click', () => {
        _isOpen = !_isOpen;
        tab.classList.toggle('open', _isOpen);
        panel.classList.toggle('open', _isOpen);
    });
    document.body.appendChild(tab);

    // --- パネル ---
    const panel = document.createElement('div');
    panel.id = 'dev-panel';
    panel.setAttribute('data-bs-theme', 'dark');

    let html = '';

    // ヘッダー
    html += '<div class="px-3 py-2 border-bottom border-secondary-subtle"><small class="text-secondary-emphasis" style="font-family:monospace;letter-spacing:0.1em">パラメータ調整</small></div>';

    // アコーディオン
    html += '<div class="accordion accordion-flush" id="devAccordion">';

    // --- 表示ON/OFF ---
    html += accordionItem('toggles', '表示 ON/OFF', buildTogglesHTML(), true);

    // --- スライダーセクション ---
    SECTIONS.forEach((section, i) => {
        html += accordionItem(section.id, section.title, buildSlidersHTML(section));
    });

    html += '</div>'; // accordion

    // --- エクスポート ---
    html += `
        <div class="p-2 border-top border-secondary-subtle">
            <button class="btn btn-outline-secondary btn-sm w-100" id="dev-export-btn" style="font-size:0.68rem">値をコピー</button>
            <pre class="mt-2 p-2 bg-black rounded text-info-emphasis" id="dev-export-result"></pre>
        </div>
    `;

    panel.innerHTML = html;
    document.body.appendChild(panel);

    // --- イベント ---
    bindToggleEvents();
    bindSliderEvents();
    bindExportEvent();
}

// --- HTMLビルダー ---

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
    return TOGGLES.map(t => {
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

// --- イベントバインド ---

function bindToggleEvents() {
    TOGGLES.forEach(t => {
        document.getElementById(`toggle-${t.key}`).addEventListener('change', (e) => {
            if (_onChange) _onChange(t.key, e.target.checked);
        });
    });
}

function bindSliderEvents() {
    SECTIONS.forEach(section => {
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

// --- 公開 ---

export function initDevPanel(onChange) {
    _onChange = onChange;
    createPanel();
    return { ..._values };
}

export function getDevValues() {
    return { ..._values };
}

export function getDevParam(key) {
    return _values[key];
}
