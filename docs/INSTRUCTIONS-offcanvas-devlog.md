# Claude Code 指示書: Offcanvas + 無限スクロール実装

## 概要

Devlog ギャラリーを Offcanvas + 無限スクロール方式に変更する。

## ワークツリー

```
/Users/uminomae/Documents/GitHub/kesson-space-claudeDT
ブランチ: feature/devlog-content
```

**mainにマージしないこと。DT用ワークツリーで作業。**

---

## 現状

- 3件のカード表示
- Read More ボタンで追加カード展開（不自然なアニメーション）
- 将来的にセッション数が無限に増加

## 目標

```
[Three.js + 3件カード] 
        ↓ Read More クリック
[Three.js 15%] + [Offcanvas 85%: 全セッション一覧]
        ↓ スクロール
[無限スクロールで追加読み込み]
        ↓ × クリック or 背景クリック
[Three.js + 3件カード に戻る]
```

---

## タスク

### 1. index.html: Offcanvas HTML追加

```html
<!-- Bootstrap Offcanvas（右からスライドイン） -->
<div class="offcanvas offcanvas-end" 
     tabindex="-1" 
     id="devlogOffcanvas"
     data-bs-backdrop="true"
     style="width: 85%; background: rgba(10, 14, 26, 0.98);">
  <div class="offcanvas-header border-bottom border-secondary">
    <div>
      <h5 class="text-light mb-0" style="letter-spacing: 0.15em;">DEVLOG</h5>
      <small class="text-muted" id="offcanvas-session-count"></small>
    </div>
    <button type="button" class="btn-close btn-close-white" 
            data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body p-0" id="offcanvas-gallery">
    <!-- 動的にカード生成 -->
  </div>
</div>
```

### 2. index.html: 不要CSS削除

以下のCSSを削除：
```css
/* 削除対象 */
.devlog-card.expandable { ... }
.devlog-card.expandable.expanded { ... }
```

以下のCSSを追加（Offcanvas用）：
```css
/* Offcanvas内カードスタイル */
#offcanvas-gallery .card {
  background: rgba(20, 25, 40, 0.9);
  border: 1px solid rgba(100, 150, 255, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
#offcanvas-gallery .card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 150, 255, 0.15);
}

/* 無限スクロールローディング */
#offcanvas-loading {
  text-align: center;
  padding: 20px;
  color: rgba(180, 200, 230, 0.5);
}
```

### 3. devlog.js: 大幅リファクタリング

#### 3.1 状態管理

```javascript
let galleryState = {
  sessions: [],           // 全セッションデータ
  displayedCount: 0,      // 表示済み件数
  batchSize: 10,          // 1回の読み込み件数
  isLoading: false,       // 読み込み中フラグ
  offcanvas: null         // Bootstrap Offcanvasインスタンス
};
```

#### 3.2 Read More → Offcanvas開く

```javascript
function openOffcanvas() {
  const offcanvasEl = document.getElementById('devlogOffcanvas');
  if (!galleryState.offcanvas) {
    galleryState.offcanvas = new bootstrap.Offcanvas(offcanvasEl);
  }
  
  // 初期表示
  galleryState.displayedCount = 0;
  document.getElementById('offcanvas-gallery').innerHTML = '';
  loadMoreSessions();
  
  galleryState.offcanvas.show();
}
```

#### 3.3 無限スクロール

```javascript
function setupInfiniteScroll() {
  const container = document.getElementById('offcanvas-gallery');
  container.addEventListener('scroll', () => {
    if (galleryState.isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMoreSessions();
    }
  });
}

function loadMoreSessions() {
  if (galleryState.isLoading) return;
  if (galleryState.displayedCount >= galleryState.sessions.length) return;
  
  galleryState.isLoading = true;
  showLoading();
  
  const start = galleryState.displayedCount;
  const end = Math.min(start + galleryState.batchSize, galleryState.sessions.length);
  const batch = galleryState.sessions.slice(start, end);
  
  renderSessionCards(batch);
  galleryState.displayedCount = end;
  
  hideLoading();
  galleryState.isLoading = false;
  
  updateSessionCount();
}
```

#### 3.4 カード生成（Offcanvas用）

```javascript
function renderSessionCards(sessions) {
  const container = document.getElementById('offcanvas-gallery');
  const row = container.querySelector('.row') || createRow();
  
  sessions.forEach(session => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4 p-3';
    col.innerHTML = createCardHTML(session);
    col.querySelector('.card').addEventListener('click', () => showDetail(session));
    row.appendChild(col);
  });
}

function createRow() {
  const container = document.getElementById('offcanvas-gallery');
  const row = document.createElement('div');
  row.className = 'row g-3 p-3';
  container.appendChild(row);
  return row;
}
```

### 4. animations.js: 簡略化または削除

Offcanvas はBootstrapが自動でアニメーションするため、`slideInCards` / `slideOutCards` は不要。

### 5. toggle-buttons.js: 修正

```javascript
export function createReadMoreButton(onClick) {
  const btn = document.createElement('button');
  btn.className = 'btn-read-more';
  btn.textContent = 'Read More';
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', onClick);  // → openOffcanvas を呼ぶ
  return btn;
}

// Show Less ボタンは不要（削除）
```

---

## 品質ルール

- **Bootstrap優先**: カスタムCSSは最小限
- **既存モーダル維持**: セッション詳細表示は現行のBootstrap Modalを継続使用
- **Three.js共存**: Offcanvas開閉時にThree.jsを停止しない

---

## テスト項目

1. Read More クリック → Offcanvas が右からスライドイン
2. Three.js が左15%に見える状態でOffcanvas表示
3. スクロールで追加セッション読み込み（10件ずつ）
4. カードクリック → 詳細モーダル表示
5. × ボタン or 背景クリック → Offcanvas閉じる
6. モバイルでも正常動作（Offcanvas幅100%でもOK）

---

## 完了条件

- [ ] Offcanvas HTML追加
- [ ] 不要CSS削除、新規CSS追加
- [ ] devlog.js リファクタリング
- [ ] 無限スクロール動作確認
- [ ] animations.js 整理
- [ ] toggle-buttons.js 修正
- [ ] ブラウザテスト（デスクトップ・モバイル）

---

## 注意

- **mainにマージしない**
- コミットは機能単位で細かく
- 日本語文章作成はClaudeが担当（Codexはコーディングのみ）
