# DT → Codex 委譲スキル

## 概要

claude.ai DT アプリ（Desktop/Web チャット）から OpenAI Codex CLI / Codex App にコーディングタスクを委譲する際の手順書。

DT は**プロジェクト管理専任**であり、コード実装を直接行わない。実装は必ず Codex（または Claude Code）に委譲する。

---

## 固定ワークツリー

| ワークツリー | パス | ブランチ | 用途 |
|---|---|---|---|
| kesson-main | ~/dev/kesson-main | main | 本番。読み取り参照用 |
| kesson-claude-dt-check | ~/dev/kesson-claude-dt-check | dev | DT 目視確認・ステージング |
| kesson-codex-app1 | ~/dev/kesson-codex-app1 | (可変) | Codex DT app 用 |
| kesson-codex-app2 | ~/dev/kesson-codex-app2 | (可変) | Codex DT app 用 |
| kesson-codex-app3 | ~/dev/kesson-codex-app3 | (可変) | Codex DT app 用 |
| kesson-codex-cli1 | ~/dev/kesson-codex-cli1 | (可変) | Codex CLI 用 |
| kesson-codex-cli2 | ~/dev/kesson-codex-cli2 | (可変) | Codex CLI 用 |
| kesson-codex-cli3 | ~/dev/kesson-codex-cli3 | (可変) | Codex CLI 用 |

### ワークツリーの使い分け

- **Codex DT app**: ブラウザ版 Codex App から実行する場合は `kesson-codex-app{N}` を使用
- **Codex CLI**: ターミナルから `codex` コマンドで実行する場合は `kesson-codex-cli{N}` を使用
- 並列実行時は空いている番号（1〜3）を使う
- 直列実行時は同じワークツリーでブランチを切り替える

---

## 委譲フロー

### Step 1: Issue 確認
- GitHub Issue が存在するか確認（なければ起票）
- Issue 番号を控える

### Step 2: ブランチ作成
- dev から分岐
- 命名: `feature/kesson-codex-app-{keyword}{issue番号}`

```
DT が GitHub API で実行:
github:create_branch
  branch: feature/kesson-codex-app-{keyword}{issue番号}
  from_branch: dev
```

### Step 3: 指示書作成・プッシュ
- `docs/codex/INSTRUCTION-{issue番号}.md` を作成
- 指示書には以下を必ず含める:
  - Issue リンク
  - ブランチ名
  - **使用ワークツリー（ユーザー指定に従う）**
  - 対象ファイルと修正内容
  - 完了条件
  - 禁止事項（スコープ外変更、新規依存追加）
  - `Fix #{issue番号}` をコミットメッセージに含める指示
  - **完了報告フォーマット**（§完了報告テンプレートを転記）
  - **目視確認用コマンド**（§目視確認用コマンドを転記）

### Step 4: ユーザーにコマンド提示

#### Codex CLI の場合（kesson-codex-cli{N} を使用）
```bash
cd ~/dev/kesson-codex-cli{N}
git fetch
git checkout feature/kesson-codex-app-{keyword}{issue番号}
git pull

codex -a on-failure \
  "リモート feature/kesson-codex-app-{keyword}{issue番号} ブランチの docs/codex/INSTRUCTION-{issue番号}.md を読み、指示に従って作業してください。"
```

#### Codex DT App の場合（kesson-codex-app{N} を使用）
```bash
cd ~/dev/kesson-codex-app{N}
git fetch
git checkout feature/kesson-codex-app-{keyword}{issue番号}
git pull
```
→ Codex App のブラウザ UI から指示書のパスを指定して実行。

---

## 完了報告テンプレート

Codex / Claude Code が作業完了時に出力する報告フォーマット。
**指示書の末尾に必ずこのセクションを転記すること。**

> ⚠️ **実装者（Codex / Claude Code）への指示:**
> 作業完了時、以下のテンプレートを**そのまま埋めて**出力すること。
> 自由形式の報告は禁止。必ずこのフォーマットに従うこと。

````markdown
---
## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-{keyword}{issue番号}`
- ワークツリー: `~/dev/kesson-codex-{app|cli}{N}`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `fix: ... (Fix #XX)`
- push 先: `origin/feature/kesson-codex-app-{keyword}{issue番号}`

### 変更ファイル一覧
- `path/to/file1` — 変更概要
- `path/to/file2` — 変更概要

### 検証結果
- [ ] `node --check` 通過（対象: ...）
- [ ] `git status --short` クリーン
- [ ] その他実行した検証コマンドと結果

### 残作業・注意事項
- （なければ「なし」と記入）
````

---

## 目視確認用コマンド

指示書の末尾に以下も転記すること。ユーザーが目視確認する際のコマンド。
**実装ワークツリーで直接確認する。** serve.sh がポート3001でサーバーを起動する。

````markdown
## 目視確認手順（DT / ユーザー用）
```bash
cd ~/dev/kesson-codex-{app|cli}{N}
./serve.sh
# ブラウザで http://localhost:3001 を開いて確認
```
````

---

## 完了後フロー

1. Codex から完了報告を受領（上記テンプレートで構造化された報告）
2. コミット内容を GitHub API で確認
3. **dev へのマージは目視確認後のみ**
4. ユーザーに目視確認を依頼:
   ```bash
   cd ~/dev/kesson-codex-{app|cli}{N}
   ./serve.sh
   # ブラウザで http://localhost:3001 を開いて確認
   ```
5. 目視確認 OK → dev マージ → Issue クローズコメント
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
- 委譲先（Codex CLI / Codex App）
- 使用ワークツリー（kesson-codex-{app|cli}{N}）
- 状態（⏳未着手 / 🔄実行中 / ✅完了報告済 / 👁️目視確認待ち）
