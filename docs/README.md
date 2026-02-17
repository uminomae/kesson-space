# kesson-space ドキュメントハブ

**バージョン**: 3.0
**更新日**: 2026-02-17

本ファイルはドキュメントの目次。詳細は各ファイルを参照。

---

## プロジェクト概要

kesson-spaceは欠損駆動思考プロジェクトの**3D体験空間**。

- **サイト**: https://uminomae.github.io/kesson-space/
- **技術**: Three.js + GLSL シェーダー
- **スコープ**: 技術的な実装・運用・改善のみ（理論はkesson-thinking側）

---

## セッション開始

→ **[ルートREADME.md](../README.md) を参照**

---

## タスク管理

**GitHub Issues が唯一の正本。**
→ https://github.com/uminomae/kesson-space/issues

- 進捗追跡: Issue コメントで記録（AGENTS.md §5.2）
- 優先度: P0〜P3 ラベル
- 完了: PR の `Closes #XX` で自動クローズ

---

## ドキュメント構成

### Tier 1: 毎セッション参照

| ファイル | 内容 |
|---------|------|
| [../README.md](../README.md) | セッション起動（エントリーポイント） |
| [../AGENTS.md](../AGENTS.md) | ブランチルール・Issue進捗コメント・品質ガード |
| [GitHub Issues](https://github.com/uminomae/kesson-space/issues) | タスク正本・進捗追跡 |

### Tier 2: タスクに応じて参照

| ファイル | 内容 |
|---------|------|
| [WORKFLOW.md](./WORKFLOW.md) | セッション終了、正本原則、Cross-repo |
| [AGENT-RULES.md](./AGENT-RULES.md) | エージェント分業、監督構造、PKガード、セッションヘルス |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | ファイル構成、技術スタック、設計原則 |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | 開発環境（MCP / Codex / Worktree） |
| [TESTING.md](./TESTING.md) | テスト体制（CI / E2E） |
| [CONCEPT.md](./CONCEPT.md) | 理論↔視覚の対応 |

### スキル（skills/）

| ファイル | 内容 |
|----------|------|
| [project-management-agent.md](../skills/project-management-agent.md) | タスク委譲判断、ワークツリー構成（正本） |
| [devlog-generation.md](../skills/devlog-generation.md) | devlog生成ワークフロー |
| [orchestrator.md](../skills/orchestrator.md) | エージェント協調 |

### その他

| ファイル | 内容 |
|---------|------|
| [prompts/](./prompts/) | Gemini向けプロンプト履歴 |
| [codex/README.md](./codex/README.md) | Codex App ワークツリー向けの運用メモ置き場 |

---

## 監督構造・ワークツリー

→ [AGENT-RULES.md](./AGENT-RULES.md) §0〜§1 を参照
→ [skills/project-management-agent.md](../skills/project-management-agent.md) §Step 3 を参照（ワークツリー正本）

---

## クイックスタート

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
| 2026-02-15 | 2.2 | ルートREADMEをセッション起点に再設計。監督構造を参照リンク化 |
| 2026-02-17 | 3.0 | Issue-Centric移行。CURRENT.md/TODO.md廃止、Issue進捗コメント導入 |
