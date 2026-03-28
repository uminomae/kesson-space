import { detectLang, LANG_CHANGE_EVENT, t } from '../i18n.js';

// NOTE: textContent 代入は子要素を破壊する。data-ja/data-en は子要素を持たない葉要素にのみ付与すること。
// 子要素を含む場合は <span data-ja="..." data-en="..."> で分離する。
function applyDatasetLanguage(lang) {
    const textAttr = lang === 'en' ? 'data-en' : 'data-ja';
    const ariaAttr = lang === 'en' ? 'data-en-aria-label' : 'data-ja-aria-label';

    document.querySelectorAll('[data-ja][data-en]').forEach((el) => {
        const nextText = el.getAttribute(textAttr);
        if (typeof nextText === 'string') {
            el.textContent = nextText;
        }
    });

    document.querySelectorAll('[data-ja-aria-label][data-en-aria-label]').forEach((el) => {
        const nextLabel = el.getAttribute(ariaAttr);
        if (typeof nextLabel === 'string') {
            el.setAttribute('aria-label', nextLabel);
        }
    });
}

// DECISION: page text rewrite is a pure DOM concern, so we isolate it from main.js orchestration.
// This keeps main.js focused on scene/bootstrap flow and avoids mixing UI mutation with startup wiring.
// (Phase A-1 / 2026-02-19)
export function applyPageLanguage(lang) {
    const resolvedLang = lang || detectLang();
    const strings = t(resolvedLang);

    const topbarMainTitle = document.getElementById('topbar-main-title');
    if (topbarMainTitle) topbarMainTitle.textContent = strings.title;
    const topbarSubtitle = document.getElementById('topbar-subtitle');
    if (topbarSubtitle) topbarSubtitle.textContent = strings.subtitle;

    const creditCollab = document.getElementById('credit-collab');
    if (creditCollab) creditCollab.textContent = strings.credit;
    const creditSig = document.getElementById('footer-signature');
    if (creditSig) creditSig.textContent = strings.creditSignature;

    const taglineContainer = document.getElementById('taglines');
    if (taglineContainer && strings.taglines) {
        taglineContainer.innerHTML = '';
        const isEn = resolvedLang === 'en';
        strings.taglines.forEach((text) => {
            const p = document.createElement('p');
            p.className = isEn ? 'tagline-en' : 'tagline';
            p.textContent = text;
            taglineContainer.appendChild(p);
        });
    }

    // CHANGED(2026-03-28): allow static SEO copy and other plain-text nodes to follow lang toggle.
    applyDatasetLanguage(resolvedLang);
    document.documentElement.lang = resolvedLang;
}

// DECISION: language-change side effects live with page-language updates so one module owns "lang -> DOM refresh".
// This removes listener sprawl from main.js while keeping the same event source and callback order. (Phase A-3 / 2026-02-19)
export function initLanguageListeners({
    refreshGuideLang = () => {},
    refreshNavLanguage = () => {},
    refreshDevlogLanguage = () => {},
    refreshArticlesLanguage = () => {},
    refreshGuidesLanguage = () => {},
} = {}) {
    window.addEventListener(LANG_CHANGE_EVENT, (event) => {
        const nextLang = event.detail?.lang || detectLang();
        applyPageLanguage(nextLang);
        refreshGuideLang();
        refreshNavLanguage();
        refreshDevlogLanguage();
        refreshArticlesLanguage();
        refreshGuidesLanguage();
    });
}
