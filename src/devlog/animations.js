/**
 * カードをスライドインさせる
 * @param {NodeList|HTMLElement[]} cards - 展開対象のカード要素群
 * @param {number} staggerDelay - カード間の遅延（ms）
 * @returns {Promise<void>}
 */
export async function slideInCards(cards, staggerDelay = 50) {
  const list = Array.from(cards || []);
  if (list.length === 0) {
    return;
  }

  const transitions = list.map((card, index) =>
    new Promise((resolve) => {
      const onEnd = () => resolve();
      card.addEventListener('transitionend', onEnd, { once: true });
      card.addEventListener('transitioncancel', onEnd, { once: true });

      setTimeout(() => {
        card.classList.add('expanded');
      }, index * staggerDelay);
    })
  );

  await Promise.all(transitions);
}

/**
 * カードをスライドアウトさせる
 * @param {NodeList|HTMLElement[]} cards - 折りたたみ対象のカード要素群
 * @returns {Promise<void>}
 */
export async function slideOutCards(cards) {
  const list = Array.from(cards || []);
  if (list.length === 0) {
    return;
  }

  const transitions = list.map((card) =>
    new Promise((resolve) => {
      const onEnd = () => resolve();
      card.addEventListener('transitionend', onEnd, { once: true });
      card.addEventListener('transitioncancel', onEnd, { once: true });
      card.classList.remove('expanded');
    })
  );

  await Promise.all(transitions);
}
