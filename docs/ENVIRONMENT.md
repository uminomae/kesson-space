# ENVIRONMENT.md — 開発環境・ツールチェーン

**バージョン**: 1.0
**作成日**: 2026-02-15

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
```

### 環境ごとの能力

| 環境 | リモート操作 | ローカル操作 | MCP連携 |
|------|-------------|-------------|--------|
| Claude.ai + MCP | ✅ GitHub MCP | ✅ Codex MCP | ✅ |
| Claude Code (CLI) | ❌ | ✅ 直接 | ❌ |

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

## 4. Worktree運用

kesson-spaceでは `git worktree` を使い、ブランチごとに別ディレクトリで作業する。

### 構成

```
/Users/uminomae/Documents/GitHub/
├── kesson-space/          ← main ブランチ
└── kesson-space-feature/  ← feature/* ブランチ
```

### メリット

- main と feature を同時に開ける
- ブランチ切り替えでファイルが入れ替わらない
- 比較しながら作業できる

### Codex経由でのWorktree操作

```
# mainディレクトリで作業
codex:codex prompt="cd /Users/uminomae/Documents/GitHub/kesson-space && git status"

# featureディレクトリで作業
codex:codex prompt="cd /Users/uminomae/Documents/GitHub/kesson-space-feature && git status"
```

### 注意：checkoutエラー

Worktree構成の場合、別ディレクトリでチェックアウト済みのブランチには切り替えられない。

```
$ git checkout feature/test-enhancements
fatal: 'feature/test-enhancements' is already checked out at '/path/to/kesson-space-feature'
```

→ 該当ディレクトリに移動して作業する。

---

## 5. Claude Code との違い

| 項目 | Claude.ai + MCP | Claude Code |
|------|----------------|-------------|
| 実行環境 | ブラウザ/アプリ | ターミナル |
| ローカルアクセス | Codex MCP経由 | 直接 |
| リモートアクセス | GitHub MCP | ❌ |
| Gemini連携 | ✅ MCP経由 | ❌ |
| Memory | ✅ | ❌ |
| 向いている作業 | 設計、ドキュメント、マルチエージェント | コーディング、デバッグ |

Claude Codeは「ローカルは見れるがMCPは使えない」、Claude.ai + MCPは「MCP経由でローカルを見る」という構成。

---

## 6. トラブルシューティング

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

---

## 7. 参照リンク

- [README.md](./README.md) — ドキュメントハブ
- [WORKFLOW.md](./WORKFLOW.md) — セッション運用
- [AGENT-RULES.md](./AGENT-RULES.md) — エージェント分業
