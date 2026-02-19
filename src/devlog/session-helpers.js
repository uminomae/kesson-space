export const DEVLOG_DEFAULT_COVER = './assets/devlog/covers/default.svg';
export const SUPPORTED_LANGS = new Set(['ja', 'en']);

export function normalizeLang(lang) {
  return SUPPORTED_LANGS.has(lang) ? lang : 'ja';
}

export function getSessionText(session, key, lang) {
  if (!session || typeof session !== 'object') return '';
  const normalizedLang = normalizeLang(lang);
  const fallbackLang = normalizedLang === 'en' ? 'ja' : 'en';
  const byLangKey = `${key}_${normalizedLang}`;
  const fallbackByLangKey = `${key}_${fallbackLang}`;

  if (typeof session[byLangKey] === 'string' && session[byLangKey].trim()) {
    return session[byLangKey];
  }
  if (typeof session[fallbackByLangKey] === 'string' && session[fallbackByLangKey].trim()) {
    return session[fallbackByLangKey];
  }

  const value = session[key];
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object') {
    if (typeof value[normalizedLang] === 'string' && value[normalizedLang].trim()) return value[normalizedLang];
    if (typeof value[fallbackLang] === 'string' && value[fallbackLang].trim()) return value[fallbackLang];
  }
  return '';
}

export function getSessionTitle(session, lang) {
  return getSessionText(session, 'title', lang) || session?.id || '';
}

export function getSessionDateRange(session, lang) {
  return getSessionText(session, 'date_range', lang) || session?.id || '';
}

export function getSessionSummary(session, lang) {
  const normalizedLang = normalizeLang(lang);
  const byLangKey = `summary_${normalizedLang}`;
  if (typeof session?.[byLangKey] === 'string' && session[byLangKey].trim()) {
    return session[byLangKey].trim();
  }
  const byLang = session?.summary_by_lang;
  if (byLang && typeof byLang === 'object' && typeof byLang[normalizedLang] === 'string' && byLang[normalizedLang].trim()) {
    return byLang[normalizedLang].trim();
  }
  return '';
}

export function buildSessionHref(sessionId, lang) {
  const params = new URLSearchParams();
  params.set('id', sessionId);
  if (normalizeLang(lang) === 'en') params.set('lang', 'en');
  return `./devlog.html?${params.toString()}`;
}

function readSessionCoverValue(session, lang) {
  if (!session || typeof session !== 'object') return '';
  const normalizedLang = normalizeLang(lang);
  const fallbackLang = normalizedLang === 'en' ? 'ja' : 'en';

  const byLang = session.cover_by_lang;
  if (byLang && typeof byLang === 'object') {
    if (typeof byLang[normalizedLang] === 'string' && byLang[normalizedLang].trim()) return byLang[normalizedLang];
    if (typeof byLang[fallbackLang] === 'string' && byLang[fallbackLang].trim()) return byLang[fallbackLang];
  }

  const key = `cover_${normalizedLang}`;
  if (typeof session[key] === 'string' && session[key].trim()) return session[key];

  const fallbackKey = `cover_${fallbackLang}`;
  if (typeof session[fallbackKey] === 'string' && session[fallbackKey].trim()) return session[fallbackKey];

  if (typeof session.cover === 'string' && session.cover.trim()) return session.cover;
  return '';
}

export function resolveSessionCover(session, lang) {
  const normalizedLang = normalizeLang(lang);

  if (normalizedLang === 'en') {
    const explicitEnCover = (() => {
      if (typeof session?.cover_en === 'string' && session.cover_en.trim()) return session.cover_en;
      const byLang = session?.cover_by_lang;
      if (byLang && typeof byLang === 'object' && typeof byLang.en === 'string' && byLang.en.trim()) {
        return byLang.en;
      }
      return '';
    })();

    if (explicitEnCover) {
      return { src: explicitEnCover, localized: true };
    }
    return { src: DEVLOG_DEFAULT_COVER, localized: false };
  }

  const localizedCover = readSessionCoverValue(session, normalizedLang);
  if (localizedCover) {
    return { src: localizedCover, localized: true };
  }
  return { src: DEVLOG_DEFAULT_COVER, localized: false };
}
