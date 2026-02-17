# DT → Codex 委譲スキル

## 概要

claude.ai DT アプリ（Desktop/Web チャット）から OpenAI Codex CLI / Codex App にコーディングタスクを委譲する際の手順書。

DT は**プロジェクト管理専任**であり、コード実装を直接行わない。実装は必ず Codex（または Claude Code）に委譲する。

---

## 固定ワークツリー

| ワークツリー | パス | ブランチ | 用途 |
|---|---|---|---|
| kesson-main | ~/dev/kesson-main | main | 本番。読み取り参照用 |
| kesson-claude-dt-check | ~/dev/kesson-claude-dt-check | feature/dev | DT 目視確認・ステージング |
| kesson-codex-app | ~/dev/kesson-codex-app | (可変) | Codex 直列実行用 |

### 一時ワークツリー（並列時のみ）

並列実行が必要な場合のみ追加作成。命名規則: `kesson-codex-app-{suffix}`

```bash
cd ~/dev/kesson-main
git worktree add ../kesson-codex-app-{suffix} feature/kesson-codex-app-{suffix}
```

直列実行（大半のケース）では **kesson-codex-app で checkout を切り替えるだけ**。新規ワークツリーは不要。

---

## 直列 vs 並列の判断

| 条件 | 方式 |
|------|------|
| タスク1本、依存なし | **直列**: kesson-codex-app でブランチ切替 |
| 独立タスク2本以上、同時進行したい | **並列**: 一時ワークツリーを追加 |
| 依存関係あり（A完了後にB） | **直列**: 順番に実行 |

---

## 委譲フロー

### Step 1: Issue 確認
- GitHub Issue が存在するか確認（なければ起票）
- Issue 番号を控える

### Step 2: ブランチ作成
- feature/dev から分岐
- 命名: `feature/kesson-codex-app-{keyword}{issue番号}`

```
DT が GitHub API で実行:
github:create_branch
  branch: feature/kesson-codex-app-{keyword}{issue番号}
  from_branch: feature/dev
```

### Step 3: 指示書作成・プッシュ
- `docs/codex/INSTRUCTION-{issue番号}.md` を作成
- 指示書には以下を必ず含める:
  - Issue リンク
  - ブランチ名
  - 対象ファイルと修正内容
  - 完了条件
  - 禁止事項（スコープ外変更、新規依存追加）
  - `Fix #{issue番号}` をコミットメッセージに含める指示

### Step 4: ユーザーにコマンド提示

#### 直列（kesson-codex-app 再利用）
```bash
cd ~/dev/kesson-codex-app
git fetch
git checkout feature/kesson-codex-app-{keyword}{issue番号}
git pull

codex --approval-mode on-failure \
  "リモート feature/kesson-codex-app-{keyword}{issue番号} ブランチの docs/codex/INSTRUCTION-{issue番号}.md を読み、指示に従って作業してください。"
```

#### 並列（一時ワークツリー）
```bash
cd ~/dev/kesson-main
git fetch
git worktree add ../kesson-codex-app-{suffix} feature/kesson-codex-app-{suffix}
cd ../kesson-codex-app-{suffix}

codex --approval-mode on-failure \
  "リモート feature/kesson-codex-app-{suffix} ブランチの docs/codex/INSTRUCTION-{issue番号}.md を読み、指示に従って作業してください。"
```

---

## 完了後フロー

1. Codex から完了報告を受領
2. コミット内容を GitHub API で確認
3. **feature/dev へのマージは目視確認後のみ**
4. ユーザーに目視確認を依頼:
   ```bash
   cd ~/dev/kesson-claude-dt-check
   git pull
   # serve.sh で動作確認
   ```
5. 目視確認 OK → feature/dev マージ → Issue クローズコメント
6. **確認前に次作業・docs 更新・指示書作成は絶対禁止**

---

## 禁止事項（DT の自制ルール）

| 禁止 | 理由 |
|------|------|
| DT が直接コードを実装・プッシュ | 品質管理の責務分離 |
| 目視確認前に main マージ | 本番破壊防止 |
| 目視確認前に次タスク着手 | 未確認作業の積み上がり防止 |
| ワークツリー・ブランチ指示の省略 | 委譲先の混乱防止 |

---

## セッション状態管理

委譲後のセッション状態を `~/Library/Caches/kesson-agent/session/state.md` に記録:
- ブランチ名と Issue 番号
- 委譲先（Codex / Claude Code）
- 状態（⏳未着手 / 🔄実行中 / ✅完了報告済 / 👁️目視確認待ち）
