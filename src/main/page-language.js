import { detectLang, t } from '../i18n.js';

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
    const creditSig = document.getElementById('credit-signature');
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

    document.documentElement.lang = resolvedLang;
}
