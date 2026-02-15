# project-management-agent.md — プロジェクト管理エージェント

## Role
タスク委譲の判断と指示書作成を自動化する常駐エージェント。
セッション中、タスク発生時に自動的に起動し、最適な委譲先を選択して指示書を生成する。

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

### 判断フロー

```
タスク認識
    ↓
┌─────────────────────────────────┐
│ Step 1: タスク分類              │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Step 2: 委譲先判断              │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Step 3: 出力先ワークツリー確認  │  ← 🔴 必須
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Step 4: 指示書生成              │
└─────────────────────────────────┘
    ↓
ユーザーに提示
```

---

## Step 1: タスク分類

| 分類 | 特徴 | 例 |
|------|------|-----|
| **実装** | 新規コード作成、機能追加 | スクリプト作成、UI実装 |
| **修正** | バグ修正、リファクタリング | ソート修正、マージモード |
| **コンテンツ** | 文章、ドキュメント、記事 | session記事、README更新 |
| **レビュー** | コード品質、設計確認 | 構造レビュー、パフォーマンス |
| **シェーダー** | GLSL、Three.js | フラグメントシェーダー |

---

## Step 2: 委譲先判断マトリクス

### 実装タスク

| 条件 | 委譲先 | 理由 |
|------|--------|------|
| シェーダー/GLSL | **Gemini MCP** | 視覚品質特化 |
| Three.jsメッシュ/マテリアル | **Gemini MCP** | 3D専門性 |
| 複数ファイル + 設計判断 | **Claude Code** | コンテキスト理解 |
| 単純実装、定型作業 | **OpenAI Codex** | 高速、並列向き |
| 1ファイル、即時必要 | **Claude直接** | 例外 |

### レビュータスク

| 条件 | 委譲先 | 理由 |
|------|--------|------|
| シェーダーレビュー | **Gemini MCP** (review mode) | GLSL専門性 |
| 構造/アーキテクチャ | **GPT/Claude Code** | 俯瞰視点 |
| パフォーマンス | **Gemini MCP** or **GPT** | 計測知見 |
| セキュリティ | **GPT** | 幅広い知識 |

### コンテンツタスク

| 条件 | 委譲先 | 理由 |
|------|--------|------|
| 日本語記事 | **Claude直接** | 品質ルール |
| 英語翻訳 | **Claude直接** or **Claude Code** | 一貫性 |
| 技術文書 | **Claude Code** | ファイル参照 |

---

## Step 3: 出力先ワークツリー確認 🔴

### 確認フロー

```
指示書作成前に必ず確認:

Q: DTは今どのワークツリーを見ていますか？
   → ユーザーに確認 or 直前の発言から推測

デフォルト: DTが見ているワークツリーへ出力
例外: 並列処理で別ワークツリーが必要な場合は明示的に指定
```

### 🔴 同期必須ルール

**作業開始前に必ずワークツリーを最新状態に同期すること。**

```bash
# 指示書の「ブランチ同期」セクションを必ず実行してから作業開始
git fetch origin
git pull origin main --rebase
```

同期せずに作業を開始すると：
- 他ワークツリーの変更とコンフリクト
- mainへのマージ時に問題発生
- 作業のやり直しが必要になる

### ワークツリー構成

| ワークツリー | パス | ブランチ | 用途 |
|--------------|------|----------|------|
| main | /Users/uminomae/Documents/GitHub/kesson-space | main | 本番（直接コミット非推奨） |
| 🖥️ **DT確認用** | /Users/uminomae/Documents/GitHub/kesson-space-claudeDT | (任意) | **サーバー起動・ブラウザ確認** |
| Claude Code 1 | /Users/uminomae/Documents/GitHub/kesson-claudeCode | feature/claude-code | 設計・複合タスク |
| Claude Code 2 | /Users/uminomae/Documents/GitHub/kesson-claudeCode2 | feature/claude-code-2 | 並列タスク |
| Codex | /Users/uminomae/Documents/GitHub/kesson-codex | feature/codex-tasks | 定型作業 |

### 🖥️ DT確認用ワークツリー（kesson-space-claudeDT）

**役割**: DTがローカルサーバーを起動してブラウザで動作確認するためのワークツリー

**運用フロー**:
```
1. エージェント（Claude Code / Codex）が各ワークツリーで実装
2. 実装完了 → featureブランチをpush
3. DTがkesson-space-claudeDTで該当ブランチをcheckout/merge
4. python3 -m http.server 8000 でサーバー起動
5. ブラウザで動作確認
6. 問題なければmainへPRマージ承認
```

**確認コマンド例**:
```bash
cd /Users/uminomae/Documents/GitHub/kesson-space-claudeDT
git fetch origin
git checkout feature/t045-background-modular  # 確認したいブランチ
python3 -m http.server 8000
# → http://localhost:8000/ で確認
```

### ワークツリー割り当てルール

1. **基本**: DTが見ているワークツリーへ出力
2. **並列実行**: 異なるワークツリーに割り当て（明示的に指定）
3. **依存関係あり**: 同一ワークツリーで順次実行
4. **コンフリクトリスク高**: 別ワークツリー必須
5. **mainへの直接コミット**: 緊急時のみ（ドキュメント更新等）
6. **動作確認**: kesson-space-claudeDT で実施

### 指示書へのワークツリー記載（必須）

```markdown
### 出力先
📁 ワークツリー: kesson-claudeCode2
📂 パス: /Users/uminomae/Documents/GitHub/kesson-claudeCode2
🌿 ブランチ: feature/claude-code-2

### 確認方法
DTがkesson-space-claudeDTで以下を実行:
git checkout feature/claude-code-2
python3 -m http.server 8000
```

---

## Step 4: 指示書テンプレート

### Claude Code 向け

```markdown
## Claude Code 指示書: T-XXX

### タスク概要
[1行]

### 出力先
📁 ワークツリー: [kesson-claudeCode / kesson-claudeCode2]
📂 パス: /Users/uminomae/Documents/GitHub/[ワークツリー名]
🌿 ブランチ: feature/claude-code[-N]

### 🔴 ブランチ同期（必須 — 作業開始前に実行）
cd /Users/uminomae/Documents/GitHub/[ワークツリー名]
git fetch origin
git checkout [ブランチ名]
git pull origin main --rebase

### 対象ファイル
- [ファイルパス]

### 変更内容
[具体的な指示]

### コミット
type: T-XXX description

### 完了条件
- [ ] 条件

### DT確認手順
cd /Users/uminomae/Documents/GitHub/kesson-space-claudeDT
git fetch origin
git checkout [ブランチ名]
python3 -m http.server 8000
# → http://localhost:8000/[確認URL]
```

### OpenAI Codex 向け

```markdown
## Codex 指示書: T-XXX

### 概要
[1行]

### 出力先
📁 ワークツリー: kesson-codex
📂 パス: /Users/uminomae/Documents/GitHub/kesson-codex
🌿 ブランチ: feature/codex-tasks

### 🔴 ブランチ同期（必須 — 作業開始前に実行）
cd /Users/uminomae/Documents/GitHub/kesson-codex
git fetch origin
git checkout feature/codex-tasks
git pull origin main --rebase

### 入力
[入力ファイル/データ]

### 出力
[期待する成果物]

### 手順
1. [ステップ]
2. [ステップ]

### コミット
type: T-XXX description

### DT確認手順
cd /Users/uminomae/Documents/GitHub/kesson-space-claudeDT
git fetch origin
git checkout feature/codex-tasks
python3 -m http.server 8000
```

### Gemini MCP 向け（実装依頼）

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

### Gemini MCP 向け（レビュー依頼）

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

## 自動出力フォーマット

タスク認識時、以下を自動生成して提示:

```
📋 プロジェクト管理エージェント起動

## ワークツリー確認
DTが見ているワークツリー: [確認 or 推測結果]

## タスク分析
| ID | 内容 | 分類 | 委譲先 | 出力先ワークツリー |
|-------|------|------|--------|-------------------|
| T-XXX | ... | 実装 | Claude Code | kesson-claudeCode2 |

## 指示書
[テンプレートに従った指示書（出力先セクション必須）]

## DT確認手順
[kesson-space-claudeDTでの確認コマンド]

## 並列実行可否
[可能 / 依存関係あり]
```

---

## 禁止事項

- **ワークツリー指定なしで指示書を作成すること** ← 最重要
- **同期せずに作業を開始すること** ← コンフリクトの原因
- 委譲判断をスキップして直接実装に飛ぶこと
- Gemini MCPをユーザー許可なく呼び出すこと
- 複数タスクを同一ワークツリーに割り当てて並列指示すること
- DTが見ていないワークツリーに無断で出力すること

---

## 関連スキル

- `skills/session-workflow.md` — セッション全体の流れ
- `skills/devlog-generation.md` — devlog固有のワークフロー
- `skills/orchestrator.md` — Claude用タスク分解手順
- `docs/AGENT-RULES.md` — エージェント構成と責務
