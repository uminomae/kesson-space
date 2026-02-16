# Claude Code 指示書：T-040-11-fix2 Articles Offcanvas 修正

**タスクID**: T-040-11-fix2
**親タスク**: T-040-11
**作成日**: 2026-02-16
**ブランチ**: `claude/articles-read-more-offcanvas-Ddbu0`（このブランチで作業）
**作成者**: DT（Claude.ai PM agent）

---

## 制約

- **この指示書の内容のみ実行すること**
- 新しいブランチを作成しない。上記ブランチで作業すること
- コミットは自律的に実行（DT 承認不要）

---

## 前提手順

```bash
git fetch origin
git checkout claude/articles-read-more-offcanvas-Ddbu0
git pull origin claude/articles-read-more-offcanvas-Ddbu0
```

---

## 問題（目視確認で発見）

### 問題1: 記事カードが重複表示

Articles セクションに同じ3件のカードが **2回** 表示されている。
原因: `index.html` 内に古い Articles 表示コードと新しい `loadArticles()` IIFE が共存している可能性。
または、HTML内に `#articles-grid` を持つセクションが2つ存在する可能性。

**対応**: 重複の原因を特定し、古い方を削除して1セットのみ表示されるようにする。

### 問題2: Articles Offcanvas が1列表示

現在の Offcanvas 内レイアウト:
```
[card 全幅]    ← col-12（現状）
[card 全幅]
[card 全幅]
```

期待するレイアウト（DEVLOG Offcanvas と同じ3列グリッド）:
```
[card] [card] [card]    ← col-12 col-md-6 col-lg-4
[card] [card] [card]
```

**対応**: `createCard()` の `'offcanvas'` レイアウト時の列クラスを変更する。

---

## 修正手順

### 修正1: 重複カードの除去

`index.html` を調査し、以下のいずれかを実行:

- Articles を表示する `<script>` ブロックが2つある場合 → 古い方を削除
- `#articles-grid` を含むHTMLセクションが2つある場合 → 古い方を削除
- JSで `grid.appendChild` が2回走るロジックがある場合 → 修正

修正後、Articles セクションには **3件のみ** 表示されること。

### 修正2: Offcanvas レイアウトを3列化

`loadArticles()` 内の `createCard()` 関数を修正:

**変更前**:
```javascript
col.className = layout === 'offcanvas'
  ? 'col-12 mb-3'
  : 'col-12 col-md-6 col-lg-4 mb-3';
```

**変更後**:
```javascript
col.className = layout === 'offcanvas'
  ? 'col-12 col-md-6 col-lg-4 mb-3'
  : 'col-12 col-md-6 col-lg-4 mb-3';
```

両レイアウトとも同じ3列グリッドにする。

---

## チェックリスト

- [ ] Articles セクションにカードが3件のみ表示（重複なし）
- [ ] Read More ボタンクリックで Offcanvas 表示
- [ ] Offcanvas 内カードが3列グリッド（デスクトップ）
- [ ] Offcanvas 内カードが2列（タブレット md）
- [ ] Offcanvas 内カードが1列（モバイル sm）
- [ ] DEVLOG Offcanvas のレイアウトと視覚的に統一
- [ ] コンソールエラーなし

---

## 完了後

```bash
git add -A
git commit -m "fix(T-040-11): Remove duplicate articles + 3-column offcanvas grid"
git push origin claude/articles-read-more-offcanvas-Ddbu0
```

**この指示書に基づき修正・コミットすること。**
