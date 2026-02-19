const DEFAULTS = Object.freeze({
    strong: 0.10,
    soft: 0.10,
    border: 0.22,
    shadow: 0.26,
    blur: 14,
    saturate: 145,
});

function clampNumber(value, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.min(max, Math.max(min, parsed));
}

function readVars(style) {
    const strong = Number.parseFloat(style.getPropertyValue('--kesson-topbar-alpha-strong')) || DEFAULTS.strong;
    const soft = Number.parseFloat(style.getPropertyValue('--kesson-topbar-alpha-soft')) || DEFAULTS.soft;
    const border = Number.parseFloat(style.getPropertyValue('--kesson-topbar-border-alpha')) || DEFAULTS.border;
    const shadow = Number.parseFloat(style.getPropertyValue('--kesson-topbar-shadow-alpha')) || DEFAULTS.shadow;
    const blur = Number.parseFloat(style.getPropertyValue('--kesson-topbar-blur')) || DEFAULTS.blur;
    const saturate = Number.parseFloat(style.getPropertyValue('--kesson-topbar-saturate')) || DEFAULTS.saturate;

    return { strong, soft, border, shadow, blur, saturate };
}

function applyVars(next) {
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--kesson-topbar-alpha-strong', String(next.strong));
    rootStyle.setProperty('--kesson-topbar-alpha-soft', String(next.soft));
    rootStyle.setProperty('--kesson-topbar-border-alpha', String(next.border));
    rootStyle.setProperty('--kesson-topbar-shadow-alpha', String(next.shadow));
    rootStyle.setProperty('--kesson-topbar-blur', `${next.blur}px`);
    rootStyle.setProperty('--kesson-topbar-saturate', `${next.saturate}%`);
}

export function initTopbarConsole() {
    if (typeof window === 'undefined') return;
    const style = getComputedStyle(document.documentElement);

    const api = {
        get() {
            return readVars(style);
        },
        set(config = {}) {
            const current = readVars(style);
            const strong = config.strong == null ? current.strong : clampNumber(config.strong, 0, 1);
            const soft = config.soft == null ? current.soft : clampNumber(config.soft, 0, 1);
            const border = config.border == null ? current.border : clampNumber(config.border, 0, 1);
            const shadow = config.shadow == null ? current.shadow : clampNumber(config.shadow, 0, 1);
            const blur = config.blur == null ? current.blur : clampNumber(config.blur, 0, 40);
            const saturate = config.saturate == null ? current.saturate : clampNumber(config.saturate, 0, 300);

            applyVars({
                strong: strong ?? current.strong,
                soft: soft ?? current.soft,
                border: border ?? current.border,
                shadow: shadow ?? current.shadow,
                blur: blur ?? current.blur,
                saturate: saturate ?? current.saturate,
            });
            return this.get();
        },
        setOpacity(alpha) {
            const normalized = clampNumber(alpha, 0, 1);
            if (normalized == null) return this.get();

            const soft = clampNumber(normalized * 0.64, 0, 1);
            return this.set({ strong: normalized, soft });
        },
        reset() {
            applyVars(DEFAULTS);
            return this.get();
        },
        help() {
            return [
                'kessonTopbar.setOpacity(0.55)',
                'kessonTopbar.set({ strong: 0.55, soft: 0.32, border: 0.16, shadow: 0.2, blur: 16, saturate: 150 })',
                'kessonTopbar.get()',
                'kessonTopbar.reset()',
            ];
        },
    };

    window.kessonTopbar = api;
}
