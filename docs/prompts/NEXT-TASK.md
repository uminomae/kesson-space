# Claude Code 指示書：Articles Read More 機能

**タスクID**: T-040-11  
**親タスク**: T-040  
**作成日**: 2026-02-16  
**ブランチ**: `feature/kesson-articles`  

---

## ❗ 制約

- **この指示書の内容のみ実行すること**
- `claude/*` ブランチを作成しない。下記のブランチで作業すること
- コミットは自律的に実行（DT 承認不要）

---

## 前提手順

```bash
# リモートの最新を取得
git fetch origin

# 作業ブランチに切り替え
git checkout feature/kesson-articles || git checkout -b feature/kesson-articles origin/feature/kesson-articles

# 最新を反映
git pull origin feature/kesson-articles
```

### ブランチが見つからない場合

```bash
git ls-remote origin | grep feature/kesson
# 存在しなければ作業を中止して報告すること
```

---

## 🎯 ミッション

Articles セクション（index.html 内）に Read More ボタンを追加。  
クリックで残りの記事カードを展開表示する。

### 現状

```
[Articles]
 3 / 5 articles
 [card] [card] [card]     ← 最新3件のみ表示
                           ← 残り2件は見えない
[devlog ギャラリー]
```

### 完成形

```
[Articles]
 3 / 5 articles
 [card] [card] [card]     ← 最新3件
 [ ▾ Read More ]          ← ボタン（残り件数を表示）

↓ クリック後

[Articles]
 5 / 5 articles
 [card] [card] [card]     ← 最新3件
 [card] [card]            ← 残り2件が展開
 [ ▴ Show Less ]          ← 折りたたみボタンに変化
[devlog ギャラリー]
```

---

## 📝 実装仕様

### 変更対象

`index.html` の Articles Section loader（末尾の `<script type="module">` ブロック）のみ。  
CSS は **`.btn-read-more` が既に定義済み**なのでそのまま使用する。

### JavaScript の変更内容

現在の `loadArticles()` 関数を以下のように修正:

```javascript
// === Articles Section ===
(async function loadArticles() {
  const API_URL = 'https://uminomae.github.io/pjdhiro/api/kesson-articles.json';
  const MOCK_URL = './assets/articles/articles.json';
  const INITIAL_DISPLAY = 3;

  const grid = document.getElementById('articles-grid');
  const countEl = document.getElementById('articles-count');
  const errorEl = document.getElementById('articles-error');
  if (!grid) return;

  // --- fetch（既存ロジック維持） ---
  let articles = null;
  try {
    const res = await fetch(API_URL);
    if (res.ok) articles = await res.json();
  } catch (e) {
    console.warn('[articles] API unavailable:', e.message);
  }
  if (!articles) {
    try {
      const res = await fetch(MOCK_URL);
      if (res.ok) articles = await res.json();
    } catch (e) {
      console.error('[articles] Mock also failed:', e.message);
    }
  }
  if (!articles || articles.length === 0) {
    errorEl.textContent = '記事データの読み込みに失敗しました。';
    errorEl.classList.remove('d-none');
    return;
  }

  // --- ソート ---
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  // --- カード生成関数 ---
  function createCard(item) {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4 mb-3';

    const dateStr = item.date
      ? new Date(item.date).toLocaleDateString('ja-JP', {
          year: 'numeric', month: '2-digit', day: '2-digit'
        })
      : '';

    const teaserHtml = item.teaser
      ? `<img src="${item.teaser}" class="card-img-top" alt=""
             style="max-height:140px;object-fit:cover;"
             onerror="this.style.display='none'">`
      : '';

    const excerptHtml = item.excerpt
      ? `<p class="card-text small" style="color:#94a3b8;font-size:0.8rem;line-height:1.6;">
           ${item.excerpt}
         </p>`
      : '';

    col.innerHTML = `
      <a href="${item.url}" target="_blank" rel="noopener"
         class="text-decoration-none"
         aria-label="${item.title} を読む">
        <div class="card h-100">
          ${teaserHtml}
          <div class="card-body">
            <span class="badge mb-2" style="background:rgba(100,150,255,0.15);color:rgba(180,200,230,0.6);font-size:0.65rem;">
              ${item.type === 'page' ? 'page' : 'post'}
            </span>
            <h6 class="card-title" style="color:#e2e8f0;font-size:0.85rem;line-height:1.5;">
              ${item.title}
            </h6>
            ${excerptHtml}
            <small style="color:rgba(180,200,230,0.4);">${dateStr}</small>
          </div>
        </div>
      </a>`;

    return col;
  }

  // --- 初期表示（最新 N 件） ---
  const initialItems = articles.slice(0, INITIAL_DISPLAY);
  const remainingItems = articles.slice(INITIAL_DISPLAY);

  initialItems.forEach(item => grid.appendChild(createCard(item)));
  countEl.textContent = initialItems.length + ' / ' + articles.length + ' articles';

  // --- Read More ボタン（残りがある場合のみ） ---
  if (remainingItems.length > 0) {
    const btnContainer = document.createElement('div');
    btnContainer.className = 'text-center mt-3';

    const btn = document.createElement('button');
    btn.className = 'btn-read-more';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '▾ Read More (' + remainingItems.length + ')';

    // 残りカード用コンテナ（初期非表示）
    const moreGrid = document.createElement('div');
    moreGrid.className = 'row g-3 mt-1';
    moreGrid.style.display = 'none';

    remainingItems.forEach(item => moreGrid.appendChild(createCard(item)));

    let expanded = false;

    btn.addEventListener('click', () => {
      expanded = !expanded;

      if (expanded) {
        moreGrid.style.display = '';
        btn.textContent = '▴ Show Less';
        btn.setAttribute('aria-expanded', 'true');
        countEl.textContent = articles.length + ' / ' + articles.length + ' articles';
      } else {
        moreGrid.style.display = 'none';
        btn.textContent = '▾ Read More (' + remainingItems.length + ')';
        btn.setAttribute('aria-expanded', 'false');
        countEl.textContent = initialItems.length + ' / ' + articles.length + ' articles';
      }
    });

    // DOM に追加: grid → moreGrid → ボタン
    grid.parentNode.insertBefore(moreGrid, grid.nextSibling);
    grid.parentNode.insertBefore(btnContainer, moreGrid.nextSibling);
    btnContainer.appendChild(btn);
  }
})();
```

### HTML の変更

なし。既存の `#articles-grid` と `#articles-count` をそのまま使用。

### CSS の変更

なし。`.btn-read-more` は既に定義済み（`:hover`, `:focus` 含む）。

---

## ✅ チェックリスト

### 必須

- [ ] 初期表示は最新3件のまま（既存動作を壊さない）
- [ ] 「▾ Read More (2)」ボタンがカードの下に表示
- [ ] ボタンクリックで残り2件が展開表示
- [ ] 展開後ボタンが「▴ Show Less」に変化
- [ ] 再クリックで折りたたみ
- [ ] カウント表示が切り替わる（3/5 ↔ 5/5）
- [ ] 展開されたカードも正しくリンク遷移する（新タブ）
- [ ] コンソールエラーなし

### アクセシビリティ

- [ ] `aria-expanded` が true/false で切り替わる
- [ ] キーボード（Tab → Enter）でボタン操作可能

### エッジケース

- [ ] 記事が3件以下の場合: Read More ボタンが表示されない
- [ ] 記事が0件の場合: エラー表示（既存動作）

---

## 完了後

```bash
git add -A
git commit -m "feat(T-040-11): Add Read More toggle for articles section"
git push origin feature/kesson-articles
```

---

**この指示書に基づき実装・コミットすること。**
