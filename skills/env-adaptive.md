# 環境適応スキル — 指示書の環境非依存化

## 1. DT チャットでの委譲先判別ルール

ユーザーの発話から委譲先を判定する。code と codex の入力ミスはユーザー側にないと保証されている。

| ユーザーの発話パターン | 委譲先 | 識別キー |
|---|---|---|
| 「claude code」「cli」「CLI」 | Claude Code CLI | `code`（xなし） |
| 「codex」「Codex」 | OpenAI Codex（CLI or App） | `codex`（x あり） |
| 「dt code」「DT Code」「app code」 | DT App Code（Claude.ai bash_tool） | `dt` |
| 「gemini」「Gem MCP」 | Gemini MCP | `gemini` |

**判定の優先順位**: `codex`（x含む） > `dt` > `code` > 文脈推定

## 2. 環境自己判別（指示書を受け取った側が実行）

指示書を受け取ったエージェントは、実装開始前に以下を順に試し環境を判定する:

```
判定フロー:
1. bash_tool で `ls /Users/uminomae/dev/` → 成功 → 【ローカル CLI 環境】
2. bash_tool が使えるが上記失敗 → 【DT App Code 環境】（サンドボックス）
3. bash_tool 自体がない → 【API Only 環境】
```

### 環境別の操作マッピング

| 操作 | ローカル CLI | DT App Code | 備考 |
|---|---|---|---|
| ファイル読み | `cat` / `view` | `github:get_file_contents` | |
| ファイル作成 | エディタ / `cat >` | `github:create_or_update_file` | |
| ファイル編集 | `sed` / 直接編集 | `github:create_or_update_file` + sha | |
| ブランチ作成 | `git checkout -b` + `git push -u` | `github:create_branch` | |
| コミット | `git add -A && git commit` | API commit（push 自動） | |
| push | `git push origin <branch>` | 不要（API で直接反映） | |
| codex 委譲 | `codex exec --full-auto` | 不可（指示書作成まで） | |
| テスト確認 | `./serve.sh` + ブラウザ | 不可（DT確認用WT で実施） | |

## 3. 指示書テンプレート（環境非依存）

```markdown
# 指示書: T-XXX タスク名

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## 作業ブランチ
- ベース: `feature/dev`
- 作業: `feature/xxx`

## 完了条件
1. ...
2. ...

## 実装手順

### Step 1: ファイルを読む
- 対象: リモート `feature/dev` ブランチの `src/config.js`

### Step 2: ファイルを編集
- 対象: `src/config.js`
- 変更内容: ...

### Step 3: 新規ファイル作成
- パス: `src/shaders/xxx.glsl.js`
- 内容: ...

### Step N: コミット & プッシュ
- メッセージ: `feat: ...`
- ブランチ: `feature/xxx`

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- 既存ファイルの意図しない変更禁止
```

## 4. DT チャット側の指示書生成フロー

```
ユーザー: 「dt code に XXX を実装させたい」
              ↓
DT（このチャット）:
  1. 「dt」を検出 → DT App Code 向け
  2. 指示書を §3 テンプレートで作成
  3. github:create_or_update_file で docs/prompts/ に push
  4. ブランチ作成（必要なら github:create_branch）
  5. ユーザーに報告:
     「指示書を push しました。DT App Code で以下を伝えてください:
      リモート feature/dev ブランチの docs/prompts/INSTRUCTION-TXXX.md を読み実装せよ」

ユーザー: 「cli で XXX」
              ↓
DT:
  1. 「cli」（xなし）を検出 → Claude Code CLI 向け
  2. 同様に指示書 push
  3. 報告: 「Claude Code CLI で以下を実行:
     cd /Users/uminomae/dev/kesson-claudeCode
     git fetch && git checkout feature/xxx && git pull
     → 指示書 docs/prompts/INSTRUCTION-TXXX.md に従って実装」

ユーザー: 「codex で XXX」
              ↓
DT:
  1. 「codex」（x あり）を検出 → Codex 向け
  2. 指示書 push
  3. 報告（2択）:
     a. Codex CLI: `codex exec --full-auto "指示書を読み実装"`
     b. Codex App: ブラウザから起動
```

## 5. 禁止事項

- DT App Code 環境でローカルパス（`/Users/...`）への `cd` 禁止
- DT App Code 環境で `codex exec`、`claude` コマンド禁止
- ローカル CLI 環境で GitHub API を使ったコミット禁止（git コマンドを使う）
- 環境判別を省略して実装を開始することは禁止
