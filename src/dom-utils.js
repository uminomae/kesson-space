// dom-utils.js — DOM共通ユーティリティ

export function injectStyles(id, css) {
    if (!id || typeof id !== 'string') {
        throw new Error('injectStyles: id must be a non-empty string');
    }

    const existing = document.getElementById(id);
    if (existing) return existing;

    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    return style;
}
