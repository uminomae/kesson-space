# kesson-space

> 欠損駆動思考の3D体験空間

**⚠️ 本READMEはClaude DT（Claude.ai Desktop / Web チャット）用の運用ルールです。**
他のエージェント（Claude Code CLI, OpenAI Codex, Gemini等）は [AGENTS.md §0](AGENTS.md) の読み替えガイドに従い、自環境に適用してください。全エージェント共通のルールは [AGENTS.md](AGENTS.md) の §3, §5, §6 を参照。

---

## 🔴🔴🔴 最重要ルール: 委譲完了後フロー（絶対遵守）

**Code / Codex / Gemini 等の委譲先エージェントから実装完了の報告があったら、DTは以下のフローを必ず実行する。例外なし。**

```
┌─────────────────────────────────────────────────┐
│  1. 実装ブランチを dev にマージ                  │
│  2. ユーザーに pull + サーバー起動コマンド提示    │
│  3. ⛔ 停止 — ユーザーの目視確認を待つ           │
│  4. OK → PR作成（Closes #XX）→ mainマージ       │
│     NG → fix指示書作成                           │
└─────────────────────────────────────────────────┘
```

### 🚫 絶対禁止

- **目視確認前に次タスクに着手すること**
- **目視確認前に新しい指示書を作成すること**
- **「ドキュメントだけだから」と例外扱いすること**
- **目視確認待ちの間に dev へ追加コミットすること**

### マージ → 目視確認 → main の具体手順

```bash
# 1. 目視チェック（DT確認用ワークツリー）
cd /Users/uminomae/dev/kesson-space
git fetch origin
git checkout dev
git pull origin dev
python3 -m http.server 3001
# → http://localhost:3001/

# 2. ユーザーが OK と言ったら → PR作成 → mainマージ
# GitHub API経由で PR (dev → main) を作成
# PR body に Closes #XX を含めて Issue 自動クローズ
```

---

## 🔴🔴 指示書作成ルール: DTはコード解析しない（絶対遵守）

**DTが指示書を書くとき、コードを読んで修正方針や具体的な変更行を特定してはならない。**
**コード解析・修正方針の策定は委譲先エージェント（Codex / Code）の責務である。**

### DTが指示書に書くべきこと（What）

- **何を実現したいか**（期待動作の記述）
- **何が問題か**（ユーザーから報告された事象）
- **完了条件**（目に見える振る舞いの基準）
- **禁止事項**（スコープ外変更の防止）

### DTが指示書に書いてはいけないこと（How）

- ❌ 具体的な変更行（「L273を修正」「この関数のここを変える」）
- ❌ 修正コードの提示（before/after のコードブロック）
- ❌ 内部実装の分析結果（「ソルバーが打ち消している」等の推測）
- ❌ 関数の呼び出し関係やデータフローの解釈

### 理由

DTのコード解析は不完全であり、誤った修正方針を指示書に書くと委譲先が盲目的に従い、何度もやり直しが発生する。
実際に #54 では DTが「ソルバー入力に yOffset を渡す」→「ソルバー出力後に加算」と2回誤った方針を出し、3回の指示書作成が必要になった。
委譲先エージェントは実際にコードを実行・テストできるため、How の判断は委譲先に任せるべき。

### 指示書テンプレート（改訂版）

```markdown
# 指示書: {タスク名}

## Issue
{URL}

## 作業ブランチ
- 作業: `feature/xxx`

## 事象
{ユーザーから報告された問題、または実現したい機能}

## 期待動作
{完成後にどう見えるべきか・どう動くべきか}

## ヒント（任意）
{関連しそうなファイル名やキーワード。ただし修正方針ではない}

## 完了条件
1. ...
2. ...

## 禁止事項
- main への直接 push 禁止
- dev への直接マージ禁止
- {スコープ外ファイル}への変更禁止
```

---

## 🔴 DT 実装禁止ルール

**DT（Claude.ai Desktop / Web チャット）はコード実装を行ってはならない。**

DTの役割は以下に限定する:
- プロジェクト管理・タスク分析・指示書作成
- ドキュメント（README等）の更新
- GitHub API経由のマージ・PR操作
- バグ分析・CSS比較等のレビュー作業

コード実装が必要な場合は、必ず委譲先エージェントに指示書を渡すこと。

---

## 🔴 目視確認ゲート（最重要）

**dev に実装ブランチをマージしたら、ユーザーの目視確認OKが出るまで次の作業に進んではならない。**

### ゲートルール

1. 実装ブランチ → dev マージ **直後に停止**
2. ユーザーにpull + サーバー起動コマンドを提示
3. **ユーザーが「OK」または「問題あり」を回答するまで待機**
4. OK → PR作成（`Closes #XX`）→ mainマージ / 問題あり → fix指示書を作成

### 禁止事項

- 目視確認待ちの間に dev へ追加コミットすること
- 目視確認をスキップして次タスクに着手すること
- 「ドキュメント更新だけだから」と例外扱いすること

### ワークツリー使い分け

| 操作 | ワークツリー | パス |
|---|---|---|
| 目視確認 | **claudeDT** | `/Users/uminomae/dev/kesson-space` |
| mainマージ | **GitHub API** | PR経由 |

---

## セッション開始

**このセクションを読んだ時点で以下を実行する。**

### Step 0: プロジェクト管理エージェント読み込み（必須）

**対話開始時に必ず [skills/project-management-agent.md](skills/project-management-agent.md) を読み込むこと。**
読み込み完了後、常駐エージェントが起動する。

| エージェント | 役割 | 詳細 |
|---|---|---|
| 📋 プロジェクト管理 | タスク委譲・指示書生成 | [skills/project-management-agent.md](skills/project-management-agent.md) |
| 📝 Issue進捗記録 | 作業中Issueにコメント記録 | [AGENTS.md §5.2](AGENTS.md) |
| 🩺 セッションヘルス | コンテキスト監視 | [docs/AGENT-RULES.md §8](docs/AGENT-RULES.md) |
| 🔎 PKガード | ドキュメント参照最適化 | [docs/AGENT-RULES.md §7](docs/AGENT-RULES.md) |

### Step 1: キャッシュ読み込み（状態復元）

→ `~/Library/Caches/kesson-agent/session/state.md` を読む（存在すれば）
→ 前セッションからの引き継ぎ事項を確認

### Step 2: 状態確認

→ [GitHub Issues](https://github.com/uminomae/kesson-space/issues) の open 一覧を確認
→ P0/P1 ラベルの Issue を優先把握

### Step 3: ワークツリー確認

DTが見ているディレクトリは？
→ 📋エージェントが出力先を決定

#### filesystem MCP による .git ワークツリー状態の確認

DTは filesystem MCP で `/Users/uminomae/dev/` 配下にアクセスできる。
**ワークツリー操作やブランチ切り替え指示を出す前に、必ず以下を読んで現状を把握すること。**

1. **メインリポジトリの HEAD**: `kesson-space/.git/HEAD` を読む
2. **ワークツリー一覧**: `kesson-space/.git/worktrees/` をリストする
3. **各ワークツリーのブランチ**: `kesson-space/.git/worktrees/{名前}/HEAD` を読む
   - `ref: refs/heads/...` → そのブランチをチェックアウト中
   - SHA ハッシュのみ → detached HEAD 状態
4. **ワークツリーのパス**: `kesson-space/.git/worktrees/{名前}/gitdir` を読むとパスが確認できる

これにより「どのワークツリーがどのブランチを使用中か」を事前に把握でき、
ブランチ競合（`already checked out at ...`）を防げる。

### Step 4: タスク着手

ユーザーがタスクを指示 → 📋エージェントが委譲判断

---

## セッションキャッシュ

DTセッション中のコンテキスト消費を抑制するための一時ファイル置き場。

| 項目 | 内容 |
|---|---|
| **場所** | `~/Library/Caches/kesson-agent/` |
| **運用ルール** | `CACHE-RULES.md`（キャッシュ内） |
| **セッション状態** | `session/state.md`（必須・常時更新） |
| **分析退避** | `session/*.md`（重いデータはここに退避） |

---

## 実装エージェント区別（重要）

本プロジェクトでは以下の **3つの実装エージェントを厳密に区別** する。混同しないこと。

| 名称 | 正式名 | 実体 | 特徴 |
|---|---|---|---|
| **DT App Code** | Claude.ai Desktop App のコード実行機能 | `bash_tool`, `create_file`, `str_replace`, `view` 等 | DTチャット内から直接ファイル操作。ボトルネックなし |
| **Claude Code CLI** | Claude Code（ターミナル） | `claude` コマンド（CLI） | ターミナルで実行。ワークツリー指定が必要 |
| **OpenAI Codex** | OpenAI Codex | `codex` コマンド（CLI） | 並列・定型作業向き |

### コード実装の第一選択肢

**コード実装が必要な場合、第一選択肢は DT App Code である。**

委譲が必要になるのは以下の場合のみ:
- **Claude Code CLI**: 複数ファイルにまたがる設計判断が必要、またはDTのコンテキストが逼迫
- **OpenAI Codex**: 定型作業の並列実行
- **Gemini MCP**: シェーダー/GLSL実装

---

## ブランチ戦略

```
main（起点）→ 実装ブランチ → dev（🔴目視確認ゲート）→ PR（Closes #XX）→ main
```

- `main` への直接コミット禁止
- 実装ブランチは `main` から作成する
- `dev` は目視確認用のステージング
- **dev マージ後、目視確認OKまで追加コミット禁止**
- 目視確認OK後、PR を作成して main にマージ
- 実装ブランチは `claude/*` または `feature/*` 命名

---

## ドキュメント

→ [docs/README.md](docs/README.md)

---

## 開発

```bash
./serve.sh  # → http://localhost:3001/
```

## Devlog English Flow

新規 devlog セッションを JA/EN で追加する場合は以下を揃える。

1. `content/devlog/session-XXX.md`（日本語本文）
2. `content/devlog/session-XXX.en.md`（英語本文）
3. `assets/devlog/sessions.json` に以下を追加

```json
{
  "id": "session-XXX",
  "title_ja": "Part X: ...",
  "title_en": "Part X: ...",
  "summary_ja": "日本語カード用の1行サマリー。",
  "summary_en": "One-line English summary for devlog cards.",
  "date_range_ja": "2026-02-19",
  "date_range_en": "Feb 19, 2026",
  "cover_by_lang": {
    "ja": "./assets/devlog/covers/session-XXX.png",
    "en": "./assets/devlog/covers/session-XXX-en.png"
  },
  "content_by_lang": {
    "ja": "./content/devlog/session-XXX.md",
    "en": "./content/devlog/session-XXX.en.md"
  }
}
```

フォールバック方針:
- `lang=en` で `*.en.md` が無い場合は `*.md` を表示
- `title_en` / `date_range_en` が無い場合は `*_ja` を表示
- `summary_ja` / `summary_en` があれば対応言語の devlog カードに表示（未設定時はサマリー非表示）
- `cover_en` / `cover_by_lang.en` が無い場合は中立カバー (`default.svg`) を表示

外部 blog サマリー（ARTICLES）も同様に `title_en` / `excerpt_en` を付与すると英語表示される。

検証コマンド:

```bash
npm run devlog:covers:en
npm run devlog:validate
npm run test:devlog-nav
```

推奨画像生成フロー:
- SVG-first で `assets/devlog/covers/` に保存
- Gemini 2.5 Pro で `session-XXX-en.svg` を生成し `cover_by_lang.en` に紐付け
- 初期プレースホルダーを自動生成する場合は `npm run devlog:covers:en`
- 既存 `cover_by_lang.en` を `session-XXX-en.svg` に正規化する場合は `npm run devlog:covers:en -- --sync-paths`

## Deep Link Presets

Deep link URL presets are managed in:

- `assets/deeplinks.json`

Print all preset URLs:

```bash
npm run deeplinks
```

Print one preset URL (copy ready):

```bash
node scripts/print-deeplinks.mjs articles_readmore_open
```

Use local server origin:

```bash
node scripts/print-deeplinks.mjs articles_readmore_open --base http://localhost:5173
```

In browser dev mode (`?dev`), a separate `LINKS` offcanvas hub is available (independent from the parameter tuning panel).

---

## 関連プロジェクト

| 場所 | 役割 |
|---|---|
| [kesson-space](https://uminomae.github.io/kesson-space/) | 体験する（本リポジトリ） |
| [pjdhiro ブログ](https://uminomae.github.io/pjdhiro/thinking-kesson/) | 読む |
| kesson-driven-thinking | 理論の正本（Private） |
