# Codex Exec スキル — Claude Code CLI から codex exec を叩く

## 概要

Claude Code CLI の bash 環境から `codex exec` を使い、OpenAI Codex にタスクを委譲する。
DT（Claude.ai チャット）が指示書を `docs/prompts/` に push → Claude Code CLI が本スキルに従って実行。

## 重要: 絶対ルール

```
⚠️ codex（インタラクティブモード）は使用禁止
   → "stdout is not a terminal" エラーで失敗する
✅ 常に codex exec（非インタラクティブモード）を使用
```

## 基本コマンド

### 1. 指示書ベース実装（メイン用途）

```bash
# ワークツリーに移動して最新化
cd /Users/uminomae/dev/kesson-codex-cli
git fetch origin && git checkout <branch> && git pull

# 指示書を読ませて自律実装
codex exec \
  --full-auto \
  -m gpt-5.3-codex \
  "docs/prompts/INSTRUCTION-XXXX.md を読み、その指示に従って実装せよ。コミットまで完了すること。"
```

### 2. コードレビュー（読み取り専用）

```bash
codex exec \
  -m gpt-5.3-codex \
  "src/ 以下の最新変更をレビューし、バグ・改善点を報告せよ"
```

### 3. PoC / 一発実装

```bash
codex exec \
  --full-auto \
  -m gpt-5.2-codex \
  "src/shaders/ に新しい X ロゴ用 SDF シェーダーを作成せよ。gem-orb.glsl.js を参考に。"
```

### 4. セッション継続

```bash
# 直前のセッションを再開して追加指示
codex exec resume --last "前回のシェーダーにグロー効果を追加"

# 特定セッション再開
codex exec resume <SESSION_ID> "修正指示"
```

## モデル選択ガイド

| モデル | フラグ | 用途 |
|---|---|---|
| gpt-5.3-codex | `-m gpt-5.3-codex` | メイン（複雑な実装・設計判断あり） |
| gpt-5.2-codex | `-m gpt-5.2-codex` | 高速（単純実装・リファクタ・レビュー） |
| gpt-5.3-codex-spark | `-m gpt-5.3-codex-spark` | 超高速（Pro限定、軽量タスク） |

## サンドボックスモード

| モード | フラグ | 用途 |
|---|---|---|
| 読み取り専用 | （デフォルト） | レビュー・分析 |
| ファイル編集可 | `--full-auto` | 実装・リファクタ |
| フルアクセス | `--sandbox danger-full-access` | npm install 等ネットワーク必要時 |

## ワークツリー対応表

| 用途 | ワークツリーパス | 典型的なブランチ |
|---|---|---|
| Codex CLI 定型 | `/Users/uminomae/dev/kesson-codex-cli` | feature/codex-tasks |
| Codex App 確認 | `/Users/uminomae/dev/kesson-codex-app` | feature/* |
| Claude Code CLI | `/Users/uminomae/dev/kesson-claude-code-cli` | feature/* |

## 実行フロー

```
DT チャット
  │  指示書を docs/prompts/ に push
  │  ブランチ作成（feature/xxx）
  ▼
Claude Code CLI
  │  cd <worktree>
  │  git fetch && checkout && pull
  │  codex exec --full-auto -m gpt-5.3-codex "指示書を読んで実装"
  │  → Codex が自律実装・コミット
  ▼
Claude Code CLI
  │  git push origin <branch>
  │  結果確認・DT に報告
  ▼
DT チャット
  │  目視確認 → dev マージ
```

## 出力の扱い

```bash
# 標準: stderr にプログレス、stdout に最終メッセージ
codex exec "タスク" 2>/dev/null  # プログレス非表示

# ファイルに保存
codex exec -o result.txt "タスク"

# JSON ストリーム（パイプ連携）
codex exec --json "タスク" | jq '.type'
```

## エラー対処

| エラー | 原因 | 対処 |
|---|---|---|
| `stdout is not a terminal` | `codex`（インタラクティブ）を使った | `codex exec` に変更 |
| `Not authenticated` | 未ログイン | `codex login` を実行 |
| `not a git repository` | Git リポジトリ外 | `cd` でワークツリーに移動 |
| sandbox denial | 権限不足 | `--full-auto` または `--sandbox danger-full-access` |

## 注意事項

- `codex exec` は Claude Code の bash 環境では**非ターミナル**で動く。インタラクティブモード専用フラグ（`-a`, `--search`）は使えない
- `--full-auto` でもネットワークアクセスはブロックされる。npm install 等が必要な場合は `--sandbox danger-full-access`
- コミットは Codex が行うが、push は Claude Code CLI 側で `git push` する
- 指示書に禁止事項（main直push禁止等）を必ず含めること
