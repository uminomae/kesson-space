/**
 * Read Moreボタンを生成
 * @param {Function} onClick - クリック時のコールバック（openOffcanvasを呼ぶ）
 * @param {number} remainingCount - 残り件数
 * @param {'ja' | 'en'} lang - 表示言語
 * @returns {HTMLElement} - ボタン要素
 */
export function createReadMoreButton(onClick, remainingCount, lang = 'ja') {
  const normalizedLang = lang === 'en' ? 'en' : 'ja';
  const text = normalizedLang === 'en'
    ? `▸ Read More (${remainingCount})`
    : `▸ 続きを見る (${remainingCount})`;
  const btn = document.createElement('button');
  btn.className = 'btn-read-more';
  btn.textContent = text;
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', normalizedLang === 'en' ? 'Open all devlog sessions' : 'devlog一覧を開く');
  btn.addEventListener('click', onClick);
  return btn;
}
