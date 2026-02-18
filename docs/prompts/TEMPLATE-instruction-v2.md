# 指示書: T-XXX タスク名

> **この指示書の内容のみ実行すること。** 指示書に記載のない変更は禁止。

| 項目 | 値 |
|------|-----|
| タスクID | T-XXX |
| 作成日 | YYYY-MM-DD |
| 優先度 | P0 / P1 / P2 |
| 委譲先 | DT App Code / Claude Code CLI / Codex |

---

## 環境判別

本指示書を受け取ったエージェントは、実装開始前に以下を順に試し環境を判定する:

```
判定フロー:
1. bash_tool で `ls /Users/uminomae/dev/` → 成功 → 【ローカル CLI 環境】
2. bash_tool が使えるが上記失敗 → 【DT App Code 環境】（サンドボックス）
3. bash_tool 自体がない → 【API Only 環境】
```

環境別の操作は `skills/env-adaptive.md` §2 に従う。

---

## 出力先

- ワークツリー: `{ワークツリーパス}`
- ブランチ: `feature/{ブランチ名}`

### ブランチ同期（CLI 環境の場合）

```bash
cd {ワークツリーパス}
git fetch origin
git checkout -b feature/{ブランチ名} origin/main
```

### ブランチ同期（DT App Code 環境の場合）

```
github:create_branch — base: main, branch: feature/{ブランチ名}
```

---

## 目的

{このタスクが解決する問題と、なぜ必要かを1-3行で記載}

---

## 完了条件

1. {具体的な完了条件1}
2. {具体的な完了条件2}
3. コミット & プッシュ完了

---

## 対象ファイル

| ファイル | 操作 | 概要 |
|----------|------|------|
| `path/to/file1` | 編集 | {変更概要} |
| `path/to/file2` | 新規作成 | {概要} |

---

## 実装手順

### Step 1: {ステップ名}

- 対象: `{ファイルパス}`
- 操作: {具体的な変更内容}

### Step 2: {ステップ名}

- 対象: `{ファイルパス}`
- 操作: {具体的な変更内容}

### Step N: コミット & プッシュ

**CLI 環境:**
```bash
git add -A
git commit -m "{conventional commit message (T-XXX)}"
git push origin feature/{ブランチ名}
```

**DT App Code 環境:**
```
github:create_or_update_file で各ファイルをコミット
（push は API 経由で自動）
```

---

## テスト（該当する場合）

```bash
{テスト実行コマンド}
```

---

## 禁止事項

- main ブランチへの直接 push 禁止
- dev への直接マージ禁止
- src/ 配下のコード変更（ドキュメント系タスクの場合）
- index.html の変更（ドキュメント系タスクの場合）
- この指示書に記載のない変更

---

## 参照

- {関連ドキュメントへのリンク}
- `skills/env-adaptive.md` — 環境適応スキル
