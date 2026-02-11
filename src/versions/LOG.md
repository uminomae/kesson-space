# VERSION LOG — src/versions/

バージョン追跡。各試行のプロンプト・結果・判定を記録する。

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

### ローカル確認方法

```html
<!-- 試行時: -->
<script type="module" src="./src/versions/vNNN-name.js"></script>

<!-- 採用後（元に戻す）: -->
<script type="module" src="./src/main.js"></script>
```

---

## バージョン一覧

| # | ファイル | プロンプト | 変更対象 | 意図 | 判定 | メモ |
|---|---------|----------|---------|------|------|------|
| 001 | v001-baseline.js | — | — | Gemini初版 | ◎ | Session #1ベース |
| 002 | v002-gemini-fractal.js | P001 | 全体 | 背景深化+光DomainWarping+配置調整 | ◎ | v001からのベース更新 |
| 003 | v003-soul-core.js | P002 | 光シェーダー | 魂のコア光（voidHole→光源化） | ○ | 悪くない |

---

## プロンプト一覧

| ID | ファイル | 対象レイヤー | 意図 |
|----|---------|------------|------|
| P001 | (手動投入) | 全体 | 初回フラクタル化 |
| P002 | P002-soul-core.md | 光シェーダー | 魂のコア光 |
| P003 | P003-slate-blue-bg.md | 背景 | dark slate blueグラデーション |
