# T-040-12 指示書: セクション名統一 + Bootstrap標準カード化

## タスク概要

devlog/articlesの両セクションで、セクション名の混乱を解消し、カードをBootstrap標準クラス中心のクリーンな実装にリファクタリングする。

---

## 出力先

📁 ワークツリー: kesson-claudeCode
📂 パス: /Users/uminomae/Documents/GitHub/kesson-claudeCode
🌿 ブランチ: `claude/t040-12-bootstrap-cards`（新規作成、feature/devから分岐）

## 🔴 ブランチ同期（必須 — 作業開始前に実行）

```bash
cd /Users/uminomae/Documents/GitHub/kesson-claudeCode
git fetch origin
git checkout -b claude/t040-12-bootstrap-cards origin/claude/articles-read-more-offcanvas-Ddbu0
```

**注意**: fix3の実装（`fa37c3c`）をベースにすること。

---

## 対象ファイル

1. `index.html` — HTML構造 + `<style>` + インラインarticlesスクリプト
2. `src/devlog/devlog.js` — devlogカード生成ロジック

---

## 変更内容

### Phase 1: セクション名統一

**目的**: devlogセクションの名前を「TRACES」に統一する。

#### index.html

1. Offcanvas header の `<h5>` を変更:
   ```html
   <!-- 変更前 -->
   <h5 class="text-light mb-0" style="letter-spacing: 0.15em;">DEVLOG</h5>
   <!-- 変更後 -->
   <h5 class="text-light mb-0" style="letter-spacing: 0.15em;">TRACES</h5>
   ```

---

### Phase 2: 共通カードCSS定義

**目的**: 4箇所に散らばったカードスタイルを1つの共通CSSクラスに集約する。

#### index.html `<style>` に追加

以下を追加（既存の `#offcanvas-gallery .card` と `#offcanvas-articles-grid .card` を**削除して置き換え**）:

```css
/* === 共通カード === */
.kesson-card {
  background: rgba(20, 25, 40, 0.9);
  border: 1px solid rgba(100, 150, 255, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
.kesson-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 150, 255, 0.15);
}
.kesson-card .card-img-top {
  aspect-ratio: 16/9;
  object-fit: cover;
}
```

**削除対象**（index.html `<style>` 内）:
```css
/* 以下を削除 */
#offcanvas-gallery .card { ... }
#offcanvas-gallery .card:hover { ... }
#offcanvas-articles-grid .card { ... }
#offcanvas-articles-grid .card:hover { ... }
```

---

### Phase 3: devlog.js カードリファクタリング

**目的**: JSインラインスタイルをBootstrapクラス + `.kesson-card` に置換する。

#### `createCardElement` 関数の書き換え

**変更前**のパターン:
- `card.className = 'card bg-dark border-0 overflow-hidden h-100'`
- `img.style.aspectRatio = '16/9'` / `img.style.objectFit = 'cover'`
- `bar` に全てインラインCSS
- `card.addEventListener('mouseenter/mouseleave')` でhover

**変更後**:
```javascript
function createCardElement(session, lang) {
  const card = document.createElement('div');
  card.className = 'card kesson-card h-100';

  const img = document.createElement('img');
  img.className = 'card-img-top';
  img.src = session.cover;
  img.alt = session.title_ja;
  img.onerror = () => {
    img.onerror = null;
    img.src = './assets/devlog/covers/default.svg';
  };

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const title = document.createElement('h6');
  title.className = 'card-title text-light mb-1';
  title.style.fontSize = '0.85rem';
  title.textContent = lang === 'en' ? session.title_en : session.title_ja;

  const date = document.createElement('small');
  date.className = 'text-muted';
  date.textContent = session.date_range;

  cardBody.appendChild(title);
  cardBody.appendChild(date);
  card.appendChild(img);
  card.appendChild(cardBody);

  // hover は CSS .kesson-card:hover で処理 — JSイベントリスナー不要

  card.addEventListener('click', () => {
    window.location.href = `./devlog.html?id=${session.id}`;
  });

  return card;
}
```

**ポイント**:
- `bg-dark border-0` → `.kesson-card` が担当
- `overflow-hidden` → `.kesson-card` のborderがあるので不要
- インラインの `bar` div → Bootstrap `.card-body` に置換
- `backdrop-filter` → 削除（Bootstrap標準にない）
- JS hover listener → 削除（CSS `.kesson-card:hover` に統一）

#### `buildGallery` 関数

row変更:
```javascript
// 変更前
row.className = 'row g-4 justify-content-center';
// 変更後
row.className = 'row g-3';
```

col変更:
```javascript
// 変更前
col.className = 'col-12 col-md-6 col-lg-4 p-2 devlog-card visible';
// 変更後
col.className = 'col-12 col-md-6 col-lg-4';
```

#### `renderSessionCards` 関数（Offcanvas内）

col変更:
```javascript
// 変更前
col.className = 'col-12 col-md-6 col-lg-4 p-3';
// 変更後
col.className = 'col-12 col-md-6 col-lg-4';
```

---

### Phase 4: articles カードリファクタリング

**目的**: インラインスタイルをBootstrapクラス + `.kesson-card` に置換する。

#### index.html 内の `createCard` 関数

**変更後**:
```javascript
function createCard(item, layout) {
  const col = document.createElement('div');
  col.className = 'col-12 col-md-6 col-lg-4';

  const dateStr = item.date
    ? new Date(item.date).toLocaleDateString('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      })
    : '';

  const teaserHtml = item.teaser
    ? `<img src="${item.teaser}" class="card-img-top" alt=""
           onerror="this.style.display='none'">`
    : '';

  const excerptHtml = item.excerpt
    ? `<p class="card-text small text-muted">${item.excerpt}</p>`
    : '';

  col.innerHTML = `
    <a href="${item.url}" target="_blank" rel="noopener"
       class="text-decoration-none"
       aria-label="${item.title} を読む">
      <div class="card kesson-card h-100">
        ${teaserHtml}
        <div class="card-body">
          <span class="badge bg-secondary mb-2" style="font-size:0.65rem;">
            ${item.type === 'page' ? 'page' : 'post'}
          </span>
          <h6 class="card-title text-light mb-1" style="font-size:0.85rem;">
            ${item.title}
          </h6>
          ${excerptHtml}
          <small class="text-muted">${dateStr}</small>
        </div>
      </div>
    </a>`;

  return col;
}
```

**変更ポイント**:
- `card h-100` → `card kesson-card h-100`
- `max-height:140px;object-fit:cover;` → 削除（`.kesson-card .card-img-top` のCSS aspect-ratio で統一）
- badge: inline style → `badge bg-secondary`
- title h6: inline color/fontSize → `text-light` + 最小fontSize
- excerpt: inline style → `text-muted small`（`card-text` 追加）
- date: inline style → `text-muted`

#### articles row（HTML内）

`<div id="articles-grid" class="row g-3">` → 変更なし（既に `row g-3`）

---

## 完了条件

- [ ] devlogセクション: inline h2 "TRACES" ✅（変更なし）
- [ ] devlog固定ヘッダ: "TRACES" ✅（変更なし）
- [ ] devlog Offcanvas h5: "TRACES"（DEVLOGから変更）
- [ ] articles セクション: "ARTICLES" ✅（変更なし）
- [ ] `.kesson-card` CSS定義が `<style>` 内に存在
- [ ] `#offcanvas-gallery .card` / `#offcanvas-articles-grid .card` の個別CSS削除済み
- [ ] devlog.js: JS hover listener 削除済み
- [ ] devlog.js: `bg-dark border-0` → `kesson-card` に置換済み
- [ ] devlog.js: row `g-4 justify-content-center` → `g-3` に統一
- [ ] articles: inline style最小化、`kesson-card` クラス適用済み
- [ ] 4箇所のカード（devlogメイン/Offcanvas、articlesメイン/Offcanvas）が同じ見た目

## コミット

```
refactor(T-040-12): Bootstrap標準カード化 + セクション名TRACES統一
```

## DT確認手順

```bash
cd /Users/uminomae/Documents/GitHub/kesson-space-claudeDT
git fetch origin
git checkout origin/claude/t040-12-bootstrap-cards
python3 -m http.server 3002
# → http://localhost:3002/
```

確認ポイント:
1. devlog/articles両方のカードが同じ見た目
2. hover効果が統一されている
3. devlog Offcanvas のタイトルが "TRACES"
4. カード内のテキスト色・フォントが統一
5. 3列グリッドが正しく折り返す
