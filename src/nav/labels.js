import { getRawMouse } from '../mouse-state.js';

export function createNavLabelButton({
    text,
    extraClass,
    url,
    isExternal,
    navType,
    navIndex,
    onGemHover,
    onXLogoHover,
}) {
    const btn = document.createElement('button');
    btn.className = 'nav-label' + (extraClass ? ' ' + extraClass : '');
    btn.textContent = text;
    btn.tabIndex = 0;
    btn.setAttribute('role', 'button');
    btn.dataset.navType = navType;
    if (typeof navIndex === 'number') {
        btn.dataset.navIndex = String(navIndex);
    }
    btn.setAttribute('aria-hidden', 'false');

    const lang = document.documentElement.lang || 'ja';
    if (isExternal) {
        btn.setAttribute('aria-label',
            lang === 'en' ? `Open ${text} (external link)` : `${text}を開く（外部リンク）`);
    } else {
        btn.setAttribute('aria-label',
            lang === 'en' ? `Open ${text} PDF` : `${text}のPDFを開く`);
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isExternal) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            import('../viewer.js').then(({ openPdfViewer }) => {
                openPdfViewer(url, text);
            });
        }
    });

    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
        }
    });

    btn.addEventListener('focus', () => {
        btn.classList.add('is-nav-focused');
        if (navType === 'gem') {
            if (onGemHover) onGemHover(true);
            if (onXLogoHover) onXLogoHover(false);
        } else if (navType === 'xlogo') {
            if (onXLogoHover) onXLogoHover(true);
            if (onGemHover) onGemHover(false);
        } else {
            if (onGemHover) onGemHover(false);
            if (onXLogoHover) onXLogoHover(false);
        }
    });

    btn.addEventListener('blur', () => {
        btn.classList.remove('is-nav-focused');
        if (navType === 'gem') {
            if (onGemHover) onGemHover(false);
        } else if (navType === 'xlogo') {
            if (onXLogoHover) onXLogoHover(false);
        }
    });

    document.body.appendChild(btn);
    return btn;
}

export function updateLabelPosition({ el, worldPos, yOffset, camera, scrollFade }) {
    worldPos.y += yOffset;
    worldPos.project(camera);

    const canKeyboardFocus = scrollFade > 0.1;
    if (worldPos.z > 1.0 || worldPos.z < -1.0) {
        const isFocused = document.activeElement === el;
        if (isFocused) {
            el.classList.remove('nav-label--hidden');
            if (!el.style.left) el.style.left = '50%';
            if (!el.style.top) el.style.top = '84%';
            el.style.filter = 'blur(0px)';
            el.style.opacity = '1';
        } else {
            el.classList.add('nav-label--hidden');
        }
        syncLabelFocusState(el, canKeyboardFocus);
        return;
    }

    el.classList.remove('nav-label--hidden');

    const x = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;

    el.style.left = x + 'px';
    el.style.top = y + 'px';

    const gaze = getRawMouse();
    const labelNdcX = x / window.innerWidth;
    const labelNdcY = y / window.innerHeight;
    const dx = labelNdcX - gaze.x;
    const gazeScreenY = 1.0 - gaze.y;
    const dy = labelNdcY - gazeScreenY;
    const gazeDist = Math.sqrt(dx * dx + dy * dy);
    const blurPx = Math.max(0, (gazeDist - 0.15) * 8.0);
    const clampedBlur = Math.min(blurPx, 4.0);
    el.style.filter = `blur(${clampedBlur.toFixed(1)}px)`;
    el.style.opacity = String(scrollFade);
    el.style.pointerEvents = scrollFade > 0.1 ? 'auto' : 'none';
    syncLabelFocusState(el, canKeyboardFocus);
}

export function syncLabelFocusState(el, isFocusable) {
    if (isFocusable) {
        if (el.tabIndex !== 0) el.tabIndex = 0;
        el.setAttribute('aria-hidden', 'false');
        return;
    }

    if (document.activeElement === el) {
        el.blur();
    }
    if (el.tabIndex !== -1) el.tabIndex = -1;
    el.setAttribute('aria-hidden', 'true');
}

export function getFocusedOrbIndex() {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return -1;
    if (!active.classList.contains('nav-label')) return -1;
    if (active.dataset.navType !== 'orb') return -1;
    const idx = Number(active.dataset.navIndex);
    return Number.isInteger(idx) ? idx : -1;
}
