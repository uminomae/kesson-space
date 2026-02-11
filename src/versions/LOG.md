# VERSION LOG — src/versions/

バージョン追跡。各試行のプロンプト・結果・判定を記録する。

**ルール**:
- 毎回の試行は `vNNN-名前.js` で保存（上書きしない）
- 採用 → main.js にコピー、commit、push
- 不採用 → そのまま残す（後で参照可能）
- ローカル確認は index.html の import 先を一時的に切り替え

---

## ワークフロー

```
Claude: プロンプト(PNNN)を書く → docs/prompts/PNNN-*.md
  ↓
User: プロンプト + 現行main.js を Gemini に投げる
  ↓
Gemini: コードを返す
  ↓
User: src/versions/vNNN-名前.js として保存
  ↓
User: index.html の import 先を切り替え → ./serve.sh で確認
  ↓
User: 判定（◎○△✗）を Claude に報告
  ↓
Claude: LOG.md に記録 + 次のプロンプトを書く
```

### index.html の切り替え方法

```html
<!-- 試行時: -->
<script type="module" src="./src/versions/v002-color.js"></script>

<!-- 採用後（元に戻す）: -->
<script type="module" src="./src/main.js"></script>
```

---

## バージョン一覧

| # | ファイル | プロンプト | 変更対象 | 意図 | 判定 | メモ |
|---|---------|----------|---------|------|------|------|
| 001 | v001-baseline.js | — | — | Gemini初版 | ◎ | ベースライン |

---

## プロンプト一覧

| ID | ファイル | 対象レイヤー | 意図 |
|----|---------|------------|------|
| （最初のプロンプト作成時に記録開始） |
