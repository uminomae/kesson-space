import { detectLang, LANG_CHANGE_EVENT, t } from '../i18n.js';

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
    const creationCardsHeading = document.getElementById('creation-cards-heading');
    if (creationCardsHeading && strings.creationCardsHeading) {
        creationCardsHeading.textContent = strings.creationCardsHeading;
    }
    const rightCreationLinkLabel = document.getElementById('right-creation-link-label');
    if (rightCreationLinkLabel && strings.rightCreationLinkLabel) {
        rightCreationLinkLabel.textContent = strings.rightCreationLinkLabel;
    }
    const rightCreationLink = document.getElementById('right-creation-link');
    if (rightCreationLink && strings.rightCreationLinkAria) {
        rightCreationLink.setAttribute('aria-label', strings.rightCreationLinkAria);
    }

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

    document.documentElement.lang = resolvedLang;
}

// DECISION: language-change side effects live with page-language updates so one module owns "lang -> DOM refresh".
// This removes listener sprawl from main.js while keeping the same event source and callback order. (Phase A-3 / 2026-02-19)
export function initLanguageListeners({
    refreshGuideLang = () => {},
    refreshNavLanguage = () => {},
    refreshDevlogLanguage = () => {},
    refreshArticlesLanguage = () => {},
    refreshCreationCardsLanguage = () => {},
} = {}) {
    window.addEventListener(LANG_CHANGE_EVENT, (event) => {
        const nextLang = event.detail?.lang || detectLang();
        applyPageLanguage(nextLang);
        refreshGuideLang();
        refreshNavLanguage();
        refreshDevlogLanguage();
        refreshArticlesLanguage();
        refreshCreationCardsLanguage();
    });
}
