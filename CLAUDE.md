# kesson-space — Claude Code向け

## セッション開始

1. `docs/CURRENT.md` を読む
2. 前回の決定事項・次タスクを確認
3. 高負荷タスクは着手前に分割提案

## コーディング方針

- **Claude Codeが実装 + Codexでレビュー**
- **または** Gemini MCP経由でシェーダー/Three.js実装（視覚品質重視時）
- シェーダー修正時は変更箇所にコメント: `// CHANGED(YYYY-MM-DD)`

## 技術スタック

- Three.js 0.160.0 (ES Modules, importmap)
- ビルドツールなし
- ローカル: `./serve.sh` → http://localhost:3001/
- テスト: `?test` パラメータでE2E実行

## 参照

- [docs/CURRENT.md](docs/CURRENT.md) — 進捗・TODO
- [docs/AGENT-RULES.md](docs/AGENT-RULES.md) — 運用ルール詳細
