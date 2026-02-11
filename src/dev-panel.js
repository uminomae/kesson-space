// dev-panel.js — 開発用パラメータ調整パネル
// DEV_MODE=true のときサイドからスライドインするパネルを表示

const PARAMS = {
    brightness:    { label: '光の強さ',      min: 0.0, max: 2.0, step: 0.05, default: 0.5 },
    glowCore:      { label: 'コア強度',      min: 0.01, max: 0.5, step: 0.01, default: 0.12 },
    glowSpread:    { label: '広がり',        min: 0.005, max: 0.1, step: 0.005, default: 0.02 },
    breathAmp:     { label: '呼吸の深さ',    min: 0.0, max: 0.5, step: 0.05, default: 0.15 },
    warpAmount:    { label: '揺らぎ量',      min: 0.0, max: 1.5, step: 0.05, default: 0.6 },
    mixCycle:      { label: '背景周期(s)',    min: 2.0, max: 30.0, step: 1.0, default: 7.0 },
    styleCycle:    { label: 'スタイル周期(s)', min: 4.0, max: 60.0, step: 2.0, default: 14.0 },
    fogDensity:    { label: 'フォグ濃度',    min: 0.0, max: 0.06, step: 0.002, default: 0.02 },
    autoRotateSpd: { label: '自動回転速度',   min: 0.0, max: 1.0, step: 0.05, default: 0.15 },
};

let _panel = null;
let _isOpen = false;
let _values = {};
let _onChange = null;

function createPanel() {
    // 初期値セット
    Object.keys(PARAMS).forEach(key => {
        _values[key] = PARAMS[key].default;
    });

    // スタイル
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

        .dev-group {
            padding: 10px 16px;
            border-bottom: 1px solid rgba(100, 150, 255, 0.05);
        }
        .dev-group label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
            color: rgba(180, 200, 230, 0.6);
            font-size: 0.68rem;
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

        .dev-export {
            padding: 12px 16px;
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
            font-size: 0.62rem;
            color: rgba(150, 200, 255, 0.7);
            word-break: break-all;
            display: none;
            user-select: all;
            -webkit-user-select: all;
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

    // パネル本体
    const panel = document.createElement('div');
    panel.id = 'dev-panel';

    let html = '<div class="dev-header">パラメータ調整</div>';

    Object.keys(PARAMS).forEach(key => {
        const p = PARAMS[key];
        html += `
            <div class="dev-group">
                <label>
                    <span>${p.label}</span>
                    <span class="dev-value" id="val-${key}">${p.default}</span>
                </label>
                <input type="range" id="slider-${key}"
                    min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}">
            </div>
        `;
    });

    html += `
        <div class="dev-export">
            <button id="dev-export-btn">値をコピー</button>
            <div class="dev-export-result" id="dev-export-result"></div>
        </div>
    `;

    panel.innerHTML = html;
    document.body.appendChild(panel);

    // イベント
    Object.keys(PARAMS).forEach(key => {
        const slider = document.getElementById(`slider-${key}`);
        const valueEl = document.getElementById(`val-${key}`);
        slider.addEventListener('input', () => {
            const val = parseFloat(slider.value);
            _values[key] = val;
            valueEl.textContent = val.toFixed(getDecimals(PARAMS[key].step));
            if (_onChange) _onChange(key, val);
        });
    });

    // エクスポート
    document.getElementById('dev-export-btn').addEventListener('click', () => {
        const result = document.getElementById('dev-export-result');
        const text = JSON.stringify(_values, null, 2);
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

function getDecimals(step) {
    const str = step.toString();
    const dot = str.indexOf('.');
    return dot === -1 ? 0 : str.length - dot - 1;
}

// --- 公開API ---

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
