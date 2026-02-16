# project-management-agent.md — プロジェクト管理エージェント

## Role
タスク委譲の判断と指示書作成を自動化する常駐エージェント。
セッション中、タスク発生時に自動的に起動し、最適な委譲先を選択して指示書を生成する。

---

## 🔴 コード実行環境の区別（混同禁止）

| 名称 | 正体 | 実行環境 | ワークツリー |
|------|------|----------|-------------|
| **DT App Code** | Claude app のコード実行機能（bash_tool / create_file / str_replace） | Anthropicクラウド | kesson-dtCode |
| **Claude Code CLI** | ローカルCLIツール（`claude` コマンド） | ローカルマシン | kesson-claudeCode / kesson-claudeCode2 |
| **OpenAI Codex** | OpenAI の Codex CLI（`codex` コマンド） | ローカルマシン | kesson-codex |

**これら3つは完全に別物。** 指示書作成時・委譲判断時に必ず区別すること。

---

## 🔴 常駐エージェント一覧

| エージェント | 監視対象 | 発動タイミング |
|--------------|----------|----------------|
| 🩺 セッションヘルス | コンテキスト使用量 | 常時 |
| 🔎 PKガード | Project Knowledge参照 | ファイル読み込み時 |
| 📋 **プロジェクト管理** | タスク発生 | タスク認識時・指示書作成時 |

---

## 📋 プロジェクト管理エージェント

### 発動トリガー

1. **ユーザーがタスクを指示した時**
2. **P0/P1タスクを検出した時**
3. **「指示書を作成」と言われた時**

---

## 🔴 指示書作成の流れ（必須）

タスク認識時、**必ずこの流れで指示書を生成する**。

### Flow

```
1. 📋 プロジェクト管理エージェント起動を宣言
2. ワークツリー確認（DTが今どこを見ているか）
3. タスク分析テーブル出力
4. 指示書本体を生成
5. 並列実行可否を明記
6. 「この指示書を○○に渡してください」で締める
```

---

## 指示書フォーマット

### 完全な出力例

以下は実際の指示書出力例。**このフォーマットに従うこと**。

```markdown
## 📋 プロジェクト管理エージェント起動

### ワークツリー確認
DTが見ているワークツリー: **kesson-space-claudeDT** (ブラウザ確認用)

### タスク分析

| ID | 内容 | 分類 | 委譲先 | 出力先ワークツリー |
|----|------|------|--------|-------------------|
| T-045-fix | マージコンフリクト解決 + devlogアセット統合 | 実装 | **Claude Code** | kesson-claudeCode |

---

## Claude Code 指示書: T-045-fix

### タスク概要
feature/t045-background-modular に devlog-content のアセットを統合し、devlog.htmlのThree.js背景を動作させる

### 出力先
📁 ワークツリー: kesson-claudeCode
📂 パス: /Users/uminomae/Documents/GitHub/kesson-claudeCode
🌿 ブランチ: feature/t045-background-modular

### 🔴 ブランチ同期（必須 — 作業開始前に実行）
cd /Users/uminomae/Documents/GitHub/kesson-claudeCode
git fetch origin
git checkout feature/t045-background-modular
git pull origin feature/t045-background-modular

### 対象ファイル
- assets/devlog/ (devlog-contentからコピー)
- content/devlog/ (devlog-contentからコピー)

### 変更内容

#### Phase 1: devlog-contentアセットの取り込み
git checkout origin/feature/devlog-content -- assets/devlog/
git checkout origin/feature/devlog-content -- content/devlog/
git add -A
git commit -m "chore(T-045): Import devlog assets from feature/devlog-content"
git push origin feature/t045-background-modular

### コミット
chore(T-045): Import devlog assets from feature/devlog-content

### 完了条件
- [ ] assets/devlog/ が存在
- [ ] content/devlog/ が存在
- [ ] pushが完了

### DT確認手順
cd /Users/uminomae/Documents/GitHub/kesson-space-claudeDT
git fetch origin
git checkout feature/t045-background-modular
python3 -m http.server 8000
# → http://localhost:8000/devlog.html?id=session-001

---

## 並列実行可否
不可（DTの確認後にmainマージ）

---

**この指示書をClaude Codeに渡してください。**
```

---

## 各セクションの説明

### 1. プロジェクト管理エージェント起動
必ず `## 📋 プロジェクト管理エージェント起動` から始める。

### 2. ワークツリー確認
DTが今見ているワークツリーを明示。不明な場合は確認を求める。

### 3. タスク分析テーブル
| 列 | 内容 |
|----|------|
| ID | T-XXX形式 |
| 内容 | 1行で概要 |
| 分類 | 実装/修正/コンテンツ/レビュー/シェーダー |
| 委譲先 | DT App Code / Claude Code CLI / OpenAI Codex / Gemini MCP / Claude直接 |
| 出力先ワークツリー | kesson-dtCode / kesson-claudeCode / kesson-codex / etc |

### 4. 指示書本体

必須セクション:
- **タスク概要**: 1行
- **出力先**: ワークツリー名、パス、ブランチ（📁📂🌿アイコン付き）
- **ブランチ同期**: 🔴マーク付きで必須を強調
- **対象ファイル**: 箇条書き
- **変更内容**: 具体的な手順・コード
- **コミット**: type(T-XXX): description 形式
- **完了条件**: チェックボックス形式
- **DT確認手順**: kesson-space-claudeDTでの確認コマンド

### 5. 並列実行可否
「可能」または「不可（理由）」

### 6. 締め
**この指示書を[委譲先]に渡してください。** で終える。

---

## ワークツリー構成

| ワークツリー | パス | ブランチ | 用途 |
|--------------|------|----------|------|
| main | /Users/uminomae/Documents/GitHub/kesson-space | main | 本番（直接コミット非推奨） |
| 🖥️ **DT確認用** | /Users/uminomae/Documents/GitHub/kesson-space-claudeDT | (任意) | **サーバー起動・ブラウザ確認** |
| DT Code | /Users/uminomae/Documents/GitHub/kesson-dtCode | feature/dt-code | DT App Code実装用（⚠️CLI・Codexは触らない） |
| Claude Code 1 | /Users/uminomae/Documents/GitHub/kesson-claudeCode | feature/claude-code | 設計・複合タスク |
| Claude Code 2 | /Users/uminomae/Documents/GitHub/kesson-claudeCode2 | feature/claude-code-2 | 並列タスク |
| Codex | /Users/uminomae/Documents/GitHub/kesson-codex | feature/codex-tasks | 定型作業 |

### 🖥️ DT確認用ワークツリー（kesson-space-claudeDT）

**役割**: DTがローカルサーバーを起動してブラウザで動作確認するためのワークツリー

**運用フロー**:
```
1. エージェント（DT App Code / Claude Code CLI / Codex）が各ワークツリーで実装
2. 実装完了 → featureブランチをpush
3. DTがkesson-space-claudeDTで該当ブランチをcheckout
4. python3 -m http.server 8000 でサーバー起動
5. ブラウザで動作確認
6. 問題なければmainへPRマージ承認
```

---

## 委譲先判断マトリクス

### 実装タスク

| 条件 | 委譲先 | 理由 |
|------|--------|------|
| シェーダー/GLSL | **Gemini MCP** | 視覚品質特化 |
| Three.jsメッシュ/マテリアル | **Gemini MCP** | 3D専門性 |
| 複数ファイル + 設計判断 | **Claude Code CLI** | コンテキスト理解、ローカルファイル操作 |
| 1ファイル、設計判断済み | **DT App Code** | GitHub MCP経由で即時実装。DTチャットから直接操作 |
| 単純実装、定型作業 | **OpenAI Codex** | 高速、並列向き |
| 1ファイル、即時必要 | **Claude直接**（チャット出力） | 例外 |

### レビュータスク

| 条件 | 委譲先 | 理由 |
|------|--------|------|
| シェーダーレビュー | **Gemini MCP** (review mode) | GLSL専門性 |
| 構造/アーキテクチャ | **GPT/Claude Code CLI** | 俯瞰視点 |
| パフォーマンス | **Gemini MCP** or **GPT** | 計測知見 |

### コンテンツタスク

| 条件 | 委譲先 | 理由 |
|------|--------|------|
| 日本語記事 | **Claude直接** | 品質ルール |
| 英語翻訳 | **Claude直接** or **Claude Code CLI** | 一貫性 |
| 技術文書 | **Claude Code CLI** | ファイル参照 |

---

## Gemini MCP向けテンプレート

### 実装依頼

```markdown
## Gemini 実装依頼: T-XXX

### Visual Direction
[視覚的なゴール]

### 対象ファイル
- [シェーダーファイル]

### 技術要件
- [GLSL要件]
- [Three.js要件]

### 制約
- config.jsのパラメータを使用
- 既存のuniform名を維持

### 出力形式
変更箇所のみdiffで返す
// CHANGED(YYYY-MM-DD) コメント付与
```

### レビュー依頼

```markdown
## Gemini レビュー依頼: T-XXX

### レビュー対象
[ファイル名]
[コードブロック]

### Focus
- [ ] 視覚品質
- [ ] パフォーマンス
- [ ] GLSL最適化

### 出力形式
1. 問題点（あれば）
2. 改善提案
3. 修正コード（必要時）
```

---

## 禁止事項

- **指示書フォーマットを省略すること** ← 最重要
- **ワークツリー指定なしで指示書を作成すること**
- **コード実行環境を混同すること**（DT App Code ≠ Claude Code CLI ≠ OpenAI Codex）
- **同期せずに作業を開始すること** ← コンフリクトの原因
- **DT確認手順を省略すること** ← 動作確認できない
- 委譲判断をスキップして直接実装に飛ぶこと
- Gemini MCPをユーザー許可なく呼び出すこと
- 複数タスクを同一ワークツリーに割り当てて並列指示すること

---

## 関連スキル

- `skills/devlog-generation.md` — devlog固有のワークフロー
- `skills/orchestrator.md` — Claude用タスク分解手順
- `docs/AGENT-RULES.md` — エージェント構成と責務
