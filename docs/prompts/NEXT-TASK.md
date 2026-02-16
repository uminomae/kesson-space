# Claude Code 指示書：Articles Read More → Offcanvas 方式

**タスクID**: T-040-11
**親タスク**: T-040
**作成日**: 2026-02-16
**ブランチ**: `feature/kesson-articles`
**作成者**: DT（Claude.ai）

---

## 制約

- **この指示書の内容のみ実行すること**
- `claude/*` ブランチを作成しない。下記のブランチで作業すること
- コミットは自律的に実行（DT 承認不要）

---

## 前提手順

```bash
git fetch origin
git checkout feature/kesson-articles
git pull origin feature/kesson-articles
```

ブランチが存在しない場合は作業を中止して報告すること。

---

## ミッション

Articles セクション（`index.html` 内）に Read More 機能を **Offcanvas 方式** で追加する。
devlog の Offcanvas パターン（`#devlogOffcanvas`）を踏襲する。

### 現状（feature/kesson-articles ブランチ）

- `loadArticles()` が `MAX_DISPLAY = 3` 件だけをカード表示
- 残りの記事を閲覧する手段がない
- `.btn-read-more` CSS は定義済み（devlog側で使用中）

### 完成形

```
[Articles]
 3 / 5 articles
 [card] [card] [card]
 [ ▸ Read More (2) ]    ← 3件を超える場合のみ表示

↓ ボタンクリック

┌────────────────────────┐
│  ARTICLES           ✕  │  右からスライドイン、幅85%
│  5 articles            │
│────────────────────────│
│  [card 全幅]           │  全記事を col-12 で縦一列
│  [card 全幅]           │
│  [card 全幅]           │
│  [card 全幅]           │
│  [card 全幅]           │
└────────────────────────┘
```

---

## 変更対象

**`index.html` のみ。** 他ファイルは変更しない。

---

## 実装手順

### 手順1: HTML — Articles用Offcanvasを追加

既存の `#devlogOffcanvas` の **閉じタグの直後** に以下を挿入する。

```html
<!-- Articles Offcanvas -->
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

### 手順2: CSS — Offcanvas内カードスタイルを追加

`<style>` 内の既存 `#offcanvas-gallery .card` ブロックの直後に追加する。

```css
/* Articles Offcanvas cards */
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

### 手順3: JavaScript — loadArticles() を置き換え

末尾の `<script type="module">` 内にある `loadArticles()` IIFE を **まるごと** 以下に置き換える。

変更点:
- `createCard(item, layout)` 関数を抽出（`'grid'` or `'offcanvas'` で列幅を切替）
- Read More ボタンを動的生成（Bootstrap `data-bs-toggle="offcanvas"` 連携）
- Offcanvas に全記事を投入

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

  // --- fetch ---
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

  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  // --- card factory ---
  function createCard(item, layout) {
    const col = document.createElement('div');
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

  // --- main grid: latest N ---
  const initialItems = articles.slice(0, INITIAL_DISPLAY);
  initialItems.forEach(item => grid.appendChild(createCard(item, 'grid')));
  countEl.textContent = initialItems.length + ' / ' + articles.length + ' articles';

  // --- Read More button ---
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

  // --- Offcanvas: all articles ---
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

---

## チェックリスト

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
- [ ] Esc キーで Offcanvas が閉じる

### 視覚

- [ ] Offcanvas の背景色が devlog Offcanvas と統一（rgba(10, 14, 26, 0.98)）
- [ ] カードのホバーエフェクトが Offcanvas 内でも動作する

---

## 完了後

```bash
git add -A
git commit -m "feat(T-040-11): Add Articles Read More with Offcanvas"
git push origin feature/kesson-articles
```

**この指示書に基づき実装・コミットすること。**
