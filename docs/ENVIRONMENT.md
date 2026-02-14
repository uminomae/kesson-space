# ENVIRONMENT.md — 開発環境・ツールチェーン

**バージョン**: 1.1
**更新日**: 2026-02-15

---

## 1. 全体像

```
Claude.ai (セッションホスト)
    │
    ├── GitHub MCP ─────→ リモートリポジトリ操作
    │   └── ファイル取得、コミット、ブランチ、PR
    │
    ├── Codex MCP ──────→ ローカルマシン操作
    │   └── git status, ファイル編集, bash実行
    │
    └── Gemini MCP ─────→ Three.js/GLSLコード生成
        └── シェーダー実装、視覚品質最適化

OpenAI Codex CLI ──────→ バックグラウンド並列作業
    └── 独立ターミナルで長時間タスク実行
```

### 環境ごとの能力

| 環境 | リモート操作 | ローカル操作 | MCP連携 | 並列実行 |
|------|-------------|-------------|--------|---------|
| Claude.ai + MCP | ✅ GitHub MCP | ✅ Codex MCP | ✅ | ❌ |
| Claude Code (CLI) | ❌ | ✅ 直接 | ❌ | ❌ |
| OpenAI Codex CLI | ❌ | ✅ 直接 | ❌ | ✅ |

---

## 2. GitHub MCP（リモート操作）

### 主な用途

- リモートリポジトリのファイル取得・閲覧
- 直接コミット・プッシュ
- ブランチ作成・切り替え
- PR作成・マージ
- Issue操作

### よく使うコマンド例

```
# ファイル取得
github:get_file_contents owner=uminomae repo=kesson-space path=docs/CURRENT.md

# コミット履歴
github:list_commits owner=uminomae repo=kesson-space perPage=5

# 複数ファイル一括プッシュ
github:push_files owner=uminomae repo=kesson-space branch=main ...
```

### 制約

- ローカルの `git status`（未コミット変更）は見れない
- ワーキングツリーの状態は見れない
- ローカルブランチは見れない

---

## 3. Codex MCP（ローカル操作）

Codex MCPを経由することで、ローカルマシンのファイル操作・コマンド実行が可能。

### 主な用途

- `git status`, `git diff` でローカル状態確認
- ローカルファイルの編集
- bash/npm/node コマンド実行
- ローカルサーバー起動

### よく使うコマンド例

```
# ローカルgit状態確認
codex:codex prompt="cd /path/to/repo && git status && git diff --stat"

# ブランチ切り替え
codex:codex prompt="cd /path/to/repo && git checkout feature/xxx"

# ローカルテスト実行
codex:codex prompt="cd /path/to/repo && node tests/config-consistency.test.js"
```

### 注意点

- Codexはプロンプトを渡して実行する形式
- 対話的なコマンド（vim等）は向かない
- パスは絶対パスで指定するのが確実

---

## 4. OpenAI Codex CLI（並列バックグラウンド作業）

Claude.aiのtoken制限を回避し、長時間のリサーチ・コーディングタスクをバックグラウンドで実行する。

### セットアップ

```bash
# インストール（npm非推奨、native推奨だが現状npmで動作）
npm install -g @openai/codex

# 認証（API Key方式 = OTP不要で並列実行向き）
codex login --with-api-key
# → stdinでAPI Keyを入力

# 確認
codex login status
codex --version
```

### 認証方式の比較

| 方式 | 課金 | OTP | 並列実行 |
|------|------|-----|---------|
| ChatGPTログイン | Pro/Plusに含む | 毎回必要 | 不向き |
| API Key | 従量課金 | 不要 | ✅ 推奨 |

認証情報は `~/.codex/auth.json` にキャッシュされる。

### 基本的な使い方

```bash
# 対話モード
cd /Users/uminomae/Documents/GitHub/kesson-codex
codex

# ワンショット実行
codex "README.mdを読んでプロジェクト概要を説明して"

# バックグラウンド実行（並列作業向け）
codex "docs/TODO.mdを分析して優先度レポートを作成" &
```

### 並列作業のルール

1. **Codex作業は専用ワークツリー `kesson-codex` で行う**
2. タスクはファイル単位で分離（衝突回避）
3. mainへのマージは人間が判断

---

## 5. Worktree運用

kesson-spaceでは `git worktree` を使い、エージェントごとに別ディレクトリで作業する。

### 現在の構成

```
/Users/uminomae/Documents/GitHub/
├── kesson-space/          ← main（人間がマージ判断）
├── kesson-claudeCode/     ← feature/claude-code（Claude Code専用）
├── kesson-codex/          ← feature/codex-tasks（OpenAI Codex CLI専用）
└── kesson-space-claudeDT/ ← feature/devlog-content（Claude DT専用）
```

### 確認コマンド

```bash
git -C kesson-space worktree list
```

### 新規ワークツリー作成

```bash
cd /Users/uminomae/Documents/GitHub
git -C kesson-space worktree add ../kesson-new -b feature/new-branch
```

### メリット

- main と feature を同時に開ける
- ブランチ切り替えでファイルが入れ替わらない
- **エージェント間の衝突回避**（物理的に別ディレクトリ）

### 注意：checkoutエラー

Worktree構成の場合、別ディレクトリでチェックアウト済みのブランチには切り替えられない。

```
$ git checkout feature/codex-tasks
fatal: 'feature/codex-tasks' is already checked out at '/path/to/kesson-codex'
```

→ 該当ディレクトリに移動して作業する。

---

## 6. Claude Code との違い

| 項目 | Claude.ai + MCP | Claude Code | OpenAI Codex CLI |
|------|----------------|-------------|------------------|
| 実行環境 | ブラウザ/アプリ | ターミナル | ターミナル |
| ローカルアクセス | Codex MCP経由 | 直接 | 直接 |
| リモートアクセス | GitHub MCP | ❌ | ❌ |
| Gemini連携 | ✅ MCP経由 | ❌ | ❌ |
| Memory | ✅ | ❌ | ❌ |
| 並列バックグラウンド | ❌ | ❌ | ✅ |
| 向いている作業 | 設計、ドキュメント、マルチエージェント | コーディング、デバッグ | リサーチ、長時間タスク |

---

## 7. トラブルシューティング

### GitHub MCPでファイルが見つからない

- ブランチ指定を確認（デフォルトはmain）
- パスの大文字小文字を確認

### Codexでコマンドが失敗する

- 絶対パスで指定しているか確認
- ディレクトリが存在するか確認
- 権限エラーの場合はsudo不可（セキュリティ制約）

### Worktreeでブランチ切り替えできない

- 別ディレクトリでチェックアウト済みの可能性
- `git worktree list` で確認

### OpenAI Codex CLIでOTPを毎回求められる

- ChatGPTログインではなくAPI Key認証を使う
- `codex logout` → `codex login --with-api-key` で再設定

---

## 8. 参照リンク

- [README.md](./README.md) — ドキュメントハブ
- [WORKFLOW.md](./WORKFLOW.md) — セッション運用
- [AGENT-RULES.md](./AGENT-RULES.md) — エージェント分業
