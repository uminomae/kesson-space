# AGENT-RULES.md — マルチエージェント運用ルール

**バージョン**: 1.3
**更新日**: 2026-02-15

---

## 1. エージェント構成と責務

| エージェント | 役割 | 強み | 呼び出し条件 |
|---|---|---|---|
| **Claude** | 司令塔。要件整理、プロンプト設計、config/HTML/CSS、ファイル統合、テスト、ドキュメント | コンテキスト把握、複数ファイル管理、対話 | 常時（セッションホスト） |
| **🩺 セッションヘルス** | コンテキスト監視。SH-1〜SH-6の閾値チェック | コンテキスト逼迫の事前検知 | **常駐（Claude内部で自動）** |
| **Gemini** | Three.js/GLSLプログラマー | シェーダー実装、視覚品質、GLSL数学 | シェーダー/Three.jsコードの新規作成・修正時 |
| **Codex/GPT** | レビュアー/アーキテクト | 俯瞰的構造改善、運用設計、セカンドオピニオン | 品質検証、設計議論、リファクタリング時 |

### 責務境界（明確化）

| 作業 | 担当 | 注意 |
|------|------|------|
| シェーダー新規作成・GLSL修正 | **Gemini** | — |
| Three.jsメッシュ・マテリアル | **Gemini** | — |
| コードレビュー・構造改善 | **GPT** or Gemini review | — |
| config/devパネル/HTML/CSS | **Claude直接** | — |
| **関数シグネチャ・インターフェース設計** | **Claude** | 擬似コード・引数定義まで |
| **関数の中身（実装）** | **Gemini** | Claudeは実装を書かない |

> **原則**: ユーザーが明示した時のみ外部エージェントを使用。自動呼び出しはしない。

---

## 2. コンテキスト共有：Context Layer

### 設計思想

> 各エージェントに渡す情報は「最小限かつ十分」。
> 判断基準: **そのエージェントが「なぜ」と「どこまで」を理解できる最小の情報量**。

### Layer構成

| Layer | 内容 | 必須/任意 | 推定トークン |
|---|---|---|---|
| **L0: Grounding** | ファイルツリー + 技術スタック | **必須（毎回）** | ~300 |
| **L1: スキル** | ロール別ガイドライン（skills/から選択） | タスクに応じて1-2枚 | ~400/枚 |
| **L2: タスク** | TASK.md（4点セット + Visual Specs） | **必須** | 変動 |
| **L3: 履歴** | LEARNINGS.md + 前回結果 | 関連時のみ | ~200 |

### L0: Grounding（最重要 — 毎回必ず渡す）

```
Project: kesson-space（欠損駆動思考の3Dビジュアライゼーション）
Tech: Three.js 0.160.0, ES Modules (importmap), no build tools
Hosting: GitHub Pages (path: /kesson-space/)
Config: src/config.js = Single Source of Truth

## Current Tree
（以下のコマンドで生成）
tree -I 'node_modules|.git|dist|__pycache__|uv.lock' --dirsfirst -L 3
```

### L1: スキル（skills/ から選択ロード）

**1回のプロンプトで読み込むのは1〜2ファイルまで**。全部連結して読ませない。

| スキルファイル | 対象 | 内容 |
|---|---|---|
| `skills/shared-quality.md` | 全エージェント | 命名規約、禁止事項、パフォーマンス基準 |
| `skills/shader-impl.md` | Gemini | Visual Direction、GLSL作法、出力ルール |
| `skills/review-gates.md` | GPT | レビュー観点、品質ゲート、評価基準 |
| `skills/orchestrator.md` | Claude | 分解・委譲・統合の手順 |

### L2: タスク（context-pack/）

**4点セットが必ず揃うこと。ファイル数は柔軟。**

#### 通常タスク: 4ファイル構成

```
context-pack/
  TASK.md          ← Why + Scope + Visual Specs
  FILES.md         ← 対象ファイル・編集範囲
  CONSTRAINTS.md   ← 制約 + SkillBundle指定
  ACCEPTANCE.md    ← 完了条件（省略禁止）
```

#### マイクロタスク: SINGLE.md に圧縮

→ `context-pack/SINGLE.md.template` を参照

**使い分け基準**: 対象ファイルが1つ、変更が10行以下 → SINGLE.md。それ以上 → 4ファイル。

### L3: 履歴

→ `skills/LEARNINGS.md` を参照

---

## 3. ハンドオフ規格

### Claude → Gemini（実装依頼）

```
渡すもの:
  L0: Grounding（ファイルツリー必須）
  L1: skills/shader-impl.md（+ shared-quality.md 必要時）
  L2: TASK.md（Visual Specs必須）+ FILES.md + CONSTRAINTS.md + ACCEPTANCE.md
  L3: LEARNINGS.md（関連する教訓があれば）
```

### Claude → GPT（レビュー依頼）

```
渡すもの:
  L0: Grounding
  L1: skills/review-gates.md
  L2: レビュー対象コード + 「このコードはGeminiが生成した」の一文
  Focus: パフォーマンス / 構造 / 可読性 のうち何を重視するか
```

### Gemini/GPT → Claude（成果物の戻し）

```
戻すもの:
  1. コード差分（patch or 全文。変更箇所に // CHANGED(YYYY-MM-DD) コメント）
  2. 設計メモ（5-10行。なぜこう書いたか）
  3. 再現手順（ローカルでの確認コマンド or 操作手順）
  4. 残課題（TODO。あれば）
```

---

## 4. スキル更新ルール

### 権限

| 操作 | Claude | Gemini | GPT | ユーザー |
|------|--------|--------|-----|---------|
| skills/ 閲覧 | ○ | ○ | ○ | ○ |
| skills/ 修正提案 | ○ | ○ | ○ | ○ |
| skills/ 正本マージ | ○ | ✕ | ✕ | ○ |
| LEARNINGS.md 追記 | ○ | ○ | ○ | ○ |

### 更新タイミング

- **LEARNINGS.md**: タスク完了時に気づいたことを随時追記
- **skills/*.md**: 月1回の棚卸し or 明らかな問題発見時
- **context-pack/テンプレート**: 運用が安定するまでは柔軟に改善

---

## 5. ディレクトリ配置

```
kesson-space/
├── skills/
│   ├── shared-quality.md      ← 全エージェント共通の品質基準
│   ├── shader-impl.md         ← Gemini用: Visual Direction、GLSL作法
│   ├── review-gates.md        ← GPT用: レビュー観点
│   ├── orchestrator.md        ← Claude用: 分解・委譲手順
│   └── LEARNINGS.md           ← 運用の教訓（手動更新）
│
├── context-pack/
│   ├── SINGLE.md.template     ← マイクロタスク用テンプレート
│   └── （タスクごとに TASK.md 等を作成。完了後は削除 or archive/）
│
├── docs/
│   ├── AGENT-RULES.md         ← 本ファイル（上位方針）
│   └── ...
```

---

## 6. PROMPT-STRUCTURE.md との関係

本文書 = **マルチエージェント運用の上位方針**。
PROMPT-STRUCTURE.md = **Gemini向けの具体的テンプレート**（引き続き使用可）。

将来的にPROMPT-STRUCTURE.mdの内容は `skills/shader-impl.md` と `context-pack/TASK.md` テンプレートに分解・吸収される可能性がある。

---

## 7. 🔎 PKガード（Project Knowledge管理）

### Tier分類

| Tier | ファイル | 参照タイミング |
|------|---------|---------------|
| 1 | README.md, CURRENT.md, TODO.md | セッション開始時に必ず |
| 2 | WORKFLOW.md, AGENT-RULES.md, ARCHITECTURE.md, ENVIRONMENT.md, TESTING.md, CONCEPT.md | タスクに応じて |
| 3 | prompts/*, issues/* | Gemini作業時・過去の設計参照時のみ |

### 🔎PKガードの監視項目（常駐）

PKガードはClaudeが**常時内部的に実行する**常駐ガード。

| # | 監視項目 | 判定基準 | アクション |
|---|---------|---------|-----------|
| PG-1 | セッション冒頭でTier 2/3を読んでいないか | Tier 1のみ許可 | タスク確定後に参照 |
| PG-2 | 完了済みドキュメントを読んでいないか | ISS-001(✅完了)等 | 完了済みは無視 |
| PG-3 | Tier 3を不要に参照していないか | Gemini作業時のみ | 依頼時以外は無視 |
| PG-4 | 1ターンで参照するPKファイル数 | 3ファイル超 | 本当に全部必要か再確認 |
| PG-5 | PKとGitHub正本の乖離 | 更新日付 | 乖離検出時にユーザーに同期を促す |

### PK推奨構成（最小セット）

| ファイル | Tier | PKに必要 |
|---------|------|---------|
| docs/README.md | 1 | ✅ 必須 |
| docs/CURRENT.md | 1 | ✅ 必須 |
| docs/TODO.md | 1 | ✅ 必須 |
| docs/WORKFLOW.md | 2 | ✅ 推奨 |
| docs/CONCEPT.md | 2 | ✅ 推奨 |
| docs/ARCHITECTURE.md | 2 | ⚠️ 技術作業時のみ |
| docs/AGENT-RULES.md | 2 | ⚠️ エージェント作業時のみ |
| docs/prompts/* | 3 | ❌ PKから外す |
| docs/issues/* | 3 | ❌ PKから外す |

---

## 8. 🩺 セッションヘルスガード

### 背景

kesson-spaceではシェーダーファイル（GLSL 200行超）やGemini MCP応答の蓄積により、コンテキストウィンドウが逼迫しセッションがフリーズするケースが発生している。

### 監視項目

| # | 監視項目 | 閾値 | アクション |
|---|---------|------|-----------|
| SH-1 | シェーダーファイル全文読み込み | 2ファイル以上/セッション | セクション指定に切替を提案 |
| SH-2 | 1ターンの出力長 | 長大なコード出力 | 分割出力を提案 |
| SH-3 | 累積ファイル参照数 | 8ファイル超 | 参照整理を提案 |
| SH-4 | 連続ツール呼び出し | 5回連続 | 中間確認を挟む |
| SH-5 | Gemini MCP応答の蓄積 | コード全文返却時 | diffのみ抽出 |
| SH-6 | 4エージェント分析 | 起動前 | コンテキスト残量を事前判定 |

### 高リスクパターン

| パターン | 具体例 | 予防策 |
|---------|--------|--------|
| シェーダー全文ループ | vortex.js読み込み→修正→再読み込み | 1回目でdiff管理に移行 |
| 修正済み確認の連鎖 | dev-panel→main.js→scroll-ui→config | CURRENT.mdで先に確認 |
| Gemini出力の蓄積 | 生成コード200行×3回 | 最新版のみ保持 |
| 4エージェント分析+実装 | 分析で大量出力→そのまま実装 | 別セッションに分割 |

### 発動タイミング

🩺セッションヘルスガードは**Claudeが内部的に常時監視**。以下のタイミングで自動チェック:

- **タスク受領時**: 負荷カテゴリ判定（🟢低/🟡中/🔴高）
- ファイル読み込み前（SH-1, SH-3）
- ツール呼び出し前（SH-4, SH-5）
- 長文出力の開始前（SH-2）
- 4エージェント分析の開始前（SH-6）

閾値を超えた場合の報告形式:

```
⚠️ セッションヘルス: [SH-N] [監視項目]
状況: [具体的な状況]
提案: [セッション分割 / 参照整理 / diff管理への切替 など]
```

### 永続性の保証（3層担保）

| 層 | 仕組み | 役割 |
|----|--------|------|
| **Memory** | Claudeの永続記憶にSH-1〜SH-6の要約を記録 | セッションをまたいでも消えない |
| **WORKFLOW.md §1.5** | セッション開始手順に負荷事前判定を組み込み | タスク着手前の強制チェック |
| **本節（§8）** | 詳細な監視項目・閾値・対応策 | 参照先 |

---

## 9. 策定経緯

| ラウンド | 内容 |
|---------|------|
| R1 | 三者に同一質問「コンテキスト共有の最適設計」→ 初期案収集 |
| R1→R2 | ChatGPTの提案をGeminiに、Geminiの提案をChatGPTに相互レビュー |
| R2 | 収束: 4点セット×動的ロード共存、LEARNINGS.md、ファイルツリー必須 |
| v1.1 | レビュー指摘反映: 配置整合、HTML例外、CHANGED日付化 |
| v1.2 | 🩺セッションヘルスガードを常駐エージェントに追加 |
| v1.3 | ドキュメント階層再構成に伴い、PKガード・セッションヘルス詳細を本ファイルに統合 |
