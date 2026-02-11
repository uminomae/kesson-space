// dev-panel.js — 開発用パラメータ調整パネル

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
        title: 'タイミング',
        params: {
            mixCycle:      { label: '背景周期(s)',    min: 2.0, max: 30.0, step: 1.0, default: 2.0 },
            styleCycle:    { label: 'スタイル周期(s)', min: 4.0, max: 60.0, step: 2.0, default: 14.0 },
        }
    },
    {
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
        title: 'HTMLオーバーレイ',
        params: {
            titleBottom:   { label: '下からの距離(px)', min: 10, max: 300, step: 5, default: 60 },
            titleLeft:     { label: '左からの距離(px)', min: 10, max: 300, step: 5, default: 40 },
            titleSize:     { label: 'タイトル文字サイズ(rem)', min: 0.5, max: 5.0, step: 0.1, default: 2.7 },
            titleSpacing:  { label: '文字間隔(em)',   min: 0.0, max: 2.0, step: 0.05, default: 0.8 },
            titleOpacity:  { label: 'タイトル透明度', min: 0.0, max: 1.0, step: 0.05, default: 0.5 },
            subSize:       { label: 'サブ文字サイズ(rem)', min: 0.3, max: 3.0, step: 0.1, default: 1.3 },
            subOpacity:    { label: 'サブ透明度',     min: 0.0, max: 1.0, step: 0.05, default: 0.5 },
            titleGlow:     { label: '発光の強さ(px)', min: 0, max: 80, step: 5, default: 30 },
        }
    },
];

let _panel = null;
let _isOpen = false;
let _values = {};
let _onChange = null;

function createPanel() {
    // スライダー初期値
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
            -webkit-backdrop-filter: blur(8px);
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
        #dev-toggle.open {
            right: 280px;
        }

        #dev-panel {
            position: fixed;
            top: 0;
            right: -280px;
            width: 280px;
            height: 100%;
            z-index: 1000;
            background: rgba(10, 18, 30, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-left: 1px solid rgba(100, 150, 255, 0.1);
            overflow-y: auto;
            transition: right 0.35s cubic-bezier(0.22, 1, 0.36, 1);
            font-family: monospace;
            font-size: 0.72rem;
            color: rgba(200, 215, 240, 0.8);
        }
        #dev-panel.open {
            right: 0;
        }

        #dev-panel::-webkit-scrollbar { width: 3px; }
        #dev-panel::-webkit-scrollbar-thumb { background: rgba(100,150,255,0.15); border-radius: 2px; }

        .dev-header {
            padding: 14px 16px 8px;
            font-size: 0.8rem;
            color: rgba(150, 180, 255, 0.7);
            letter-spacing: 0.1em;
            border-bottom: 1px solid rgba(100, 150, 255, 0.08);
        }

        .dev-section-title {
            padding: 10px 16px 4px;
            font-size: 0.7rem;
            color: rgba(120, 160, 255, 0.5);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            border-top: 1px solid rgba(100, 150, 255, 0.06);
        }

        .dev-group {
            padding: 6px 16px 8px;
            border-bottom: 1px solid rgba(100, 150, 255, 0.03);
        }
        .dev-group label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3px;
            color: rgba(180, 200, 230, 0.6);
            font-size: 0.65rem;
        }
        .dev-group .dev-value {
            color: rgba(130, 200, 255, 0.9);
            min-width: 40px;
            text-align: right;
        }
        .dev-group input[type="range"] {
            width: 100%;
            height: 3px;
            -webkit-appearance: none;
            appearance: none;
            background: rgba(60, 90, 140, 0.3);
            border-radius: 2px;
            outline: none;
            cursor: pointer;
        }
        .dev-group input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: rgba(100, 160, 255, 0.7);
            border: 1px solid rgba(150, 200, 255, 0.3);
            cursor: pointer;
        }
        .dev-group input[type="range"]::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: rgba(100, 160, 255, 0.7);
            border: 1px solid rgba(150, 200, 255, 0.3);
            cursor: pointer;
        }

        /* --- トグル --- */
        .dev-toggle-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 16px;
            border-bottom: 1px solid rgba(100, 150, 255, 0.03);
        }
        .dev-toggle-label {
            color: rgba(180, 200, 230, 0.6);
            font-size: 0.65rem;
        }
        .dev-toggle-switch {
            display: inline-block;
            position: relative;
            width: 32px;
            height: 16px;
            cursor: pointer;
            flex-shrink: 0;
        }
        .dev-toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
            position: absolute;
        }
        .dev-toggle-track {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(60, 90, 140, 0.4);
            border-radius: 8px;
            transition: background 0.2s;
            border: 1px solid rgba(100, 150, 255, 0.15);
        }
        .dev-toggle-switch input:checked + .dev-toggle-track {
            background: rgba(80, 140, 255, 0.5);
            border-color: rgba(100, 160, 255, 0.3);
        }
        .dev-toggle-knob {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 12px;
            height: 12px;
            background: rgba(200, 220, 255, 0.9);
            border-radius: 50%;
            transition: transform 0.2s;
            pointer-events: none;
        }
        .dev-toggle-switch input:checked ~ .dev-toggle-knob {
            transform: translateX(16px);
        }

        .dev-export {
            padding: 10px 16px 16px;
        }
        .dev-export button {
            width: 100%;
            padding: 6px;
            background: rgba(60, 100, 180, 0.2);
            border: 1px solid rgba(100, 150, 255, 0.15);
            border-radius: 3px;
            color: rgba(180, 210, 255, 0.7);
            font-family: monospace;
            font-size: 0.7rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .dev-export button:hover {
            background: rgba(60, 100, 180, 0.35);
            color: rgba(200, 225, 255, 0.9);
        }
        .dev-export-result {
            margin-top: 8px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 3px;
            font-size: 0.58rem;
            color: rgba(150, 200, 255, 0.7);
            word-break: break-all;
            display: none;
            user-select: all;
            -webkit-user-select: all;
            max-height: 200px;
            overflow-y: auto;
        }
    `;
    document.head.appendChild(style);

    // トグルボタン
    const toggle = document.createElement('div');
    toggle.id = 'dev-toggle';
    toggle.textContent = 'DEV';
    toggle.addEventListener('click', () => {
        _isOpen = !_isOpen;
        toggle.classList.toggle('open', _isOpen);
        panel.classList.toggle('open', _isOpen);
    });
    document.body.appendChild(toggle);

    // パネル
    const panel = document.createElement('div');
    panel.id = 'dev-panel';

    let html = '<div class="dev-header">パラメータ調整</div>';

    // --- トグルセクション ---
    html += '<div class="dev-section-title">表示ON/OFF</div>';
    TOGGLES.forEach(t => {
        const checked = toggles[t.key] ? 'checked' : '';
        html += `
            <div class="dev-toggle-row">
                <span class="dev-toggle-label">${t.label}</span>
                <label class="dev-toggle-switch">
                    <input type="checkbox" id="toggle-${t.key}" ${checked}>
                    <span class="dev-toggle-track"></span>
                    <span class="dev-toggle-knob"></span>
                </label>
            </div>
        `;
    });

    // --- スライダーセクション ---
    SECTIONS.forEach(section => {
        html += `<div class="dev-section-title">${section.title}</div>`;
        Object.keys(section.params).forEach(key => {
            const p = section.params[key];
            html += `
                <div class="dev-group">
                    <label>
                        <span>${p.label}</span>
                        <span class="dev-value" id="val-${key}">${formatValue(p.default, p.step)}</span>
                    </label>
                    <input type="range" id="slider-${key}"
                        min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}">
                </div>
            `;
        });
    });

    html += `
        <div class="dev-export">
            <button id="dev-export-btn">値をコピー</button>
            <div class="dev-export-result" id="dev-export-result"></div>
        </div>
    `;

    panel.innerHTML = html;
    document.body.appendChild(panel);

    // --- トグルイベント ---
    TOGGLES.forEach(t => {
        const checkbox = document.getElementById(`toggle-${t.key}`);
        checkbox.addEventListener('change', () => {
            if (_onChange) _onChange(t.key, checkbox.checked);
        });
    });

    // --- スライダーイベント ---
    SECTIONS.forEach(section => {
        Object.keys(section.params).forEach(key => {
            const p = section.params[key];
            const slider = document.getElementById(`slider-${key}`);
            const valueEl = document.getElementById(`val-${key}`);
            slider.addEventListener('input', () => {
                const val = parseFloat(slider.value);
                _values[key] = val;
                valueEl.textContent = formatValue(val, p.step);
                if (_onChange) _onChange(key, val);
            });
        });
    });

    // --- エクスポート ---
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
            document.getElementById('dev-export-btn').textContent = 'コピーしました';
            setTimeout(() => {
                document.getElementById('dev-export-btn').textContent = '値をコピー';
            }, 2000);
        });
    });

    _panel = panel;
}

function formatValue(val, step) {
    const decimals = getDecimals(step);
    return Number(val).toFixed(decimals);
}

function getDecimals(step) {
    const str = step.toString();
    const dot = str.indexOf('.');
    return dot === -1 ? 0 : str.length - dot - 1;
}

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
