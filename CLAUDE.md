# kesson-space — Claude Code CLI

## 指示書受領ルーチン

指示書を受け取ったら、作業前に必ず以下を実行:

1. ワークツリー・ブランチの存在確認と同期
2. `git status` でクリーンな作業ツリーを確認
3. 負荷判定（🟢低/🟡中/🔴高） — 🔴の場合は分割提案

詳細: [docs/CLAUDE-CODE-QC.md](docs/CLAUDE-CODE-QC.md)

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

- [docs/CLAUDE-CODE-QC.md](docs/CLAUDE-CODE-QC.md) — CLI品質管理ルーチン
- [docs/AGENT-RULES.md](docs/AGENT-RULES.md) — マルチエージェント運用ルール
- [skills/shared-quality.md](skills/shared-quality.md) — コーディング品質基準
