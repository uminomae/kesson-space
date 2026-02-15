# Claude Code 指示書: Devlog修正タスク（T-031〜T-033）

## ワークツリー

```
/Users/uminomae/Documents/GitHub/kesson-space-claudeDT
ブランチ: feature/devlog-content
```

**mainにマージしないこと。**

---

## タスク一覧

| ID | 内容 | 優先度 |
|----|------|--------|
| T-032 | GitHub Actions YAML構文エラー修正 | P0 |
| T-031 | devlogタイトル固定表示 → スクロール連動 | P1 |
| T-033 | devlog一覧を終了日新しい順にソート | P1 |

---

## T-032: GitHub Actions YAML修正（P0）

### 問題
`.github/workflows/devlog.yml` line 30 で YAML構文エラー

### 原因
Pythonコードをインライン埋め込みしているため、特殊文字がYAML解析を壊している

### 解決方法

1. **Pythonスクリプトを分離**
   - `scripts/generate-sessions.py` を新規作成
   - `.github/workflows/devlog.yml` のインラインPythonを削除

2. **scripts/generate-sessions.py**
   - 既存のインラインPythonコードをそのまま移動
   - 先頭に `#!/usr/bin/env python3` 追加

3. **devlog.yml 修正**
```yaml
      - name: Generate sessions.json
        run: python3 scripts/generate-sessions.py
```

### コミット
```
fix: T-032 separate Python script from workflow YAML
```

---

## T-031: devlogタイトル固定表示修正（P1）

### 問題
左上の「DEVLOG / N sessions」が常に表示されている。
以前はスクロールでdevlogセクションに入った時だけ表示されていた。

### 調査対象
- `src/scroll-ui.js` — スクロール連動UI制御
- `index.html` — `#devlog-gallery-header` のCSS

### 解決方法

1. `#devlog-gallery-header` の初期状態を非表示に
```css
#devlog-gallery-header {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.6s ease, visibility 0.6s ease;
}
#devlog-gallery-header.visible {
  opacity: 1;
  visibility: visible;
}
```

2. `scroll-ui.js` でdevlogセクション到達時に `.visible` を付与
   - 既存のスクロール監視ロジックを確認・修正

### コミット
```
fix: T-031 show devlog header only when scrolled to gallery section
```

---

## T-033: devlog一覧ソート（P1）

### 問題
devlog一覧が古い順に表示されている

### 要件
- 終了日（`end` または `date_range`）が新しい順にソート
- メイン画面の3件カード、Offcanvas内の一覧、両方に適用

### 解決方法

`src/devlog/devlog.js` の `initGallery()` または `loadSessions()` で：

```javascript
// sessions.json 読み込み後にソート
sessions.sort((a, b) => {
  // date_range: "2026-02-15" or "2026-02-14 〜 02-15"
  const getEndDate = (s) => {
    const range = s.date_range || s.end || '';
    // 最後の日付を抽出
    const match = range.match(/(\d{4}[-\/]\d{2}[-\/]?\d{0,2}|\d{2}[-\/]\d{2})$/);
    return match ? match[0] : range;
  };
  return getEndDate(b).localeCompare(getEndDate(a));
});
```

### コミット
```
fix: T-033 sort devlog sessions by end date descending
```

---

## 完了条件

- [ ] T-032: GitHub Actions が正常に動作（YAMLエラー解消）
- [ ] T-031: devlogヘッダーがスクロール連動で表示/非表示
- [ ] T-033: devlog一覧が新しい順に表示

---

## 注意

- **mainにマージしない**
- コミットはタスク単位で分ける（3コミット）
- 日本語文章作成はClaudeが担当（Codexはコーディングのみ）
