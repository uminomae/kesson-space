/**
 * Read Moreボタンを生成
 * @param {Function} onClick - クリック時のコールバック（openOffcanvasを呼ぶ）
 * @returns {HTMLElement} - ボタン要素
 */
export function createReadMoreButton(onClick) {
  const btn = document.createElement('button');
  btn.className = 'btn-read-more';
  btn.textContent = 'Read More';
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', onClick);
  return btn;
}
