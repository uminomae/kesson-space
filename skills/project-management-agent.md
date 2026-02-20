**原則: README.md を最上位とし、プロジェクト管理は Claude/Codex/Gemini を含む任意のLLMで動作する共通体系とする（Codex専用環境は前提にしない）。**

# project-management-agent.md — Project Management Rulebook

## 0. Role
このファイルは `kesson-space` のプロジェクト管理を「ルールで自律判断」するための実行規約。
目的は次の3点。

1. 判断のばらつきを減らす
2. ユーザー確認が必要な場面だけを明確化する
3. Issueベースで状態遷移を一貫管理する

優先順位は `User request > README.md > AGENTS.md > this file > docs/*`。

---

## 1. Source Of Truth

- 正本は GitHub Issues / Issue comments / PR。
- `docs/CURRENT.md` と `docs/TODO.md` は廃止済み。読まない・更新しない。
- 進捗共有は必ず Issue コメントで行う（Start / Interim / Completion）。

---

## 2. Autonomy Charter

### 2.1 Auto-Decide (ユーザー確認不要)

| 項目 | 自動判断ルール |
|---|---|
| 次に扱うIssue | `P0 > P1 > P2 > P3`。同優先度は「更新が古い順」。さらに同率なら「Issue番号が小さい順」 |
| 委譲先選定 | §4 の委譲マトリクスを適用 |
| ブランチ名 | `feature/issue-<number>-<slug>` を標準採用 |
| 既存ブランチ再利用 | `issue-<number>` を含むリモートブランチがある場合は最新更新ブランチを再利用 |
| 指示書配置 | `docs/prompts/INSTRUCTION-<issue-number>.md` |
| 進捗コメント | Start / Interim / Completion を必須で投稿 |
| 目視確認待ち中の動作 | 同Issueでの追加実装を停止し、回答待ち状態を維持 |

### 2.2 Ask-Then-Proceed (要ユーザー確認)

| 項目 | 確認理由 |
|---|---|
| `dev -> main` の最終マージ | 公開影響があるため |
| Issue本文にないスコープ追加 | 要件変更に当たるため |
| UI/演出の大幅変更 | 期待値の差分が出やすいため |
| 依存追加・削除 | 保守コストに影響するため |
| ラベル/優先度変更 | 計画そのものを変更するため |

### 2.3 Stop And Escalate (作業停止して確認)

| 条件 | 停止アクション |
|---|---|
| ルール間で矛盾があり解釈不能 | 競合箇所を提示して確認 |
| 作業中に想定外の変更を検出 | 変更内容を提示して方針確認 |
| 受け入れ条件が不十分で実装方針が複数成立 | 比較案を提示して選択依頼 |
| セキュリティ/法務リスクが疑われる変更 | リスク提示して明示承認待ち |

---

## 3. Issue Triage Algorithm

Open Issues を次の順に分類する。

1. `BLOCKED`: `blocked` / `needs-info` ラベルあり
2. `WAIT_VISUAL`: `dev` 反映済みで目視確認待ちコメントあり
3. `IN_PROGRESS`: 実装ブランチあり、`main` 未取り込み
4. `READY`: 上記以外

優先スコア:

- P0 = 400
- P1 = 300
- P2 = 200
- P3 = 100
- 最終更新からの経過日数を加点（1日=+1、上限+30）
- `BLOCKED` は `-1000`

同点時:

1. Issue番号が小さいもの
2. それでも同じならコメント数が多いもの

---

## 4. Delegation Matrix

### 4.1 実装

| 条件 | 委譲先 | 補足 |
|---|---|---|
| `src/shaders/` や GLSL が主対象 | Gemini MCP | シェーダー特化 |
| Three.js構成変更が主対象（複数ファイル） | Codex or Claude Code | 先にCodexを試す |
| JS/CSS/HTML の通常実装 | Codex | 既定の実装先 |
| ドキュメント整備のみ | PMホストが直接対応 | 委譲不要 |

### 4.2 レビュー

| 条件 | 委譲先 |
|---|---|
| GLSL品質・視覚品質 | Gemini review |
| 構造/保守性/回帰 | Codex review or host review |

### 4.3 フォールバック

1. 第一候補が失敗したら第二候補へ切替
2. 2回連続で失敗したらユーザーへ報告し、手動方針を確認

---

## 5. Branch And Worktree Rules

### 5.1 絶対ルール

- `main` へ直接コミットしない
- 実装ブランチは必ず `main` 起点で作成
- リリース経路は `implementation -> dev -> main`
- 1 Issue 1 ブランチ 1 実装ワークツリーを原則とする

### 5.2 ブランチ再利用判定

次を満たす場合のみ既存ブランチを再利用する。

1. ブランチ名に `issue-<number>` を含む
2. Issueの目的とブランチの直近コミット意図が一致する
3. 未マージの作業が残っている

いずれかを満たさない場合は新規作成。

---

## 6. State Machine

| 状態 | 入口条件 | PMの必須アクション | 次状態 |
|---|---|---|---|
| `READY` | 着手可能Issue | Startコメント投稿、ブランチ確定 | `IN_PROGRESS` |
| `IN_PROGRESS` | 実装中 | Interimコメント更新、リスク監視 | `REVIEW_READY` |
| `REVIEW_READY` | 実装完了報告あり | Completionコメント、`dev` 反映準備 | `WAIT_VISUAL` |
| `WAIT_VISUAL` | `dev` 反映済み | 目視確認手順提示、停止待機 | `FIX_REQUIRED` or `READY_TO_MERGE_MAIN` |
| `FIX_REQUIRED` | 目視NG | 同一Issueで修正指示書を発行 | `IN_PROGRESS` |
| `READY_TO_MERGE_MAIN` | 目視OK | PR作成（`Closes #<issue>`） | `DONE` |
| `DONE` | main取り込み完了 | Issueクローズ確認 | - |

`WAIT_VISUAL` 中は、同Issueの新規分析・新規指示書作成を禁止。

---

## 7. Mandatory Issue Comment Format

### 7.1 Start

```text
🚀 Started
- Branch: `feature/issue-XX-...`
- Worktree: `/Users/uminomae/dev/...` (if applicable)
- Approach: <one-line plan>
```

### 7.2 Interim

```text
🛠️ Interim update
- Done: <what changed>
- Risk/Blocker: <if any>
- Next: <next concrete step>
```

### 7.3 Completion

```text
✅ Implementation complete
- Commit: `<sha>`
- Changed: `<file1>`, `<file2>`
- Tests: `<command/result>`
- Outstanding: none | <items>
```

---

## 8. Instruction File Contract

実装委譲時、指示書には必ず次を含める。

1. 対象Issue URL
2. 作業ブランチ名
3. 対象ファイル
4. 変更してよい範囲 / 禁止範囲
5. 完了条件（テスト観点を含む）
6. 完了報告フォーマット（§7.3）

委譲文の締めは次の形式を使う。

`リモート '<branch>' の 'docs/prompts/INSTRUCTION-<issue>.md' を読んで実行してください。`

---

## 9. Definition Of Done (PM)

以下が揃って `DONE` と判断する。

1. 実装コミットが `main` に到達
2. PR本文に `Closes #<issue>` が含まれる
3. Issueが closed（またはクローズ理由が記録済み）
4. 回帰テスト結果が Issue か PR に記録済み

---

## 10. Forbidden Actions

- 目視確認前に次タスクへ着手する
- `main` へ直接コミットする
- `docs/CURRENT.md` / `docs/TODO.md` を更新する
- ブランチ名なしで指示書を渡す
- 未確認のままスコープを拡張する
- リスク検知時に無言で進める

---

## 11. Related Docs

- `/Users/uminomae/dev/kesson-space/AGENTS.md`
- `/Users/uminomae/dev/kesson-space/docs/AGENT-RULES.md`
- `/Users/uminomae/dev/kesson-space/docs/WORKFLOW.md`
