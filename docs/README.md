# kesson-space ドキュメントハブ

**バージョン**: 2.1
**更新日**: 2026-02-15

本ファイルはドキュメントの目次。詳細は各ファイルを参照。

---

## プロジェクト概要

kesson-spaceは欠損駆動思考プロジェクトの**3D体験空間**。

- **サイト**: https://uminomae.github.io/kesson-space/
- **技術**: Three.js + GLSL シェーダー
- **スコープ**: 技術的な実装・運用・改善のみ（理論はkesson-thinking側）

---

## ドキュメント構成

### Tier 1: 毎セッション参照

| ファイル | 内容 |
|---------|------|
| **README.md** | 本ファイル（目次・監督構造） |
| [CURRENT.md](./CURRENT.md) | 今セッションの状態・引き継ぎ |
| [TODO.md](./TODO.md) | タスクバックログ |

### Tier 2: タスクに応じて参照

| ファイル | 内容 |
|---------|------|
| [WORKFLOW.md](./WORKFLOW.md) | セッション開始/終了、正本原則、Cross-repo |
| [AGENT-RULES.md](./AGENT-RULES.md) | エージェント分業、PKガード、セッションヘルス |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | ファイル構成、技術スタック、設計原則 |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | 開発環境（MCP / Codex / Worktree） |
| [TESTING.md](./TESTING.md) | テスト体制（CI / E2E） |
| [CONCEPT.md](./CONCEPT.md) | 理論↔視覚の対応 |

### その他

| ファイル | 内容 |
|---------|------|
| [issues/](./issues/) | 大規模タスクの設計書（ISS-NNN） |
| [prompts/](./prompts/) | Gemini向けプロンプト履歴 |

---

## 監督構造

### 階層体制

```
┌─────────────────────────────────────────────────────────┐
│  DT (Claude Desktop)                                    │
│  ─────────────────                                      │
│  • 戦略決定・最終判断権                                 │
│  • 指示書・スキル作成                                   │
│  • 日本語文章作成（レポート調）                         │
│  • Claude Codeへの全権委譲は保留                        │
├─────────────────────────────────────────────────────────┤
│  Claude Code                                            │
│  ───────────                                            │
│  • 監督・タスク管理                                     │
│  • スキル呼び出し・品質管理                             │
│  • ブランチマージ                                       │
│  • Codexへの指示出し                                    │
├─────────────────────────────────────────────────────────┤
│  Codex (OpenAI) x2                                      │
│  ─────────────────                                      │
│  • コーディング実行（並列可）                           │
│  • 日本語文章作成NG（コードのみ）                       │
└─────────────────────────────────────────────────────────┘
```

### ワークツリー構成

| ブランチ | ローカルパス | 用途 |
|----------|-------------|------|
| `main` | /kesson-space | 本番デプロイ |
| `feature/claude-code` | /kesson-claudeCode | Claude Code作業用 |
| `feature/codex-tasks` | /kesson-codex | Codex並列実行用 |
| `feature/devlog-content` | /kesson-space-claudeDT | DT直接作業用 |

### 品質ルール

| 領域 | ルール |
|------|--------|
| CSS | Bootstrapを使用。カスタムCSSは最小限 |
| devlog | レポート調で執筆。小説調NG |
| 日本語文章 | Claude（DT/Code）が担当。Codexはコーディングのみ |
| シェーダー | Gemini MCP経由で実装 |

### スキル

| ファイル | 内容 |
|----------|------|
| [skills/devlog-writing.md](../skills/devlog-writing.md) | devlog作成ルール |
| [skills/orchestrator.md](../skills/orchestrator.md) | エージェント協調 |

→ 詳細は [AGENT-RULES.md](./AGENT-RULES.md) を参照

---

## クイックスタート

### セッション開始

→ [WORKFLOW.md §1](./WORKFLOW.md) を参照

### 開発環境

| ツール | 用途 |
|--------|------|
| GitHub MCP | リモートリポジトリ操作 |
| Codex MCP | ローカルgit/ファイル操作 |
| Gemini MCP | シェーダーコード生成 |

→ [ENVIRONMENT.md](./ENVIRONMENT.md) を参照

---

## 外部リンク

- [ライブサイト](https://uminomae.github.io/kesson-space/)
- [ブログ記事](https://uminomae.github.io/pjdhiro/thinking-kesson/)
- [GitHub Actions](https://github.com/uminomae/kesson-space/actions)

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2026-02-13 | 1.0 | 初版作成。SCOPE.md・WORKFLOW.mdを統合 |
| 2026-02-14 | 1.1-1.7 | テスト体制、TODO管理、セッションヘルス等追加 |
| 2026-02-14 | 2.0 | ドキュメント階層再構成。詳細を専用ファイルに分離 |
| 2026-02-15 | 2.1 | 監督構造セクション新設。DT→Claude Code→Codex体系を明文化 |
