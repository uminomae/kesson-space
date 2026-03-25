<!-- Ported from: creation-space (2026-03-24) -->
# 並行作業・ワークツリー運用ルール

## 概要

Claude Code の Agent ツール（subagent / worktree / background）を活用し、複数タスクを並行処理する。
本体セッション（CLI または Desktop App）がプロジェクトマネージャーとして全レーンを統括する。

## 3レーン構成

| レーン | 実行方式 | 用途 | 判断レベル |
|--------|---------|------|-----------|
| **Main** | 本体セッション | 設計決定、優先順位判断、最終検証 | 高 |
| **Agent-BG** | Agent(background) | 調査、検証、Issue 操作、報告生成 | 低〜中 |
| **Agent-WT** | Agent(background, worktree) | ファイル編集を伴う独立タスク | 中 |

## ワークツリー運用方針

- 本体（`/Users/uminomae/dev/kesson-space`）は常時 develop ブランチを checkout（localhost:3001 で配信）
- Agent-WT は必ず `isolation: "worktree"` で分離されたワークツリーで作業する
- 常設ワークツリーは使用しない。Agent-WT のワークツリーは Issue クローズ時に削除する

## ワークツリー適用基準

| 条件 | ワークツリー |
|---|---|
| ファイル編集を伴う Agent 委譲 | 必ず使用（`isolation: "worktree"`） |
| 完了条件が曖昧・探索的 | 使用しない（Agent-BG で調査のみ） |

ワークツリー作成時に事前明確化する項目:

1. 完了条件
2. マージ先（原則 `develop`）
3. 後処理（develop マージ → ワークツリー削除 → feature ブランチ削除）

## ファイル所有権（競合防止）

原則: 1ファイルを同時に2レーンが編集しない。

Main がタスク振り分け時に対象ファイルを明示し、所有権を割り当てる。

```text
Agent-WT(shader-fix): src/shaders/particle.vert, src/shaders/particle.frag
Agent-BG(config-check): src/config/ -> READ ONLY
Main:                   上記以外の全ファイル
```

共有禁止ファイル（常に Main のみ編集）:

- `CLAUDE.md`
- `.claude/rules/*.md`
- `.cache/session/state.md`
- `.cache/backlog.md`

## タスク分類基準

### Main 向き

- 設計決定・アーキテクチャ変更
- 複数レーンにまたがる優先順位調整
- 競合解消とマージ判断
- オーナー確認が必要な判断

### Agent-WT 向き

- `src/` の局所的な UI 修正
- `docs/` の構造整理
- `scripts/` の単機能追加や修正
- 完了条件が明確な複数ファイル編集

### Agent-BG 向き

- ファイル存在確認、Issue 状態確認
- grep / diff ベースの検証
- Issue コメント投稿
- DONE ファイル作成

## 本体（Main）の PM 責務

1. 作業開始時にレーン割当とファイル所有権を宣言する
2. Agent-BG / Agent-WT を必要に応じて並行起動する
3. background タスクの完了通知を監視し、結果を検証する
4. `.claude/rules/agent-completion.md` に従って完了処理を確認する
5. Agent-WT の成果を `develop` にマージするか判断する
6. 必要な状態ファイルと進捗管理ファイルを更新する

## Agent プロンプト必須要素

Issue に紐づく Agent subagent を起動する場合、以下をプロンプトに含める。

```text
## 完了処理（必須）

1. 完了条件を自己検証し、結果を報告に含めること
2. `gh issue comment {issue} -R uminomae/kesson-space --body "..."` を実行すること
3. `.cache/outbox/DONE-{issue}-{YYYYMMDD}.md` を作成すること
```

## マージプロトコル

1. Agent-WT 完了後、本体が diff を確認する
2. 品質基準を満たしていれば `develop` にマージし、push する
3. ワークツリーを `git worktree remove` で削除する
4. feature ブランチを `git branch -d` で削除する
5. 問題があれば本体が修正するか、Agent-WT を再起動する

## フリーズガード（Agent-WT）

| 対策 | 実装 | 目的 |
|------|------|------|
| **max_turns 制限** | `Agent(max_turns: N)` | N ターンで強制停止 |
| **出力監視** | `Read` or `tail` on output_file | 進捗を本体から確認 |
| **強制停止** | `TaskStop(task_id)` | フリーズ時に手動停止 |

### max_turns 目安

| タスク種別 | 推奨 max_turns |
|-----------|---------------|
| 形式修正・並べ替え | 10-15 |
| 比較 + 反映 | 20-25 |
| 複数ファイルのテンプレート適用 | 15-20 |

## 注意事項

- Agent-WT は push しない。本体がマージと push を行う
- Agent-BG は作業本体ではなく検証と報告に集中する
- 並行 push が発生する場合、2つ目以降は `git pull --rebase origin develop` を commit 後・push 前に入れる
- 3レーン以上の同時実行はレート制限リスクがあるため、2並行を推奨する
- Agent-WT 起動時は `max_turns` を必ず設定する
