/**
 * Read Moreボタンを生成
 * @param {Function} onClick - クリック時のコールバック（openOffcanvasを呼ぶ）
 * @param {number} remainingCount - 残り件数
 * @returns {HTMLElement} - ボタン要素
 */
export function createReadMoreButton(onClick, remainingCount) {
  const btn = document.createElement('button');
  btn.className = 'btn-read-more';
  btn.textContent = `▸ Read More (${remainingCount})`;
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', onClick);
  return btn;
}
