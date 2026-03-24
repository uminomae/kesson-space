<!-- Adapted from: creation-space (2026-03-24) -->
# ドキュメントナビゲーター

タスク種別に応じて読むべきドキュメントを参照する。

| タスク | 読むべきファイル | 理由 |
|---|---|---|
| シェーダー実装 | `skills/shader-impl.md` | Gemini MCP 委譲ルール |
| Three.js シーン変更 | `src/config.js`, `docs/ARCHITECTURE.md` | SSoT + データフロー |
| CSS/UI 変更 | `index.html`, `src/styles/` | 構造 + スタイル |
| config パラメータ変更 | `.claude/rules/breaking-change-checklist.md` | 下流影響チェック |
| テスト | `docs/TESTING.md`, `tests/` | テスト体系 |
| devlog 追加 | README.md §Devlog English Flow | 手順 + 検証コマンド |
| コミット | `.claude/rules/commit-rules.md` | メッセージ形式 + チェックリスト |
| ファイル構成確認 | `docs/ARCHITECTURE.md` | ディレクトリレイアウト |
| 品質レビュー | `docs/quality-management.md` | 品質基準 |
| 全体把握 | `docs/README.md` | ドキュメントハブ |

## 読み込みルール

- ファイル全文読みは避け、セクション指定で読む
- CLAUDE.md の記述が他ドキュメントと矛盾する場合、CLAUDE.md を優先
- 1プロンプトで skills/ は最大2ファイルまで（SH-1 ガード）
