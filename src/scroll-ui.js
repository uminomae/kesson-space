// scroll-ui.js — スクロール連動のHTML UI制御
// overlay, credit, control-guide, scroll hints, surface button の表示/非表示を一元管理

import { toggles, breathConfig } from './config.js';
import { detectLang } from './i18n.js';

// --- DOM要素キャッシュ ---
let _overlay;
let _credit;
let _controlGuide;
let _scrollHintBottom;
let _scrollHintTop;
let _surfaceBtn;

/**
 * DOM要素の取得とイベント登録
 */
export function initScrollUI() {
    _overlay = document.getElementById('overlay');
    _credit = document.getElementById('credit');
    _controlGuide = document.getElementById('control-guide');
    _scrollHintBottom = document.getElementById('scroll-hint');
    _scrollHintTop = document.getElementById('scroll-hint-top');
    _surfaceBtn = document.getElementById('surface-btn');

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
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

/**
 * ページ最下部判定
 */
function isNearBottom() {
    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    return (docHeight - scrollBottom) < 60;
}

/**
 * 毎フレーム呼び出し: スクロール進捗に応じてUI更新
 * @param {number} scrollProg - スクロール進捗 (0~1)
 * @param {number} breathVal  - 呼吸値 (0~1)
 */
export function updateScrollUI(scrollProg, breathVal) {
    const atTop = window.scrollY < 20;
    const atBottom = isNearBottom();

    // --- オーバーレイ（タイトル）: スクロール初期でフェードアウト ---
    updateOverlayFade(scrollProg, breathVal);

    // --- クレジット: スクロール初期でフェードアウト ---
    if (_credit) {
        _credit.style.opacity = Math.max(0, 1 - scrollProg * 4);
    }

    // --- 操作ガイド: スクロール初期でフェードアウト ---
    if (_controlGuide) {
        _controlGuide.style.opacity = Math.max(0, 1 - scrollProg * 4);
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
    }
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
