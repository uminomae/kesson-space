# TASK: Devlog Read More UI 実装

**作成日**: 2026-02-15  
**タスクID**: T-033  
**優先度**: P1  
**担当**: Codex（並列実行）  
**レビュー**: Claude Code  
**承認**: DT  

---

## 📋 概要

devlogが4件以上の場合に"Read More"ボタンを表示し、クリックで右スライドアニメーションと共に全件表示する。
**展開後は左上固定の"Show Less"ボタンでいつでも折りたたみ可能。**

---

## 🎯 UI仕様

### ボタン配置戦略

#### 1. Read More（グリッド下部、通常フロー）
- 初期表示時のみ表示（4件以上の場合）
- クリックで展開 → 非表示に切り替え
- 配置: `#devlog-gallery-container` 内末尾

#### 2. Show Less（左上固定、`position: fixed`）
- 展開時のみ表示
- `#devlog-gallery-header` 内に配置（h2/countの下）
- **スクロール中も常に表示されたまま**
- クリックで折りたたみ → 非表示に切り替え

### 状態遷移フロー

```
[初期状態: 3件表示]
├─ Read More: 表示（グリッド下部）
└─ Show Less: 非表示

    ↓ Read More クリック

[展開状態: 全件表示]
├─ Read More: 非表示
├─ Show Less: 表示（左上固定）
└─ カード4件目以降: 右スライドイン

    ↓ Show Less クリック

[初期状態に戻る]
├─ カード4件目以降: 右スライドアウト
├─ Show Less: 非表示
├─ Read More: 表示
└─ スクロール位置: ギャラリー先頭
```

### アニメーション仕様

- **展開**: カード4件目以降が右からスライドイン（`translateX(100%) → 0`）
- **折りたたみ**: カード4件目以降が右へスライドアウト（`translateX(0) → 100%`）
- **duration**: 400ms
- **easing**: `cubic-bezier(0.4, 0, 0.2, 1)`（Material Design）
- **delay**: 各カード50ms遅延でstagger効果

---

## 🛠️ 技術仕様

### ファイル構成

```
src/devlog/
├── devlog.js           # [MODIFY] 初期化・状態管理
├── grid.js             # [MODIFY] グリッド構築・表示制御
├── card.js             # [NO CHANGE] カード生成
├── toggle-buttons.js   # [NEW] 2つのボタン生成
└── animations.js       # [NEW] スライドアニメーション
```

### DOM構造

```html
<!-- 左上固定ヘッダー -->
<div id="devlog-gallery-header" style="position: fixed;">
  <h2>devlog</h2>
  <div class="count" id="gallery-session-count">3 sessions</div>
  
  <!-- Show Lessボタン（展開時のみ表示、固定配置） -->
  <button id="show-less-btn" class="btn-show-less d-none" 
          aria-label="Collapse devlog list"
          aria-expanded="true">
    <span>← Show Less</span>
  </button>
</div>

<!-- グリッド -->
<div id="devlog-gallery-container">
  <div class="container px-4">
    <div class="row g-4" id="devlog-grid">
      <!-- 1-3件目: 常に表示 -->
      <div class="col-12 col-md-6 col-lg-4 devlog-card visible">
        <!-- カード内容 -->
      </div>
      
      <!-- 4件目以降: 初期非表示、アニメーション対象 -->
      <div class="col-12 col-md-6 col-lg-4 devlog-card expandable">
        <!-- カード内容 -->
      </div>
    </div>
    
    <!-- Read Moreボタン（グリッド下部、4件以上で表示） -->
    <div class="text-center mt-4" id="read-more-container">
      <button id="read-more-btn" class="btn-read-more"
              aria-label="Show all devlog sessions"
              aria-expanded="false">
        <span>Read More →</span>
      </button>
    </div>
  </div>
</div>
```

### CSS仕様

```css
/* 左上固定ヘッダー（position変更） */
#devlog-gallery-header {
  position: fixed;  /* absolute → fixed に変更 */
  top: 20px;
  left: 24px;
  z-index: 20;
  pointer-events: none;
}

/* Show Lessボタン */
.btn-show-less {
  margin-top: 12px;
  pointer-events: auto;
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.2);
  color: rgba(180, 200, 230, 0.5);
  font-family: 'Georgia', serif;
  font-size: clamp(0.45rem, 2.0vmin, 0.65rem);
  letter-spacing: 0.08em;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.3s ease, color 0.3s ease;
}

.btn-show-less:hover {
  background: rgba(100, 150, 255, 0.2);
  color: rgba(220, 230, 245, 0.7);
}

.btn-show-less:focus {
  outline: 2px solid rgba(100, 150, 255, 0.8);
  outline-offset: 4px;
}

/* Read Moreボタン */
.btn-read-more {
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.2);
  color: rgba(180, 200, 230, 0.5);
  font-family: 'Georgia', serif;
  font-size: clamp(0.5rem, 2.2vmin, 0.7rem);
  letter-spacing: 0.1em;
  padding: 10px 24px;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.3s ease, color 0.3s ease;
}

.btn-read-more:hover {
  background: rgba(100, 150, 255, 0.2);
  color: rgba(220, 230, 245, 0.7);
}

.btn-read-more:focus {
  outline: 2px solid rgba(100, 150, 255, 0.8);
  outline-offset: 4px;
}

/* 展開可能カード（初期状態） */
.devlog-card.expandable {
  max-height: 0;
  opacity: 0;
  transform: translateX(100%);
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 展開状態 */
.devlog-card.expandable.expanded {
  max-height: 800px;
  opacity: 1;
  transform: translateX(0);
}
```

---

## 📦 タスク分割

### Codex-1: アニメーション基盤

**ファイル**: 
- `src/devlog/animations.js`（新規作成）
- `src/devlog/toggle-buttons.js`（新規作成）

**要件**:

#### `animations.js`
```javascript
/**
 * カードをスライドインさせる
 * @param {NodeList} cards - 展開対象のカード要素群
 * @param {number} staggerDelay - カード間の遅延（ms）
 * @returns {Promise<void>}
 */
export async function slideInCards(cards, staggerDelay = 50) {
  // 各カードに .expanded クラスを順次追加
  // stagger効果のためsetTimeout使用
  // 全アニメーション完了をPromiseで通知
}

/**
 * カードをスライドアウトさせる
 * @param {NodeList} cards - 折りたたみ対象のカード要素群
 * @returns {Promise<void>}
 */
export async function slideOutCards(cards) {
  // .expanded クラスを削除
  // transitionend イベントを待機
}
```

#### `toggle-buttons.js`
```javascript
/**
 * Read Moreボタンを生成
 * @param {Function} onExpand - 展開時のコールバック
 * @returns {HTMLElement} - ボタン要素
 */
export function createReadMoreButton(onExpand) {
  // button#read-more-btn を生成
  // aria-label, aria-expanded 設定
  // click イベントリスナー追加
  // return button;
}

/**
 * Show Lessボタンを生成
 * @param {Function} onCollapse - 折りたたみ時のコールバック
 * @returns {HTMLElement} - ボタン要素
 */
export function createShowLessButton(onCollapse) {
  // button#show-less-btn を生成
  // aria-label, aria-expanded 設定
  // click イベントリスナー追加
  // return button;
}
```

**出力確認**:
- [ ] `animations.js`: export された2関数が動作
- [ ] `toggle-buttons.js`: export された2関数がボタンDOM返却

---

### Codex-2: 既存ファイル修正

**ファイル**: 
- `src/devlog/grid.js`
- `src/devlog/devlog.js`

**要件**:

#### `grid.js` 修正内容

```javascript
// buildGallery() 関数内で以下を追加:

sessions.forEach((session, index) => {
  const col = document.createElement('div');
  col.className = 'col-12 col-md-6 col-lg-4 p-2';
  
  // カードクラス分類
  if (index < 3) {
    col.classList.add('devlog-card', 'visible');
  } else {
    col.classList.add('devlog-card', 'expandable');
  }
  
  // カード生成処理（既存コード）
  // ...
});
```

#### `devlog.js` 修正内容

1. **import追加**:
```javascript
import { slideInCards, slideOutCards } from './animations.js';
import { createReadMoreButton, createShowLessButton } from './toggle-buttons.js';
```

2. **状態管理追加**:
```javascript
let galleryState = {
  isExpanded: false,
  totalSessions: 0
};
```

3. **buildGallery()末尾に追加**:
```javascript
// 4件以上の場合のみボタン表示
if (sessions.length > 3) {
  galleryState.totalSessions = sessions.length;
  
  // Read Moreボタン生成・マウント
  const readMoreContainer = document.createElement('div');
  readMoreContainer.className = 'text-center mt-4';
  readMoreContainer.id = 'read-more-container';
  const readMoreBtn = createReadMoreButton(expandGallery);
  readMoreContainer.appendChild(readMoreBtn);
  galleryContainer.appendChild(readMoreContainer);
  
  // Show Lessボタン生成・マウント（ヘッダー内）
  const headerEl = document.getElementById('devlog-gallery-header');
  const showLessBtn = createShowLessButton(collapseGallery);
  showLessBtn.classList.add('d-none'); // 初期非表示
  headerEl.appendChild(showLessBtn);
}
```

4. **展開/折りたたみ関数追加**:
```javascript
async function expandGallery() {
  const expandableCards = document.querySelectorAll('.devlog-card.expandable');
  
  // 1. カードをスライドイン
  await slideInCards(expandableCards);
  
  // 2. Read Moreボタン非表示
  document.getElementById('read-more-container').classList.add('d-none');
  
  // 3. Show Lessボタン表示
  document.getElementById('show-less-btn').classList.remove('d-none');
  document.getElementById('show-less-btn').setAttribute('aria-expanded', 'true');
  
  // 4. カウント更新
  const countEl = document.getElementById('gallery-session-count');
  if (countEl) {
    countEl.textContent = `${galleryState.totalSessions} sessions`;
  }
  
  galleryState.isExpanded = true;
}

async function collapseGallery() {
  const expandableCards = document.querySelectorAll('.devlog-card.expandable');
  
  // 1. カードをスライドアウト
  await slideOutCards(expandableCards);
  
  // 2. Show Lessボタン非表示
  document.getElementById('show-less-btn').classList.add('d-none');
  document.getElementById('show-less-btn').setAttribute('aria-expanded', 'false');
  
  // 3. Read Moreボタン表示
  document.getElementById('read-more-container').classList.remove('d-none');
  
  // 4. カウント更新
  const countEl = document.getElementById('gallery-session-count');
  if (countEl) {
    countEl.textContent = '3 sessions';
  }
  
  // 5. ギャラリー先頭にスクロール
  const gallerySection = document.getElementById('devlog-gallery-section');
  if (gallerySection) {
    gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  galleryState.isExpanded = false;
}
```

**出力確認**:
- [ ] `grid.js`: カードに .visible / .expandable クラス付与
- [ ] `devlog.js`: 状態管理・ボタン初期化・展開/折りたたみ動作

---

### Codex-3: HTML/CSS修正

**ファイル**: `index.html`

**要件**:

1. **`#devlog-gallery-header` スタイル修正**:
```css
#devlog-gallery-header {
  position: fixed;  /* absolute → fixed */
  top: 20px;
  left: 24px;
  z-index: 20;
  pointer-events: none;
}
```

2. **ボタンスタイル追加**（`/* Devlog Gallery */` セクション内）:
```css
/* Show Lessボタン */
.btn-show-less {
  margin-top: 12px;
  pointer-events: auto;
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.2);
  color: rgba(180, 200, 230, 0.5);
  font-family: 'Georgia', serif;
  font-size: clamp(0.45rem, 2.0vmin, 0.65rem);
  letter-spacing: 0.08em;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.3s ease, color 0.3s ease;
}

.btn-show-less:hover {
  background: rgba(100, 150, 255, 0.2);
  color: rgba(220, 230, 245, 0.7);
}

.btn-show-less:focus {
  outline: 2px solid rgba(100, 150, 255, 0.8);
  outline-offset: 4px;
}

/* Read Moreボタン */
.btn-read-more {
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.2);
  color: rgba(180, 200, 230, 0.5);
  font-family: 'Georgia', serif;
  font-size: clamp(0.5rem, 2.2vmin, 0.7rem);
  letter-spacing: 0.1em;
  padding: 10px 24px;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.3s ease, color 0.3s ease;
}

.btn-read-more:hover {
  background: rgba(100, 150, 255, 0.2);
  color: rgba(220, 230, 245, 0.7);
}

.btn-read-more:focus {
  outline: 2px solid rgba(100, 150, 255, 0.8);
  outline-offset: 4px;
}

/* 展開可能カード */
.devlog-card.expandable {
  max-height: 0;
  opacity: 0;
  transform: translateX(100%);
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.devlog-card.expandable.expanded {
  max-height: 800px;
  opacity: 1;
  transform: translateX(0);
}
```

**出力確認**:
- [ ] `position: fixed` 適用済み
- [ ] 全スタイル定義済み
- [ ] スクロールテストで固定位置確認

---

## ✅ 検証基準

### 機能テスト
- [ ] **3件表示時**: Read More非表示、Show Less非表示
- [ ] **4件以上初期表示**: Read More表示（グリッド下部）、Show Less非表示
- [ ] **展開クリック**: 
  - [ ] 4件目以降が右からスライドイン（400ms）
  - [ ] Read More非表示に切り替わる
  - [ ] Show Less表示に切り替わる（左上固定）
  - [ ] カウント更新（`6 sessions` など）
- [ ] **スクロール中のShow Less固定**:
  - [ ] ページを下にスクロールしても左上に固定表示
  - [ ] z-index正常（他要素に隠れない）
- [ ] **Show Lessクリック**:
  - [ ] 4件目以降が右へスライドアウト（400ms）
  - [ ] Show Less非表示に切り替わる
  - [ ] Read More表示に切り替わる
  - [ ] カウント更新（`3 sessions`）
  - [ ] **ギャラリー先頭にスムーズスクロール**

### アクセシビリティ
- [ ] Read Moreボタン: `aria-label`, `aria-expanded="false"`
- [ ] Show Lessボタン: `aria-label`, `aria-expanded="true"`
- [ ] キーボード操作可能（Tab/Enter）
- [ ] フォーカス可視化（:focus outline）

### レスポンシブ
- [ ] モバイル（縦）: ボタン位置・サイズ適切
- [ ] モバイル（横）: Show Less固定位置確認
- [ ] タブレット: グリッド3列表示確認
- [ ] デスクトップ: 全体レイアウト確認

### パフォーマンス
- [ ] アニメーション60fps維持
- [ ] スクロールパフォーマンス影響なし
- [ ] メモリリークなし（DevTools確認）

---

## 📂 ワークツリー構成

```
main                        → 本番環境（GitHub Pages）
  ↑
feature/devlog-readmore    → 今回の実装ブランチ
  ├── /kesson-codex        → Codex作業ディレクトリ
  └── /kesson-claudeCode   → Claude Code統合ディレクトリ
```

---

## 🔗 参照

- **元計画**: `/kesson-space/docs/CURRENT.md` セッション#27
- **技術スタック**: Bootstrap 5.3.3, CSS transitions
- **固定配置**: `position: fixed` for Show Less button
- **スクロール動作**: `scrollIntoView({ behavior: 'smooth' })`
- **ARIA仕様**: [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

---

## 📝 実装メモ

### 実装順序
1. Codex-1 → 基盤ファイル作成（animations.js, toggle-buttons.js）
2. Codex-2 → 既存ファイル修正（grid.js, devlog.js）
3. Codex-3 → スタイル追加（index.html）
4. Claude Code → 統合テスト・レビュー
5. DT → 最終承認・mainマージ

### 注意点
- `position: fixed` はスクロール対象外になるため、Show Lessボタンは常に可視
- `max-height` トランジションは正確な高さ計算不要（十分大きい値で対応）
- stagger効果は50ms遅延で自然な連続アニメーション
- `scrollIntoView` はモバイルSafariで挙動確認必須
