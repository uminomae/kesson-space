<!-- Ported from: creation-space (2026-03-24) -->
# ルール x 守護者マトリクス

**バージョン**: 1.0
**更新日**: 2026-03-24
**採番規則**: KS-NNN（kesson-space 固有）

## レビュー手順

### トリガー

| 状況 | やること |
|---|---|
| 新規ルール・制約・ガイドを追加したとき | KS-ID を割り当て、守護者（主）（副）を決定 |
| periodic-review 時 | 守護者不在行（守護者（主）が空欄）を走査 |

### 手順

1. 本マトリクスを開く
2. 該当ルールの KS-ID を特定（なければ新規採番: 末尾 +1）
3. 守護者（主）（副）が適切か確認。不在なら割り当てを提案
4. 正本ファイルとの対応が最新か確認
5. 変更があれば本マトリクスを更新し、commit に含める

## 概要

本マトリクスは、`CLAUDE.md`、`.claude/rules/*.md`、`.claude/hooks/` にある運用ルールを、
「誰がチェックするか（守護者）」と「いつチェックするか（タイミング）」で再配置したものである。

守護者の凡例:
- **hook**: `.claude/hooks/` のスクリプトが自動チェック
- **CLI自律**: Claude Code CLI が自律的にチェック
- **オーナー**: pjdhiro が判断

## マトリクス

### セッションヘルス（CLAUDE.md §3 SH ガード）

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 |
|---|---|---|---|---|---|
| KS-001 | SH-1: シェーダー全文読み込みは2ファイルまで。超過時はセクション指定に切替 | CLI自律 | -- | シェーダー読込時 | `CLAUDE.md` §3 SH |
| KS-002 | SH-2: 長大なコード出力時は分割出力を提案 | CLI自律 | -- | コード出力時 | `CLAUDE.md` §3 SH |
| KS-003 | SH-3: 累積ファイル参照8超で参照整理を提案 | CLI自律 | -- | ファイル参照時 | `CLAUDE.md` §3 SH |
| KS-004 | SH-4: 連続ツール呼び出し5回で中間確認 | CLI自律 | -- | ツール呼び出し時 | `CLAUDE.md` §3 SH |
| KS-005 | SH-5: Gemini MCP応答はdiffのみ抽出（全文保持しない） | CLI自律 | -- | Gemini MCP応答時 | `CLAUDE.md` §3 SH |
| KS-006 | SH-6: 高負荷タスク開始前にコンテキスト残量を事前判定 | CLI自律 | -- | タスク開始前 | `CLAUDE.md` §3 SH |

### プロジェクト管理（CLAUDE.md §3 PM ガード）

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 |
|---|---|---|---|---|---|
| KS-007 | PM-1: タスク分類（実装/修正/コンテンツ/レビュー/シェーダー） | CLI自律 | -- | タスク認識時 | `CLAUDE.md` §3 PM |
| KS-008 | PM-2: 委譲先判断（§6マトリクス参照） | CLI自律 | -- | タスク認識時 | `CLAUDE.md` §3 PM, §6 |
| KS-009 | PM-3: 指示書生成 | CLI自律 | -- | 委譲時 | `CLAUDE.md` §3 PM |
| KS-010 | PM-4: ワークツリー割り当て（§2参照） | CLI自律 | -- | タスク認識時 | `CLAUDE.md` §3 PM, §2 |
| KS-011 | PM-5: 並列実行可否を明記 | CLI自律 | -- | タスク振り分け時 | `CLAUDE.md` §3 PM |
| KS-012 | PM-6: DT確認手順を含める | CLI自律 | -- | 委譲時 | `CLAUDE.md` §3 PM |

### 品質ガード（CLAUDE.md §3 QG）

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 |
|---|---|---|---|---|---|
| KS-013 | QG: src/config.js = Single Source of Truth。パラメータは必ずここに定義 | CLI自律 | -- | パラメータ変更時 | `CLAUDE.md` §3 QG |
| KS-014 | QG: 変更箇所に `// CHANGED(YYYY-MM-DD)` コメント付与 | CLI自律 | -- | コード変更時 | `CLAUDE.md` §3 QG |
| KS-015 | QG: シェーダー/GLSL実装 -> Gemini MCPに委譲（ユーザー許可時のみ） | CLI自律 | オーナー | シェーダー変更時 | `CLAUDE.md` §3 QG, §6 |
| KS-016 | QG: テスト: `node tests/config-consistency.test.js` + `?test` E2E | CLI自律 | -- | コミット前 | `CLAUDE.md` §3 QG |

### セッション管理

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 | hook |
|---|---|---|---|---|---|---|
| KS-017 | セッション開始時に branch 確認・git status・README.md を読む | hook | CLI自律 | セッション開始時 | `CLAUDE.md` §4 | session-start-guard.sh |
| KS-018 | state.md / backlog.md 書き換え時に lock 取得->読込->更新->解放する | hook | CLI自律 | state 更新時 | `.claude/rules/state-sync.md` | state-lock-guard.sh |
| KS-019 | セッションログを `.cache/session/log-*.md` に作成する | CLI自律 | -- | セッション終了時 | `.claude/rules/session-management.md` | -- |
| KS-020 | handoff ファイルの命名・確認・読了追記・archive ルールを守る | CLI自律 | -- | セッション開始/読了時 | `.claude/rules/session-management.md` | -- |

### state.md / backlog.md 同期

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 | hook |
|---|---|---|---|---|---|---|
| KS-021 | Issue 起票と backlog.md 更新は同一ターンで実行する（分離禁止） | hook | CLI自律 | Issue 起票時 | `.claude/rules/state-sync.md` | issue-sync-guard.sh |
| KS-022 | commit & push 後に state.md の HEAD SHA を更新する | CLI自律 | -- | push 後 | `.claude/rules/state-sync.md` | -- |
| KS-023 | タスク完了時に state.md から削除し backlog.md に完了フラグを立て Issue にコメントする | CLI自律 | -- | タスク完了時 | `.claude/rules/state-sync.md` | issue-sync-guard.sh |

### Agent 運用

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 | hook |
|---|---|---|---|---|---|---|
| KS-024 | Agent 起動時に下流消費者リストと完了処理をプロンプトに含める | CLI自律 | -- | Agent 起動時 | `.claude/rules/agent-completion.md` | -- |
| KS-025 | Agent 完了報告を Read/Grep で検証し、Issue コメント・backlog を同一ターンで処理する | CLI自律 | -- | Agent 完了時 | `.claude/rules/agent-completion.md` | -- |
| KS-026 | Agent は state.md / backlog.md を操作しない。投入側の責務 | CLI自律 | -- | Agent 実行中 | `.claude/rules/agent-completion.md` | -- |
| KS-027 | エージェント指示は中立的な表現で記述する（忖度誘導を避ける） | CLI自律 | -- | 指示書作成時 | `.claude/rules/agents.md` | -- |
| KS-028 | Agent-WT 起動時は max_turns を必ず設定する（フリーズ防止） | CLI自律 | -- | Agent-WT 起動時 | `.claude/rules/parallel-worktree.md` | -- |
| KS-029 | ファイル所有権を宣言し、1ファイルを同時に2レーンが編集しない | CLI自律 | -- | Agent 振り分け時 | `.claude/rules/parallel-worktree.md` | -- |
| KS-030 | 共有禁止ファイル（CLAUDE.md, .claude/rules/*, state.md, backlog.md）は Main のみ編集 | CLI自律 | -- | Agent 実行中 | `.claude/rules/parallel-worktree.md` | -- |

### 読込・参照

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 | hook |
|---|---|---|---|---|---|---|
| KS-031 | repo ルート外での作業を禁止する | hook | -- | ファイルアクセス時 | セキュリティ原則 | read-path-guard.sh |
| KS-032 | 大きなファイルは全文読まずセクション指定で読む | hook | CLI自律 | ファイル読込時 | `.claude/rules/docs-navigator.md` | read-path-guard.sh |
| KS-033 | docs/ や .claude/rules/ を読む前に CLAUDE.md を確認する | hook | CLI自律 | docs 読込時 | 運用原則 | read-path-guard.sh |

### セキュリティ・保護

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 | hook |
|---|---|---|---|---|---|---|
| KS-034 | 機密情報（トークン、キー、パスワード等）をファイル操作で参照・漏洩しない | hook | -- | ファイル読み書き時 | セキュリティ原則 | credential-guard.sh |
| KS-035 | Bash コマンドで外部へのデータ送信を検知・防止する | hook | -- | Bash 実行時 | セキュリティ原則 | exfil-guard.sh |
| KS-036 | 破壊的 Git コマンド（reset --hard, push --force 等）を検知・警告する | hook | -- | Bash 実行時 | セキュリティ原則 | destructive-command-guard.sh |

### 指示書

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 | hook |
|---|---|---|---|---|---|---|
| KS-037 | 指示書の編集時に前提条件（CLAUDE.md, README.md 読了）を満たしているか確認する | hook | CLI自律 | 指示書 Edit/Write 時 | 指示書運用規約 | instruction-prereq-guard.sh |
| KS-038 | 指示書の lint チェック（完了条件・bash ブロック必須化） | hook | CLI自律 | 指示書 Edit/Write 後 | 指示書運用規約 | instruction-lint.sh |

### メモリ・状態管理

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 | hook |
|---|---|---|---|---|---|---|
| KS-039 | CLI メモリと .cache/ に同じ情報を書かない（重複禁止） | CLI自律 | -- | メモリ書き込み時 | `.claude/rules/memory-policy.md` | -- |
| KS-040 | CLI メモリにはコード構造・ファイルパス・Git 履歴・セッション状態を書かない | CLI自律 | -- | メモリ書き込み時 | `.claude/rules/memory-policy.md` | -- |

### Git・コミット

| KS-ID | ルール要旨 | 守護者（主） | 守護者（副） | チェックタイミング | 正本 | hook |
|---|---|---|---|---|---|---|
| KS-041 | main への直接 push は行わない。PR経由でマージする | CLI自律 | -- | push 時 | `CLAUDE.md` §5 | -- |
| KS-042 | セッション終了時に develop にマージしてサーバーを起動する | CLI自律 | -- | セッション終了時 | `CLAUDE.md` §5 | -- |

## hook カバレッジサマリ

| hook スクリプト | カバー KS-ID | トリガー |
|---|---|---|
| `session-start-guard.sh` | KS-017 | SessionStart |
| `credential-guard.sh` | KS-034 | PreToolUse(Read/Glob/Grep/Bash) |
| `read-path-guard.sh` | KS-031, KS-032, KS-033 | PreToolUse(Read/Glob/Grep/Bash), PostToolUse(Read) |
| `exfil-guard.sh` | KS-035 | PreToolUse(Bash) |
| `destructive-command-guard.sh` | KS-036 | PreToolUse(Bash) |
| `state-lock-guard.sh` | KS-018 | PreToolUse(Edit/Write), Stop |
| `instruction-prereq-guard.sh` | KS-037 | PreToolUse(Edit/Write) |
| `backslash-bang-guard.sh` | -- | PostToolUse(Edit/Write) |
| `instruction-lint.sh` | KS-038 | PostToolUse(Edit/Write) |
| `issue-sync-guard.sh` | KS-021, KS-023 | PostToolUse(Bash), Stop |

## 更新履歴

| 日付 | バージョン | 内容 |
|---|---|---|
| 2026-03-24 | 1.0 | 初版。CLAUDE.md / .claude/rules/ / .claude/hooks/ から42件のルールを抽出 (#139) |
