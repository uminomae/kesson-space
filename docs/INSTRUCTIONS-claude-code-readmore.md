# Claude Code 監督指示書：Devlog Read More UI 実装

**タスクID**: T-033  
**作成日**: 2026-02-15  
**承認者**: DT  
**実装者**: Codex（並列実行）  
**監督者**: Claude Code（あなた）  

---

## 🎯 ミッション概要

devlog が4件以上になった際の UX 改善として、"Read More" スライド展開機能を実装する。

**重要な UX 要件**:
- 初期表示は3件のみ
- "Read More"クリックで右スライドアニメーション → 全件表示
- **展開後は左上固定の"Show Less"ボタンで折りたたみ可能**（スクロール中も常に表示）

---

## 📋 あなた（Claude Code）の役割

### 1. タスク分配
Codex に以下3つのサブタスクを並列実行させる：

- **Codex-1**: アニメーション基盤（animations.js, toggle-buttons.js）
- **Codex-2**: 既存ファイル修正（grid.js, devlog.js）
- **Codex-3**: HTML/CSS 修正（index.html）

### 2. 統合・検証
各 Codex タスク完了後：

- コード統合（feature/devlog-readmore ブランチ）
- ブラウザ動作確認（localhost:3001）
- アクセシビリティ検証
- モバイル・デスクトップレスポンシブ確認

### 3. DT への報告
完了後、以下フォーマットで報告：

```markdown
## T-033 実装完了報告

### 実装内容
- [x] Codex-1: animations.js, toggle-buttons.js 作成
- [x] Codex-2: grid.js, devlog.js 修正
- [x] Codex-3: index.html スタイル追加

### 動作確認
- [x] 3件表示時：ボタン非表示
- [x] 4件以上：Read More 表示
- [x] 展開：右スライドアニメーション
- [x] Show Less 固定表示（スクロール中）
- [x] 折りたたみ：逆アニメーション + スクロールトップ

### 懸念事項
（あれば記載）

### 次のアクション
DT による最終承認待ち
```

---

## 📂 実装詳細（Codex への指示用）

### 前提条件

- **ブランチ**: `feature/devlog-readmore`
- **ワークツリー**: `/kesson-codex`
- **参照**: `docs/TASK-readmore.md`（詳細仕様）

### Codex-1: アニメーション基盤

**新規ファイル**:
- `src/devlog/animations.js`
- `src/devlog/toggle-buttons.js`

**指示内容**:
```
TASK-readmore.md の「Codex-1」セクションを参照し、
以下2ファイルを作成してください：

1. animations.js
   - slideInCards(cards, staggerDelay) 関数
   - slideOutCards(cards) 関数
   - Promise-based アニメーション制御

2. toggle-buttons.js
   - createReadMoreButton(onExpand) 関数
   - createShowLessButton(onCollapse) 関数
   - ARIA 属性付与（aria-label, aria-expanded）

実装完了後、GitHub にコミット・プッシュしてください。
```

### Codex-2: 既存ファイル修正

**修正対象**:
- `src/devlog/grid.js`
- `src/devlog/devlog.js`

**指示内容**:
```
TASK-readmore.md の「Codex-2」セクションを参照し、
以下の修正を実施してください：

1. grid.js
   - buildGallery() 内でカード分類（.visible / .expandable）
   - 1-3件目: .visible
   - 4件目以降: .expandable

2. devlog.js
   - import 追加（animations.js, toggle-buttons.js）
   - galleryState 状態管理追加
   - buildGallery() 末尾にボタン生成ロジック追加
   - expandGallery(), collapseGallery() 関数追加

実装完了後、GitHub にコミット・プッシュしてください。
```

### Codex-3: HTML/CSS 修正

**修正対象**:
- `index.html`

**指示内容**:
```
TASK-readmore.md の「Codex-3」セクションを参照し、
以下の CSS を index.html の <style> タグ内に追加してください：

1. #devlog-gallery-header の position を fixed に変更
2. .btn-show-less スタイル定義
3. .btn-read-more スタイル定義
4. .devlog-card.expandable スタイル定義

配置場所: /* Devlog Gallery */ セクション内

実装完了後、GitHub にコミット・プッシュしてください。
```

---

## ✅ 統合テストチェックリスト

### 機能テスト

```bash
# ローカルサーバー起動
cd /kesson-space
./serve.sh
# → http://localhost:3001/
```

#### 初期表示（3件の場合）
- [ ] devlog ギャラリーにカード3件表示
- [ ] Read More ボタン**非表示**
- [ ] Show Less ボタン**非表示**

#### 初期表示（4件以上の場合）
- [ ] devlog ギャラリーにカード3件のみ表示
- [ ] 4件目以降は**非表示**（`max-height: 0; opacity: 0`）
- [ ] Read More ボタン**表示**（グリッド下部）
- [ ] Show Less ボタン**非表示**
- [ ] カウント表示「3 sessions」

#### 展開動作
- [ ] Read More クリック
- [ ] 4件目以降が右からスライドイン（400ms、stagger 50ms）
- [ ] Read More ボタン → **非表示**
- [ ] Show Less ボタン → **表示**（左上固定、h2/count の下）
- [ ] カウント更新「6 sessions」（全件数）

#### スクロール中の固定表示
- [ ] ページを下にスクロール
- [ ] Show Less ボタンが**左上に固定表示されたまま**
- [ ] z-index 正常（他要素に隠れない）

#### 折りたたみ動作
- [ ] Show Less クリック
- [ ] 4件目以降が右へスライドアウト（400ms）
- [ ] Show Less ボタン → **非表示**
- [ ] Read More ボタン → **表示**
- [ ] カウント更新「3 sessions」
- [ ] **ギャラリー先頭にスムーズスクロール**

### アクセシビリティテスト

- [ ] Read More ボタン
  - [ ] `aria-label="Show all devlog sessions"`
  - [ ] `aria-expanded="false"`（初期）
  - [ ] キーボード操作可能（Tab → Enter）
  - [ ] フォーカス可視化（:focus outline）

- [ ] Show Less ボタン
  - [ ] `aria-label="Collapse devlog list"`
  - [ ] `aria-expanded="true"`（展開時）
  - [ ] キーボード操作可能（Tab → Enter）
  - [ ] フォーカス可視化（:focus outline）

### レスポンシブテスト

#### モバイル（縦向き、375x667）
- [ ] カード1列表示
- [ ] Read More ボタンサイズ適切
- [ ] Show Less ボタン位置・サイズ適切（左上固定）
- [ ] スライドアニメーション滑らか

#### モバイル（横向き、667x375）
- [ ] カード2列表示
- [ ] Show Less 固定位置確認
- [ ] スクロール動作確認

#### タブレット（768x1024）
- [ ] カード2列表示（col-md-6）
- [ ] 全体レイアウト確認

#### デスクトップ（1920x1080）
- [ ] カード3列表示（col-lg-4）
- [ ] ボタン配置・サイズ確認

### パフォーマンステスト

- [ ] Chrome DevTools Performance タブでアニメーション確認
  - [ ] 60fps 維持
  - [ ] Layout Shift なし
  
- [ ] メモリリーク確認
  - [ ] 展開/折りたたみ 10回繰り返し
  - [ ] メモリ増加なし（DevTools Memory タブ）

---

## 🔍 トラブルシューティング

### Show Less ボタンが固定されない

**症状**: スクロールすると Show Less ボタンが画面外に消える

**原因**: `#devlog-gallery-header` の `position: absolute` が残っている

**対処**:
```css
#devlog-gallery-header {
  position: fixed;  /* absolute → fixed */
  top: 20px;
  left: 24px;
  z-index: 20;
}
```

### スライドアニメーションがカクつく

**症状**: カードのスライドが滑らかでない

**原因**: `max-height` のトランジション値が不適切

**対処**:
```css
.devlog-card.expandable {
  max-height: 0;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.devlog-card.expandable.expanded {
  max-height: 1000px;  /* 十分大きい値に調整 */
}
```

### モバイルでボタンが小さすぎる

**症状**: タップしづらい

**対処**:
```css
.btn-show-less,
.btn-read-more {
  /* 最小タップ領域 44x44px 確保 */
  min-height: 44px;
  min-width: 44px;
  padding: 10px 18px;
}
```

---

## 📊 実装進捗管理

### ステータス追跡

| タスク | 担当 | 状態 | 完了日 |
|--------|------|------|--------|
| Codex-1: animations.js | Codex | ⏳ 未着手 | - |
| Codex-1: toggle-buttons.js | Codex | ⏳ 未着手 | - |
| Codex-2: grid.js 修正 | Codex | ⏳ 未着手 | - |
| Codex-2: devlog.js 修正 | Codex | ⏳ 未着手 | - |
| Codex-3: index.html CSS | Codex | ⏳ 未着手 | - |
| 統合テスト | Claude Code | ⏳ 未着手 | - |
| DT レビュー | DT | ⏳ 未着手 | - |

### Codex へのタスク発行方法

```bash
# Codex に指示を送る（例）
cd /kesson-codex
git checkout feature/devlog-readmore

# Codex-1 を指示
codex run --task="TASK-readmore.md の Codex-1 セクションを実装"

# Codex-2 を指示
codex run --task="TASK-readmore.md の Codex-2 セクションを実装"

# Codex-3 を指示
codex run --task="TASK-readmore.md の Codex-3 セクションを実装"
```

---

## 📝 実装メモ・注意事項

### CSS の配置順序

index.html の `<style>` タグ内で、以下の順序で配置：

1. 既存の `#devlog-gallery-header` 修正（position: fixed）
2. `.btn-show-less` 新規追加
3. `.btn-read-more` 新規追加
4. `.devlog-card.expandable` 新規追加

### JavaScript import 順序

`devlog.js` の import 文は以下の順序：

```javascript
import { marked } from 'marked';
import { slideInCards, slideOutCards } from './animations.js';
import { createReadMoreButton, createShowLessButton } from './toggle-buttons.js';
```

### ARIA 属性の更新タイミング

- Read More クリック時:
  - Read More の `aria-expanded` を `true` に（非表示前）
  - Show Less の `aria-expanded` を `true` に（表示後）

- Show Less クリック時:
  - Show Less の `aria-expanded` を `false` に（非表示前）
  - Read More の `aria-expanded` を `false` に（表示後）

---

## 🚀 次のアクション

1. **Codex タスク発行**: 上記3つのサブタスクを並列実行
2. **進捗確認**: 各タスクの完了を待機
3. **統合テスト**: チェックリストに従って検証
4. **DT 報告**: 完了報告フォーマットで提出

---

## 🔗 参照ドキュメント

- **詳細仕様**: `docs/TASK-readmore.md`
- **監督構造**: `README.md` §監督構造
- **品質ルール**: `README.md` §品質ルール
- **ワークツリー**: `README.md` §ワークツリー構成

---

**質問・不明点があれば、DT に確認してください。**
