# session-workflow.md — Claude用: セッション管理ワークフロー

## Role
プロジェクト管理の一貫性を保つ。セッション開始から終了まで、TODO/CURRENTの状態を正確に維持する。

---

## Phase 1: セッション開始

### 1.1 状態読み込み
```
必須: GitHub main から以下を取得
- docs/TODO.md（タスク正本）
- docs/CURRENT.md（セッション状態）
- 直近コミット履歴（5〜10件）
```

### 1.2 状況報告
ユーザーに以下を提示:
- 現在のセッション番号
- P0/P1タスクの有無
- 直近の完了タスク
- 未完了タスクのサマリー

### 1.3 乖離チェック
CURRENT.mdとコミット履歴に乖離がある場合:
- ユーザーに報告
- 必要に応じてCURRENT.md/TODO.mdを更新

---

## Phase 2: タスク選択

### 2.1 優先度順
```
P0（即対応） → P1（次に着手） → P2（急がない） → P3（アイデア）
```

### 2.2 ユーザー確認
- タスクIDと内容を提示
- 着手の承認を得る
- 複数タスクの場合は順序を確認

---

## Phase 3: タスク実行

### 3.1 実行モード判定

| 条件 | モード |
|------|--------|
| シェーダー/Three.js | Claude Code指示書 → Codex/Gemini委譲 |
| config/HTML/CSS/ドキュメント | Claude直接実装 |
| 複数ファイル横断 | Claude Code指示書 |
| 軽微な修正（1ファイル） | Claude直接実装 |

### 3.2 Claude Code指示書テンプレート
```markdown
## Claude Code 指示書: T-XXX

### タスク概要
[1行で概要]

### ブランチ
cd /Users/uminomae/kesson-codex  # or kesson-claudeCode
git fetch origin
git checkout feature/codex-tasks  # or feature/claude-code
git pull origin main

### 対象ファイル
- path/to/file1.js
- path/to/file2.js

### 変更内容
[具体的な変更指示]

### コミット
feat/fix/docs: T-XXX [簡潔な説明]

### 完了条件
- [ ] 条件1
- [ ] 条件2
```

### 3.3 直接実装時のルール
- GitHub API経由でコミット
- コミットメッセージ形式: `type: T-XXX description`
- type: feat, fix, docs, refactor, test, ci

---

## Phase 4: セッション終了

### 4.1 必須アクション（Claudeの義務）
```
対話終了前に必ず実行:
1. CURRENT.md更新
   - セッション番号・日付
   - 実施内容サマリー
   - 未完了タスク更新
2. TODO.md更新
   - 完了タスク → 完了済みセクションに移動
   - 新規発見タスク → 適切な優先度で追加
3. コミット・プッシュ
   - メッセージ: docs: session #XX end — update CURRENT/TODO
```

### 4.2 完了報告
ユーザーに以下を提示:
- 完了したタスク一覧
- 残りのP0/P1タスク
- 次回の推奨タスク

---

## チェックリスト

### セッション開始時
- [ ] TODO.md/CURRENT.md読み込み済み
- [ ] コミット履歴との整合性確認済み
- [ ] ユーザーにタスク提案済み

### セッション終了時
- [ ] CURRENT.md更新済み
- [ ] TODO.md更新済み
- [ ] GitHub にプッシュ済み
- [ ] ユーザーに完了報告済み

---

## 禁止事項

- セッション終了時のCURRENT/TODO更新を省略すること
- ユーザー未確認でのタスク着手
- コミット履歴との乖離を放置すること
