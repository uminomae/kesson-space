# kesson-space

> 欠損駆動思考の3D体験空間

---

## 🔴 DT 実装禁止ルール

**DT（Claude.ai Desktop / Web チャット）はコード実装を行ってはならない。**

DTの役割は以下に限定する:
- プロジェクト管理・タスク分析・指示書作成
- ドキュメント（README, CURRENT.md, TODO.md等）の更新
- GitHub API経由のマージ・PR操作
- バグ分析・CSS比較等のレビュー作業

コード実装が必要な場合は、必ず委譲先エージェントに指示書を渡すこと。

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

### Step 1: キャッシュ読み込み（状態復元）

→ `~/Library/Caches/kesson-agent/session/state.md` を読む（存在すれば）
→ 前セッションからの引き継ぎ事項を確認

### Step 2: 状態確認

→ [docs/CURRENT.md](docs/CURRENT.md) を読む

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
| **運用ルール** | [`CACHE-RULES.md`](file:///Users/uminomae/Library/Caches/kesson-agent/CACHE-RULES.md)（キャッシュ内） |
| **セッション状態** | `session/state.md`（必須・常時更新） |
| **分析退避** | `session/*.md`（重いデータはここに退避） |

### 使い方

- **state.md**: セッション完了/PENDING/ブランチ状態/PR状態を常時記録
- **退避**: CSS分析・diff結果・Gemini出力など重いデータは別ファイルに書き出し
- **復元**: 次セッション開始時にstate.mdを読んで引き継ぎ
- **クリア**: 不要になったファイルは適宜削除

---

## 目視確認ワークフロー（feature/dev）

実装ブランチの成果物を `feature/dev` にマージし、ローカルで目視チェックする手順。

### マージ（ローカル）

```bash
cd /Users/uminomae/Documents/GitHub/kesson-space
git fetch origin
git checkout feature/dev
git pull origin feature/dev
git merge origin/<実装ブランチ名>
# コンフリクトがあれば手動解決
git push origin feature/dev
```

### 目視チェック用サーバー起動

```bash
cd /Users/uminomae/Documents/GitHub/kesson-space
python3 -m http.server 3001
# → http://localhost:3001/
```

### チェック後の main マージ

```bash
git checkout main
git pull origin main
git merge feature/dev
git push origin main
```

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

## ブランチ戦略

```
実装ブランチ → feature/dev（目視確認） → main（本番デプロイ）
```

- `main` への直接コミット禁止
- `feature/dev` は目視確認用のステージング
- 実装ブランチは `claude/*` または `feature/*` 命名

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
