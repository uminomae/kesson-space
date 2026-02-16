# kesson-space

> 欠損駆動思考の3D体験空間

---

## セッション開始

**このセクションを読んだ時点で以下を実行する。**

### Step 0: プロジェクト管理エージェント読み込み（必須）

**対話開始時に必ず [skills/project-management-agent.md](skills/project-management-agent.md) を読み込むこと。**
読み込み完了後、常駐エージェントが起動する。

| エージェント | 役割 | 詳細 |
|---|---|---|
| 📋 プロジェクト管理 | タスク委譲・指示書生成 | [skills/project-management-agent.md](skills/project-management-agent.md) |
| 🩺 セッションヘルス | コンテキスト監視 | [docs/AGENT-RULES.md §8](docs/AGENT-RULES.md) |
| 🔎 PKガード | ドキュメント参照最適化 | [docs/AGENT-RULES.md §7](docs/AGENT-RULES.md) |

### Step 1: 状態確認

→ [docs/CURRENT.md](docs/CURRENT.md) を読む

### Step 2: ワークツリー確認

DTが見ているディレクトリは？
→ 📋エージェントが出力先を決定

### Step 3: タスク着手

ユーザーがタスクを指示 → 📋エージェントが委譲判断

---

## 実装エージェント区別（重要）

本プロジェクトでは以下の **3つの実装エージェントを厳密に区別** する。混同しないこと。

| 名称 | 正式名 | 実体 | 特徴 |
|---|---|---|---|
| **DT App Code** | Claude.ai Desktop App のコード実行機能 | `bash_tool`, `create_file`, `str_replace`, `view` 等 | DTチャット内から直接ファイル操作。ボトルネックなし |
| **Claude Code CLI** | Claude Code（ターミナル） | `claude` コマンド（CLI） | ターミナルで実行。ワークツリー指定が必要 |
| **OpenAI Codex** | OpenAI Codex | `codex` コマンド（CLI） | 並列・定型作業向き |

### コード実装の第一選択肢

**コード実装が必要な場合、第一選択肢は DT App Code である。**

理由: DTチャット（Claude.ai）がプロジェクト管理者として常駐しており、DT App Code を使えば指示書作成→受け渡し→実行の往復が不要。DTが直接 filesystem MCP 経由でローカルファイルを編集し、即座に結果を確認できる。

委譲が必要になるのは以下の場合のみ:
- **Claude Code CLI**: 複数ファイルにまたがる設計判断が必要、またはDTのコンテキストが逼迫
- **OpenAI Codex**: 定型作業の並列実行
- **Gemini MCP**: シェーダー/GLSL実装

---

## ドキュメント

→ [docs/README.md](docs/README.md)

---

## 開発

```bash
./serve.sh  # → http://localhost:3001/
```

---

## 関連プロジェクト

| 場所 | 役割 |
|---|---|
| [kesson-space](https://uminomae.github.io/kesson-space/) | 体験する（本リポジトリ） |
| [pjdhiro ブログ](https://uminomae.github.io/pjdhiro/thinking-kesson/) | 読む |
| kesson-driven-thinking | 理論の正本（Private） |
