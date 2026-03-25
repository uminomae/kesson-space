import DOMPurify from 'dompurify';
import { detectLang } from './i18n.js';

function normalizeLang(lang) {
    return lang === 'en' ? 'en' : 'ja';
}

const PJDHIRO_PAGES_BASE = 'https://uminomae.github.io/pjdhiro';
const PJDHIRO_RAW_BASE = 'https://raw.githubusercontent.com/uminomae/pjdhiro/main';
const KESSON_PATH = '/assets/kesson';
const PJDHIRO_KESSON_PAGES = `${PJDHIRO_PAGES_BASE}${KESSON_PATH}`;
const PJDHIRO_KESSON_RAW = `${PJDHIRO_RAW_BASE}${KESSON_PATH}`;

const GUIDE_LINKS = [
    {
        key: 'general',
        links: {
            ja: {
                mdUrl: `${PJDHIRO_KESSON_RAW}/guides/ja/md/kesson-general.md`,
                pdfUrl: `${PJDHIRO_KESSON_PAGES}/guides/ja/pdf/kesson-general.pdf`,
            },
            en: {
                mdUrl: `${PJDHIRO_KESSON_RAW}/guides/en/md/kesson-general.md`,
                pdfUrl: `${PJDHIRO_KESSON_PAGES}/guides/en/pdf/kesson-general.pdf`,
            },
        },
    },
    {
        key: 'designer',
        links: {
            ja: {
                mdUrl: `${PJDHIRO_KESSON_RAW}/guides/ja/md/kesson-designer.md`,
                pdfUrl: `${PJDHIRO_KESSON_PAGES}/guides/ja/pdf/kesson-designer.pdf`,
            },
            en: {
                mdUrl: `${PJDHIRO_KESSON_RAW}/guides/en/md/kesson-designer.md`,
                pdfUrl: `${PJDHIRO_KESSON_PAGES}/guides/en/pdf/kesson-designer.pdf`,
            },
        },
    },
    {
        key: 'academic',
        links: {
            ja: {
                mdUrl: `${PJDHIRO_KESSON_RAW}/guides/ja/md/kesson-academic.md`,
                pdfUrl: `${PJDHIRO_KESSON_PAGES}/guides/ja/pdf/kesson-academic.pdf`,
            },
            en: {
                mdUrl: `${PJDHIRO_KESSON_RAW}/guides/en/md/kesson-academic.md`,
                pdfUrl: `${PJDHIRO_KESSON_PAGES}/guides/en/pdf/kesson-academic.pdf`,
            },
        },
    },
];

// CHANGED(2026-03-25): #146 — External project links
const EXTERNAL_LINKS = [
    {
        key: 'creation',
        url: 'https://uminomae.github.io/creation-space/',
    },
    {
        key: 'awareness',
        url: 'https://uminomae.github.io/awareness-space/',
    },
];

const STRINGS = {
    ja: {
        modalLoading: 'Markdown を読み込み中...',
        modalError: 'Markdown の読み込みに失敗しました。',
        modalOpenPdf: 'PDFを開く',
        modalPdfPending: 'PDF準備中',
        modalClose: '閉じる',
        modalModel: 'モデル',
        modalGenerated: '生成日',
        features: {
            general: {
                title: '一般向け',
                modalTitle: '欠損駆動思考 — 一般向け',
                description: '欠損駆動思考の全体像を短く把握するための解説。',
            },
            designer: {
                title: '設計者向け',
                modalTitle: 'ラベルの下を見る',
                description: '設計判断と運用視点で読む解説。',
            },
            academic: {
                title: '専門家向け',
                modalTitle: '欠損駆動思考 — 学術版',
                description: '理論比較と検証観点を含む解説。',
            },
        },
        featureRead: '解説を表示',
        featurePdf: 'PDF',
        // CHANGED(2026-03-25): #168 — External link card strings
        externalLinks: {
            creation: {
                title: '創造とは', // CHANGED(2026-03-25)
                description: '創造のモデルに対する調査の記録です。', // CHANGED(2026-03-25)
            },
            awareness: {
                title: '意識の構造分析',
                description: '意識と無意識の関係を構造的に分析した記録です。',
            },
        },
        externalOpen: '開く',
    },
    en: {
        modalLoading: 'Loading markdown...',
        modalError: 'Failed to load markdown.',
        modalOpenPdf: 'Open PDF',
        modalPdfPending: 'PDF Pending',
        modalClose: 'Close',
        modalModel: 'Model',
        modalGenerated: 'Generated',
        features: {
            general: {
                title: 'General',
                modalTitle: 'Kesson-Driven Thinking — Overview',
                description: 'A concise overview of the kesson-driven thinking framework.',
            },
            designer: {
                title: 'Designer',
                modalTitle: 'Seeing Beneath the Label',
                description: 'Guide focused on design and implementation decisions.',
            },
            academic: {
                title: 'Expert',
                modalTitle: 'Kesson-Driven Thinking — Academic',
                description: 'Theory comparison and verification-oriented guide.',
            },
        },
        featureRead: 'Open Guide',
        featurePdf: 'PDF',
        // CHANGED(2026-03-25): #168 — External link card strings
        externalLinks: {
            creation: {
                title: 'What Is Creation', // CHANGED(2026-03-25)
                description: 'Records of research into models of creation.', // CHANGED(2026-03-25)
            },
            awareness: {
                title: 'Structural Analysis of Consciousness',
                description: 'Records of structural analysis on the relationship between consciousness and the unconscious.',
            },
        },
        externalOpen: 'Open',
    },
};

let markedParser = null;

const state = {
    lang: 'ja',
    mdModalInstance: null,
    mdRequestId: 0,
    dom: {
        featureCards: null,
        mdModal: null,
        mdModalTitle: null,
        mdModalMeta: null,
        mdModalContent: null,
        mdOpenPdf: null,
        mdCloseBtn: null,
        externalLinks: null, // CHANGED(2026-03-25): #146
    },
};

function getStrings(lang = 'ja') {
    return STRINGS[normalizeLang(lang)] || STRINGS.ja;
}

async function getMarked() {
    if (!markedParser) {
        const { marked } = await import('marked');
        marked.setOptions({ breaks: true, gfm: true });
        markedParser = marked;
    }
    return markedParser;
}

function parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: text.trim() };

    const meta = {};
    match[1].split('\n').forEach((line) => {
        const idx = line.indexOf(':');
        if (idx <= 0) return;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        meta[key] = val;
    });

    return { meta, body: match[2].trim() };
}

function formatDate(isoStr) {
    if (!isoStr) return '';
    const match = String(isoStr).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : String(isoStr);
}

function normalizePdfBrowserUrl(rawUrl) {
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) return '';
    try {
        const parsed = new URL(rawUrl);
        if (parsed.hostname === 'raw.githubusercontent.com' && /\.pdf(?:$|[?#])/i.test(parsed.pathname)) {
            const parts = parsed.pathname.split('/').filter(Boolean);
            if (parts.length >= 4) {
                const [owner, repo, _branch, ...restPath] = parts;
                return `https://${owner}.github.io/${repo}/${restPath.join('/')}`;
            }
        }
        return rawUrl;
    } catch {
        return '';
    }
}

function cacheDom() {
    state.dom.featureCards = document.getElementById('guides-feature-cards');
    state.dom.mdModal = document.getElementById('guides-md-modal');
    state.dom.mdModalTitle = document.getElementById('guides-md-modal-title');
    state.dom.mdModalMeta = document.getElementById('guides-md-meta');
    state.dom.mdModalContent = document.getElementById('guides-md-content');
    state.dom.mdOpenPdf = document.getElementById('guides-md-open-pdf');
    state.dom.mdCloseBtn = document.getElementById('guides-md-close-btn');
    state.dom.externalLinks = document.getElementById('guides-external-links'); // CHANGED(2026-03-25): #146
}

function ensureMdModalInstance() {
    if (!state.dom.mdModal || !globalThis.bootstrap?.Modal) return null;
    if (!state.mdModalInstance) {
        state.mdModalInstance = globalThis.bootstrap.Modal.getOrCreateInstance(state.dom.mdModal);
    }
    return state.mdModalInstance;
}

function setModalPdfButton(pdfUrl) {
    if (!state.dom.mdOpenPdf) return;
    const strings = getStrings(state.lang);
    const browserPdfUrl = normalizePdfBrowserUrl(pdfUrl);
    if (browserPdfUrl) {
        state.dom.mdOpenPdf.href = browserPdfUrl;
        state.dom.mdOpenPdf.textContent = strings.modalOpenPdf;
        state.dom.mdOpenPdf.classList.remove('disabled');
        state.dom.mdOpenPdf.setAttribute('aria-disabled', 'false');
    } else {
        state.dom.mdOpenPdf.href = '#';
        state.dom.mdOpenPdf.textContent = strings.modalPdfPending;
        state.dom.mdOpenPdf.classList.add('disabled');
        state.dom.mdOpenPdf.setAttribute('aria-disabled', 'true');
    }
}

function setMarkdownModalLoading({ title, pdfUrl }) {
    const strings = getStrings(state.lang);

    if (state.dom.mdModalTitle) {
        state.dom.mdModalTitle.textContent = title || '';
    }
    if (state.dom.mdModalMeta) {
        state.dom.mdModalMeta.textContent = '';
    }
    if (state.dom.mdModalContent) {
        state.dom.mdModalContent.innerHTML = `
            <div class="d-flex align-items-center gap-2 text-body-secondary">
                <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span>${strings.modalLoading}</span>
            </div>
        `;
    }
    setModalPdfButton(pdfUrl);

    if (state.dom.mdCloseBtn) {
        state.dom.mdCloseBtn.textContent = strings.modalClose;
    }
}

async function openMarkdownModal({ mdUrl, title = '', pdfUrl = '' }) {
    if (!mdUrl) return;

    const modal = ensureMdModalInstance();
    if (!modal) {
        window.open(mdUrl, '_blank', 'noopener');
        return;
    }

    const requestId = ++state.mdRequestId;
    setMarkdownModalLoading({ title, pdfUrl });
    modal.show();

    try {
        const marked = await getMarked();
        const response = await fetch(mdUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = await response.text();

        if (requestId !== state.mdRequestId) return;

        const { meta, body } = parseFrontmatter(raw);
        const html = DOMPurify.sanitize(marked.parse(body || raw));

        setModalPdfButton(pdfUrl);
        if (state.dom.mdModalContent) {
            state.dom.mdModalContent.innerHTML = `
                <div class="md-article">
                    <div class="md-body">${html}</div>
                </div>
            `;
        }

        const strings = getStrings(state.lang);
        const metaParts = [];
        if (meta.generator_model) metaParts.push(`${strings.modalModel}: ${meta.generator_model}`);
        if (meta.generated) metaParts.push(`${strings.modalGenerated}: ${formatDate(meta.generated)}`);
        if (state.dom.mdModalMeta) {
            state.dom.mdModalMeta.textContent = metaParts.join(' / ');
        }
    } catch (error) {
        console.warn('[guides] markdown load failed:', error);
        if (requestId !== state.mdRequestId) return;
        const strings = getStrings(state.lang);
        if (state.dom.mdModalMeta) {
            state.dom.mdModalMeta.textContent = '';
        }
        if (state.dom.mdModalContent) {
            state.dom.mdModalContent.innerHTML = `<p class="text-warning-emphasis mb-0">${strings.modalError}</p>`;
        }
        setModalPdfButton(pdfUrl);
    }
}

function renderFeatureCards() {
    if (!state.dom.featureCards) return;

    const strings = getStrings(state.lang);
    state.dom.featureCards.innerHTML = '';

    // CHANGED(2026-03-25): #161 — Overview slide card (separate row above guide cards)
    const overviewRow = document.getElementById('guides-overview-row');
    if (overviewRow) {
        overviewRow.innerHTML = '';
        const overviewCard = document.createElement('article');
        overviewCard.className = 'card kesson-card overview-slide-card';
        overviewCard.id = 'slide-test-btn';
        overviewCard.setAttribute('role', 'button');
        overviewCard.setAttribute('tabindex', '0');
        overviewCard.setAttribute('aria-label', 'Overview スライドを表示');

        const overviewThumb = document.createElement('div');
        overviewThumb.className = 'overview-card-thumb';
        const overviewThumbText = document.createElement('span');
        overviewThumbText.className = 'overview-card-thumb-text';
        overviewThumbText.textContent = 'Overview';
        overviewThumb.appendChild(overviewThumbText);

        const overviewBody = document.createElement('div');
        overviewBody.className = 'card-body p-2 p-md-3 d-flex flex-column gap-1';
        const overviewTitle = document.createElement('h3');
        overviewTitle.className = 'card-title mb-1';
        overviewTitle.innerHTML = '全体像 <span class="overview-card-badge">test</span>';
        const overviewDesc = document.createElement('p');
        overviewDesc.className = 'card-text';
        overviewDesc.textContent = '欠損駆動思考の全体像をスライドで概観する。';
        overviewBody.appendChild(overviewTitle);
        overviewBody.appendChild(overviewDesc);

        overviewCard.appendChild(overviewThumb);
        overviewCard.appendChild(overviewBody);
        overviewRow.appendChild(overviewCard);
    }

    const fragment = document.createDocumentFragment();
    GUIDE_LINKS.forEach((guide) => {
        const featureText = strings.features[guide.key];
        if (!featureText) return;

        const lang = normalizeLang(state.lang);
        const langLinks = guide.links[lang] || guide.links.ja;

        const col = document.createElement('div');
        col.className = 'col';

        const card = document.createElement('article');
        card.className = 'card kesson-card h-100 reports-feature-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${featureText.title} ${strings.featureRead}`);

        const body = document.createElement('div');
        body.className = 'card-body p-2 p-md-3 d-flex flex-column gap-1';

        const title = document.createElement('h3');
        // CHANGED(2026-03-07): #116 Bug #6 — ARTICLES カードと同じ card-title スタイルに統一
        title.className = 'card-title mb-1';
        title.textContent = featureText.title;

        const desc = document.createElement('p');
        desc.className = 'card-text';
        desc.textContent = featureText.description;
        body.appendChild(title);
        body.appendChild(desc);
        card.appendChild(body);

        const openCardModal = () => {
            openMarkdownModal({
                mdUrl: langLinks.mdUrl,
                title: featureText.modalTitle || featureText.title,
                pdfUrl: langLinks.pdfUrl,
            });
        };
        card.addEventListener('click', openCardModal);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openCardModal();
            }
        });

        col.appendChild(card);
        fragment.appendChild(col);
    });

    state.dom.featureCards.appendChild(fragment);
}

// CHANGED(2026-03-25): #146 — Render external project link cards
function renderExternalLinks() {
    if (!state.dom.externalLinks) return;

    const strings = getStrings(state.lang);
    state.dom.externalLinks.innerHTML = '';
    const fragment = document.createDocumentFragment();

    EXTERNAL_LINKS.forEach((link) => {
        const text = strings.externalLinks[link.key];
        if (!text) return;

        const col = document.createElement('div');
        col.className = 'col';

        const card = document.createElement('a');
        card.className = 'card kesson-card h-100 guides-external-card';
        card.href = link.url;
        card.target = '_blank';
        card.rel = 'noopener';
        card.setAttribute('aria-label', `${text.title} — ${strings.externalOpen}`);

        const body = document.createElement('div');
        body.className = 'card-body p-2 p-md-3 d-flex flex-column gap-1';

        const title = document.createElement('h3');
        title.className = 'card-title mb-1';
        title.textContent = text.title;

        const desc = document.createElement('p');
        desc.className = 'card-text';
        desc.textContent = text.description;

        const openLabel = document.createElement('span');
        openLabel.className = 'guides-external-open-label';
        openLabel.textContent = strings.externalOpen + ' \u2197';

        body.appendChild(title);
        body.appendChild(desc);
        body.appendChild(openLabel);
        card.appendChild(body);
        col.appendChild(card);
        fragment.appendChild(col);
    });

    state.dom.externalLinks.appendChild(fragment);
}

function render() {
    renderFeatureCards();
    renderExternalLinks(); // CHANGED(2026-03-25): #146
    if (state.dom.mdCloseBtn) {
        state.dom.mdCloseBtn.textContent = getStrings(state.lang).modalClose;
    }
}

export function initGuides({ lang = 'ja' } = {}) {
    cacheDom();
    state.lang = normalizeLang(lang);

    if (state.dom.mdOpenPdf) {
        state.dom.mdOpenPdf.addEventListener('click', (event) => {
            if (state.dom.mdOpenPdf?.classList.contains('disabled')) {
                event.preventDefault();
            }
        });
    }

    render();
}

export function setGuidesLanguage(lang) {
    state.lang = normalizeLang(lang);
    render();
}
