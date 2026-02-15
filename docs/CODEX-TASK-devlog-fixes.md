# Codex 直接指示書: Devlog修正タスク

## 作業ディレクトリ
```
/Users/uminomae/Documents/GitHub/kesson-codex
ブランチ: feature/codex-tasks
```

## 実行方法
```bash
cd /Users/uminomae/Documents/GitHub/kesson-codex
git pull origin feature/devlog-content
codex -p "$(cat docs/CODEX-TASK-devlog-fixes.md)"
```

---

## タスク

### Task 1: GitHub Actions YAML修正

**ファイル操作:**
1. 新規作成: `scripts/generate-sessions.py`
2. 編集: `.github/workflows/devlog.yml`

**手順:**
1. `.github/workflows/devlog.yml` の line 30〜126 のPythonコード部分を `scripts/generate-sessions.py` に移動
2. 先頭に `#!/usr/bin/env python3` を追加
3. `devlog.yml` を以下に変更:
```yaml
      - name: Generate sessions.json
        run: python3 scripts/generate-sessions.py
```

**コミット:** `fix: T-032 separate Python script from workflow YAML`

---

### Task 2: devlogヘッダー表示修正

**ファイル:** `index.html`, `src/scroll-ui.js`

**手順:**
1. `index.html` の `#devlog-gallery-header` CSSを修正:
```css
#devlog-gallery-header {
  position: fixed;
  top: 20px;
  left: 24px;
  z-index: 20;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.6s ease, visibility 0.6s ease;
}
#devlog-gallery-header.visible {
  opacity: 1;
  visibility: visible;
}
```

2. `src/scroll-ui.js` でdevlogセクション到達時に `.visible` クラスを付与する処理を追加

**コミット:** `fix: T-031 show devlog header only when scrolled to gallery section`

---

### Task 3: devlog一覧ソート

**ファイル:** `src/devlog/devlog.js`

**手順:**
sessions読み込み後にソート処理を追加:
```javascript
// loadSessions() または initGallery() 内
sessions.sort((a, b) => {
  const getEndDate = (s) => {
    const range = s.date_range || s.end || '';
    const match = range.match(/(\d{4}[-\/]\d{2}[-\/]?\d{0,2}|\d{2}[-\/]\d{2})$/);
    return match ? match[0] : range;
  };
  return getEndDate(b).localeCompare(getEndDate(a));
});
```

**コミット:** `fix: T-033 sort devlog sessions by end date descending`

---

## 制約
- 日本語コメントOK
- 既存コードスタイルを維持
- 各タスク完了後にコミット
- mainにマージしない
