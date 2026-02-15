/**
 * Read Moreボタンを生成
 * @param {Function} onExpand - 展開時のコールバック
 * @returns {HTMLElement} - ボタン要素
 */
export function createReadMoreButton(onExpand) {
  const button = document.createElement('button');
  button.id = 'read-more-btn';
  button.className = 'btn-read-more';
  button.setAttribute('aria-label', 'Show all devlog sessions');
  button.setAttribute('aria-expanded', 'false');
  button.textContent = 'Read More →';
  button.addEventListener('click', () => {
    onExpand();
  });
  return button;
}

/**
 * Show Lessボタンを生成
 * @param {Function} onCollapse - 折りたたみ時のコールバック
 * @returns {HTMLElement} - ボタン要素
 */
export function createShowLessButton(onCollapse) {
  const button = document.createElement('button');
  button.id = 'show-less-btn';
  button.className = 'btn-show-less';
  button.setAttribute('aria-label', 'Collapse devlog list');
  button.setAttribute('aria-expanded', 'true');
  button.textContent = '← Show Less';
  button.addEventListener('click', () => {
    onCollapse();
  });
  return button;
}
