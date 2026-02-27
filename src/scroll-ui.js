// scroll-ui.js — スクロール連動のHTML UI制御
// overlay, control-guide, scroll hints, surface button の表示/非表示を一元管理

import { toggles, breathConfig } from './config.js';
import { detectLang } from './i18n.js';
import { requestScroll } from './scroll-coordinator.js';
import { pxFromViewportHeight } from './nav/responsive.js';

// --- DOM要素キャッシュ ---
let _overlay;
let _credit;
let _controlGuide;
let _langToggle;
let _scrollHintBottom;
let _scrollHintTop;
let _surfaceBtn;
let _rightCreationLink;
let _devlogHeader;
let _devlogSection;
let _articlesSection;

// --- T-014: クリーンアップ ---
let _cleanup = null;

/**
 * DOM要素の取得とイベント登録
 */
export function initScrollUI() {
    _cleanup?.();

    _overlay = document.getElementById('overlay');
    _credit = document.getElementById('credit');
    _controlGuide = document.getElementById('control-guide');
    _langToggle = document.getElementById('lang-toggle');
    _scrollHintBottom = document.getElementById('scroll-hint');
    _scrollHintTop = document.getElementById('scroll-hint-top');
    _surfaceBtn = document.getElementById('surface-btn');
    _rightCreationLink = document.getElementById('right-creation-link');
    _devlogHeader = document.getElementById('devlog-gallery-header');
    _devlogSection = document.getElementById('devlog-gallery-section');
    _articlesSection = document.getElementById('articles-section');

    if (_devlogHeader) {
        _devlogHeader.classList.remove('is-visible');
    }

    // 浮上ボタン: クリックでページ最上部へ
    if (_surfaceBtn) {
        _surfaceBtn.addEventListener('click', scrollToTop);
    }
    // 上部scroll hint: クリックでページ最上部へ
    if (_scrollHintTop) {
        _scrollHintTop.addEventListener('click', scrollToTop);
    }

    // 操作ガイドの言語切替
    applyGuideLang();

    // --- クリーンアップ関数を登録 ---
    _cleanup = () => {
        if (_surfaceBtn) _surfaceBtn.removeEventListener('click', scrollToTop);
        if (_scrollHintTop) _scrollHintTop.removeEventListener('click', scrollToTop);
    };
}

/**
 * 全リスナーを解除。
 */
export function destroyScrollUI() {
    _cleanup?.();
    _cleanup = null;
}

function scrollToTop() {
    requestScroll(0, 'scroll-ui:scroll-to-top', { behavior: 'smooth' });
}

/**
 * 操作ガイドの表示テキストを言語に応じて切替
 */
function applyGuideLang() {
    if (!_controlGuide) return;
    const lang = detectLang();
    const isJa = lang === 'ja';

    _controlGuide.querySelectorAll('[data-ja]').forEach(el => {
        el.textContent = isJa ? el.dataset.ja : el.dataset.en;
    });
}

export function refreshGuideLang() {
    applyGuideLang();
}

/**
 * ページ最下部判定
 */
function isNearBottom() {
    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    // Phase C: px固定をビューポート基準へ置換（UI近接判定のみ対象）
    const nearBottomThresholdPx = pxFromViewportHeight(60, { minScale: 0.7, maxScale: 1.4 });
    return (docHeight - scrollBottom) < nearBottomThresholdPx;
}

function syncSectionFocusability(sectionEl, shouldEnable) {
    if (!sectionEl) return;

    // A11Y-GUARD: this project intentionally controls Tab targets manually.
    // We persist previous tabindex in data-kesson-prev-tabindex and restore it later,
    // because cards are enabled/disabled as focus targets by scroll position.
    const focusables = sectionEl.querySelectorAll('a[href], button:not([disabled]), [tabindex]');
    focusables.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;

        if (shouldEnable) {
            const prev = el.dataset.kessonPrevTabindex;
            if (prev === undefined) return;
            if (prev === '__none__') {
                el.removeAttribute('tabindex');
            } else {
                el.setAttribute('tabindex', prev);
            }
            delete el.dataset.kessonPrevTabindex;
            return;
        }

        if (el.dataset.kessonPrevTabindex === undefined) {
            el.dataset.kessonPrevTabindex = el.hasAttribute('tabindex')
                ? (el.getAttribute('tabindex') || '__none__')
                : '__none__';
        }
        el.setAttribute('tabindex', '-1');
    });
}

/**
 * 毎フレーム呼び出し: スクロール進捗に応じてUI更新
 * @param {number} scrollProg - スクロール進捗 (0~1)
 * @param {number} breathVal  - 呼吸値 (0~1)
 */
export function updateScrollUI(scrollProg, breathVal) {
    const atTopThresholdPx = pxFromViewportHeight(20, { minScale: 0.7, maxScale: 1.4 });
    const atTop = window.scrollY < atTopThresholdPx;
    const atBottom = isNearBottom();

    // --- 共通フェード係数（credit と同じタイミング） ---
    const topFade = Math.max(0, 1 - scrollProg * 4);

    // --- オーバーレイ（タイトル）: スクロール初期でフェードアウト ---
    updateOverlayFade(scrollProg, breathVal);

    // --- クレジット: スクロール初期でフェードアウト ---
    if (_credit) {
        _credit.style.opacity = topFade;
    }

    // --- 操作ガイド: スクロール初期でフェードアウト ---
    if (_controlGuide) {
        _controlGuide.style.opacity = topFade;
    }

    // --- 言語トグル: Topbar外に配置されている場合のみフェードアウト ---
    if (_langToggle && !_langToggle.closest('#kesson-topbar')) {
        _langToggle.style.opacity = topFade;
        _langToggle.style.pointerEvents = topFade > 0.05 ? 'auto' : 'none';
    }

    // --- 右リンク: 既存トップUIと同タイミングでフェードアウト ---
    if (_rightCreationLink) {
        const showRightLink = topFade > 0.05;
        _rightCreationLink.style.opacity = String(topFade);
        _rightCreationLink.style.pointerEvents = showRightLink ? 'auto' : 'none';
        _rightCreationLink.setAttribute('aria-hidden', showRightLink ? 'false' : 'true');
        if (showRightLink) {
            if (_rightCreationLink.tabIndex === -1) _rightCreationLink.removeAttribute('tabindex');
        } else {
            if (document.activeElement === _rightCreationLink) _rightCreationLink.blur();
            _rightCreationLink.tabIndex = -1;
        }
    }

    // --- 下部 scroll hint: 最下部で非表示 ---
    if (_scrollHintBottom) {
        if (atBottom) {
            _scrollHintBottom.classList.remove('visible');
        } else {
            _scrollHintBottom.classList.add('visible');
        }
    }

    // --- 上部 scroll hint: スクロール中のみ表示、最上部で消える ---
    if (_scrollHintTop) {
        const showTop = !atTop && scrollProg > 0.15;
        if (showTop) {
            _scrollHintTop.classList.add('visible');
        } else {
            _scrollHintTop.classList.remove('visible');
        }
    }

    // --- 浮上ボタン: 80%以上で表示 ---
    if (_surfaceBtn) {
        const showSurface = scrollProg > 0.8;
        _surfaceBtn.style.opacity = showSurface ? '1' : '0';
        _surfaceBtn.style.pointerEvents = showSurface ? 'auto' : 'none';
        if (showSurface) {
            _surfaceBtn.setAttribute('aria-hidden', 'false');
            if (_surfaceBtn.tabIndex !== 0) _surfaceBtn.tabIndex = 0;
        } else {
            if (document.activeElement === _surfaceBtn) _surfaceBtn.blur();
            _surfaceBtn.setAttribute('aria-hidden', 'true');
            if (_surfaceBtn.tabIndex !== -1) _surfaceBtn.tabIndex = -1;
        }
    }

    // --- Devlogタイトル: セクション内でのみ表示 ---
    updateDevlogHeaderVisibility(scrollProg);
    updateCardFocusabilityByScroll();
}

function updateCardFocusabilityByScroll() {
    // A11Y-GUARD: custom accessibility rule (easy to break during refactor).
    // Tab target policy:
    // - top area (scrollY near 0): upper UI + 3D nav labels only (cards are removed from Tab order)
    // - after scrolling: article/devlog cards become tabbable
    // Do not replace with static tabindex, otherwise top-of-page keyboard flow regresses.
    const atTopThresholdPx = pxFromViewportHeight(20, { minScale: 0.7, maxScale: 1.4 });
    const isTopOnlyMode = window.scrollY < atTopThresholdPx;
    const enableCardFocus = !isTopOnlyMode;

    syncSectionFocusability(_articlesSection, enableCardFocus);
    syncSectionFocusability(_devlogSection, enableCardFocus);
}

function updateDevlogHeaderVisibility(scrollProg) {
    if (!_devlogHeader) return;
    const rect = _devlogSection ? _devlogSection.getBoundingClientRect() : null;
    const windowH = window.innerHeight || document.documentElement.clientHeight;
    const exitLine = windowH * 0.05;
    const TRACES_ENTER_Y = 0; // px: TRACES出現の基準ライン（調整用）
    const spacer = document.getElementById('articles-spacer');
    const spacerPassed = spacer
        ? spacer.getBoundingClientRect().top <= TRACES_ENTER_Y
        : scrollProg > 0.3;
    const stillInRange = rect ? rect.bottom >= exitLine : true;
    const isVisible = spacerPassed && stillInRange;
    _devlogHeader.classList.toggle('is-visible', isVisible);
}

/**
 * オーバーレイの呼吸+スクロールフェード
 */
function updateOverlayFade(scrollProg, breathVal) {
    if (!_overlay) return;

    const scrollFade = Math.max(0, 1 - scrollProg * 3.3);

    if (toggles.htmlBreath && scrollFade > 0) {
        const opacity = breathConfig.htmlMinOpacity
            + breathVal * (breathConfig.htmlMaxOpacity - breathConfig.htmlMinOpacity);
        const blur = breathConfig.htmlMaxBlur * (1 - breathVal);
        const scale = breathConfig.htmlMinScale + breathVal * (1 - breathConfig.htmlMinScale);
        _overlay.style.opacity = opacity * scrollFade;
        _overlay.style.filter = `blur(${blur}px)`;
        _overlay.style.transform = `scale(${scale})`;
    } else if (scrollFade > 0) {
        _overlay.style.opacity = breathConfig.htmlMaxOpacity * scrollFade;
        _overlay.style.filter = 'none';
        _overlay.style.transform = 'scale(1)';
    } else {
        _overlay.style.opacity = '0';
        _overlay.style.pointerEvents = 'none';
    }
}
