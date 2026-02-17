# kesson-space

> 欠損駆動思考の3D体験空間

**⚠️ 本READMEはClaude DT（Claude.ai Desktop / Web チャット）用の運用ルールです。**
他のエージェント（Claude Code CLI, OpenAI Codex, Gemini等）は [AGENTS.md §0](AGENTS.md) の読み替えガイドに従い、自環境に適用してください。全エージェント共通のルールは [AGENTS.md](AGENTS.md) の §3, §5, §6 を参照。

---

## 🔴🔴🔴 最重要ルール: 委譲完了後フロー（絶対遵守）

**Code / Codex / Gemini 等の委譲先エージェントから実装完了の報告があったら、DTは以下のフローを必ず実行する。例外なし。**

```
┌─────────────────────────────────────────────────┐
│  1. 実装ブランチを feature/dev にマージ          │
│  2. ユーザーに pull + サーバー起動コマンド提示    │
│  3. ⛔ 停止 — ユーザーの目視確認を待つ           │
│  4. OK → PR作成（Closes #XX）→ mainマージ       │
│     NG → fix指示書作成                           │
└─────────────────────────────────────────────────┘
```

### 🚫 絶対禁止

- **目視確認前に次タスクに着手すること**
- **目視確認前に新しい指示書を作成すること**
- **「ドキュメントだけだから」と例外扱いすること**
- **目視確認待ちの間に feature/dev へ追加コミットすること**

### マージ → 目視確認 → main の具体手順

```bash
# 1. 目視チェック（DT確認用ワークツリー）
cd /Users/uminomae/dev/kesson-space
git fetch origin
git checkout feature/dev
git pull origin feature/dev
python3 -m http.server 3001
# → http://localhost:3001/

# 2. ユーザーが OK と言ったら → PR作成 → mainマージ
# GitHub API経由で PR (feature/dev → main) を作成
# PR body に Closes #XX を含めて Issue 自動クローズ
```

---

## 🔴 DT 実装禁止ルール

**DT（Claude.ai Desktop / Web チャット）はコード実装を行ってはならない。**

DTの役割は以下に限定する:
- プロジェクト管理・タスク分析・指示書作成
- ドキュメント（README等）の更新
- GitHub API経由のマージ・PR操作
- バグ分析・CSS比較等のレビュー作業

コード実装が必要な場合は、必ず委譲先エージェントに指示書を渡すこと。

---

## 🔴 目視確認ゲート（最重要）

**feature/dev に実装ブランチをマージしたら、ユーザーの目視確認OKが出るまで次の作業に進んではならない。**

### ゲートルール

1. 実装ブランチ → feature/dev マージ **直後に停止**
2. ユーザーにpull + サーバー起動コマンドを提示
3. **ユーザーが「OK」または「問題あり」を回答するまで待機**
4. OK → PR作成（`Closes #XX`）→ mainマージ / 問題あり → fix指示書を作成

### 禁止事項

- 目視確認待ちの間に feature/dev へ追加コミットすること
- 目視確認をスキップして次タスクに着手すること
- 「ドキュメント更新だけだから」と例外扱いすること

### ワークツリー使い分け

| 操作 | ワークツリー | パス |
|---|---|---|
| 目視確認 | **claudeDT** | `/Users/uminomae/dev/kesson-space` |
| mainマージ | **GitHub API** | PR経由 |

---

## セッション開始

**このセクションを読んだ時点で以下を実行する。**

### Step 0: プロジェクト管理エージェント読み込み（必須）

**対話開始時に必ず [skills/project-management-agent.md](skills/project-management-agent.md) を読み込むこと。**
読み込み完了後、常駐エージェントが起動する。

| エージェント | 役割 | 詳細 |
|---|---|---|
| 📋 プロジェクト管理 | タスク委譲・指示書生成 | [skills/project-management-agent.md](skills/project-management-agent.md) |
| 📝 Issue進捗記録 | 作業中Issueにコメント記録 | [AGENTS.md §5.2](AGENTS.md) |
| 🩺 セッションヘルス | コンテキスト監視 | [docs/AGENT-RULES.md §8](docs/AGENT-RULES.md) |
| 🔎 PKガード | ドキュメント参照最適化 | [docs/AGENT-RULES.md §7](docs/AGENT-RULES.md) |

### Step 1: キャッシュ読み込み（状態復元）

→ `~/Library/Caches/kesson-agent/session/state.md` を読む（存在すれば）
→ 前セッションからの引き継ぎ事項を確認

### Step 2: 状態確認

→ [GitHub Issues](https://github.com/uminomae/kesson-space/issues) の open 一覧を確認
→ P0/P1 ラベルの Issue を優先把握

### Step 3: ワークツリー確認

DTが見ているディレクトリは？
→ 📋エージェントが出力先を決定

### Step 4: タスク着手

ユーザーがタスクを指示 → 📋エージェントが委譲判断

---

## セッションキャッシュ

DTセッション中のコンテキスト消費を抑制するための一時ファイル置き場。

| 項目 | 内容 |
|---|---|
| **場所** | `~/Library/Caches/kesson-agent/` |
| **運用ルール** | `CACHE-RULES.md`（キャッシュ内） |
| **セッション状態** | `session/state.md`（必須・常時更新） |
| **分析退避** | `session/*.md`（重いデータはここに退避） |

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

委譲が必要になるのは以下の場合のみ:
- **Claude Code CLI**: 複数ファイルにまたがる設計判断が必要、またはDTのコンテキストが逼迫
- **OpenAI Codex**: 定型作業の並列実行
- **Gemini MCP**: シェーダー/GLSL実装

---

## ブランチ戦略

```
main（起点）→ 実装ブランチ → feature/dev（🔴目視確認ゲート）→ PR（Closes #XX）→ main
```

- `main` への直接コミット禁止
- 実装ブランチは `main` から作成する
- `feature/dev` は目視確認用のステージング
- **feature/dev マージ後、目視確認OKまで追加コミット禁止**
- 目視確認OK後、PR を作成して main にマージ
- 実装ブランチは `claude/*` または `feature/*` 命名

---

## ドキュメント

→ [docs/README.md](docs/README.md)

---

## 開発

```bash
./serve.sh  # → http://localhost:3001/
```

## Deep Link Presets

Deep link URL presets are managed in:

- `assets/deeplinks.json`

Print all preset URLs:

```bash
npm run deeplinks
```

Print one preset URL (copy ready):

```bash
node scripts/print-deeplinks.mjs articles_readmore_open
```

Use local server origin:

```bash
node scripts/print-deeplinks.mjs articles_readmore_open --base http://localhost:5173
```

---

## 関連プロジェクト

| 場所 | 役割 |
|---|---|
| [kesson-space](https://uminomae.github.io/kesson-space/) | 体験する（本リポジトリ） |
| [pjdhiro ブログ](https://uminomae.github.io/pjdhiro/thinking-kesson/) | 読む |
| kesson-driven-thinking | 理論の正本（Private） |
