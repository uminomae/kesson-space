# Claude Code 指示書：Articles Read More → Offcanvas 方式

**タスクID**: T-040-11  
**親タスク**: T-040  
**作成日**: 2026-02-16  
**ブランチ**: `feature/kesson-articles`  
**作成者**: DT（Claude.ai）

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

Articles セクション（index.html 内）の Read More を **Offcanvas 方式** で実装する。  
devlog の Offcanvas パターンを踏襲し、ボタンクリックで右からスライドインする記事一覧を表示する。

### 現状

```
[Articles]
 3 / 5 articles
 [card] [card] [card]     ← 最新3件のみ表示
                           ← 残りは見えない
```

### 完成形

```
[Articles]
 3 / 5 articles
 [card] [card] [card]     ← 最新3件（変更なし）
 [ ▸ Read More (2) ]      ← ボタン

↓ クリック

┌─────────────────────┐
│  ARTICLES        ✕  │  ← Offcanvas（右からスライドイン）
│  5 articles         │
│─────────────────────│
│  [card]             │  ← 全記事を縦一列で表示
│  [card]             │
│  [card]             │
│  [card]             │
│  [card]             │
└─────────────────────┘
```

---

## 📝 実装仕様

### 変更対象

`index.html` のみ。

### 1. HTML: Articles 用 Offcanvas を追加

既存の devlog Offcanvas (`#devlogOffcanvas`) の **直後** に配置する。

```html
<!-- Articles Offcanvas（右からスライドイン） -->
<div class="offcanvas offcanvas-end"
     tabindex="-1"
     id="articlesOffcanvas"
     data-bs-backdrop="true"
     style="width: 85%; background: rgba(10, 14, 26, 0.98);">
  <div class="offcanvas-header border-bottom border-secondary">
    <div>
      <h5 class="text-light mb-0" style="letter-spacing: 0.15em;">ARTICLES</h5>
      <small class="text-muted" id="offcanvas-articles-count"></small>
    </div>
    <button type="button" class="btn-close btn-close-white"
            data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body p-3">
    <div id="offcanvas-articles-grid" class="row g-3"></div>
  </div>
</div>
```

### 2. CSS: Offcanvas 内カードスタイル

既存の `#offcanvas-gallery .card` と同じパターン。以下を `<style>` に追加：

```css
/* Articles Offcanvas内カードスタイル */
#offcanvas-articles-grid .card {
  background: rgba(20, 25, 40, 0.9);
  border: 1px solid rgba(100, 150, 255, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
#offcanvas-articles-grid .card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 150, 255, 0.15);
}
```

### 3. JavaScript: loadArticles() を修正

現在の `loadArticles()` 関数（末尾の `<script type="module">` ブロック）を以下に置き換え：

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
  function createCard(item, layout) {
    const col = document.createElement('div');
    // Offcanvas内: 1列表示、メイングリッド: 3列
    col.className = layout === 'offcanvas'
      ? 'col-12 mb-3'
      : 'col-12 col-md-6 col-lg-4 mb-3';

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

  // --- メイングリッド: 最新 N 件 ---
  const initialItems = articles.slice(0, INITIAL_DISPLAY);
  initialItems.forEach(item => grid.appendChild(createCard(item, 'grid')));
  countEl.textContent = initialItems.length + ' / ' + articles.length + ' articles';

  // --- Read More ボタン（残りがある場合のみ） ---
  const remaining = articles.length - INITIAL_DISPLAY;
  if (remaining > 0) {
    const btnContainer = document.createElement('div');
    btnContainer.className = 'text-center mt-3';

    const btn = document.createElement('button');
    btn.className = 'btn-read-more';
    btn.setAttribute('data-bs-toggle', 'offcanvas');
    btn.setAttribute('data-bs-target', '#articlesOffcanvas');
    btn.setAttribute('aria-controls', 'articlesOffcanvas');
    btn.textContent = '▸ Read More (' + remaining + ')';

    btnContainer.appendChild(btn);
    grid.parentNode.insertBefore(btnContainer, grid.nextSibling);
  }

  // --- Offcanvas: 全記事を表示 ---
  const offcanvasGrid = document.getElementById('offcanvas-articles-grid');
  const offcanvasCount = document.getElementById('offcanvas-articles-count');
  if (offcanvasGrid) {
    articles.forEach(item => offcanvasGrid.appendChild(createCard(item, 'offcanvas')));
  }
  if (offcanvasCount) {
    offcanvasCount.textContent = articles.length + ' articles';
  }
})();
```

### 変更のポイント

1. `createCard()` に `layout` 引数を追加（`'grid'` or `'offcanvas'`）
2. Read More ボタンは `data-bs-toggle="offcanvas"` で Bootstrap 標準連携
3. Offcanvas 内には **全記事** を縦1列で表示（`col-12`）
4. 既存の `.btn-read-more` CSS をそのまま活用

---

## ✅ チェックリスト

### 必須

- [ ] 初期表示は最新3件のまま（既存動作を壊さない）
- [ ] 「▸ Read More (N)」ボタンがカードの下に表示される
- [ ] ボタンクリックで Offcanvas が右からスライドインする
- [ ] Offcanvas 内に全記事が縦一列で表示される
- [ ] Offcanvas ヘッダーに記事総数が表示される
- [ ] ✕ボタンまたは背景クリックで Offcanvas が閉じる
- [ ] カードクリックで記事ページが新タブで開く
- [ ] 記事が3件以下の場合: Read More ボタンが表示されない
- [ ] 記事が0件の場合: エラー表示（既存動作維持）
- [ ] コンソールエラーなし

### アクセシビリティ

- [ ] `aria-controls` が正しく設定されている
- [ ] キーボード（Tab → Enter）でボタン操作可能
- [ ] Offcanvas 内のフォーカストラップが動作する（Bootstrap 標準）
- [ ] Esc キーで Offcanvas が閉じる

### 視覚

- [ ] Offcanvas の背景色が既存の devlog Offcanvas と統一されている
- [ ] カードのホバーエフェクトが Offcanvas 内でも動作する

---

## 完了後

```bash
git add -A
git commit -m "feat(T-040-11): Add Read More with Offcanvas for articles section"
git push origin feature/kesson-articles
```

---

**この指示書に基づき実装・コミットすること。**
