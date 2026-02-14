# AGENT-RULES.md — マルチエージェント運用ルール

**バージョン**: 1.1
**策定日**: 2026-02-14
**由来**: セッション#18 — Claude × Gemini × GPT 三者協議 + 相互レビュー

---

## 1. エージェント構成と責務

| エージェント | 役割 | 強み | 呼び出し条件 |
|---|---|---|---|
| **Claude** | 司令塔。要件整理、プロンプト設計、config/HTML/CSS、ファイル統合、テスト、ドキュメント | コンテキスト把握、複数ファイル管理、対話 | 常時（セッションホスト） |
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

> Geminiの指摘: 「ファイル構成のズレが最大のロス」。treeの結果を毎回先頭に入れるだけで精度が劇的に向上する。

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

> **ACCEPTANCEは絶対に省略禁止**（ChatGPT強調）。「何をもって終わりか」がない変更はレビュー不能。

#### TASK.md テンプレート（シェーダータスク用）

```markdown
# TASK

## Scope & Context
（何を作る/変えるか。1-3行）

## Why
（なぜ変えるか）

## Visual Specs（シェーダータスク時は必須）
- 質感: （例: 粘性係数高めの流体、ガラス的な屈折）
- 色: （例: #FF00DD → #00FFCC のグラデーション）
- 動き: （例: sin波ベースの揺らぎ、周期2秒）
- 数学的参考: （例: FBM 4オクターブ、Julia集合の c=(-0.7, 0.27)）
- 参考URL/画像: （あれば）

## Reference
（参照画像・コード・URL）
```

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

> `// CHANGED` コメントの運用: 日付を付与する（例: `// CHANGED(2026-02-14)`）。
> 1ヶ月以上経過したコメントはリファクタリング時に除去する。

---

## 4. スキル更新ルール

### 権限

| 操作 | Claude | Gemini | GPT | ユーザー |
|------|--------|--------|-----|---------|
| skills/ 閲覧 | ○ | ○ | ○ | ○ |
| skills/ 修正提案 | ○ | ○ | ○ | ○ |
| skills/ 正本マージ | ○ | ✕ | ✕ | ○ |
| LEARNINGS.md 追記 | ○ | ○ | ○ | ○ |

> 提案のみ、マージはClaude/ユーザー。エージェントに直接書き換え権限を与えるとスキルは数日で破綻する。

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
│   ├── PROMPT-STRUCTURE.md    ← Gemini向け具体テンプレート（併存）
│   └── ...
```

---

## 6. PROMPT-STRUCTURE.md との関係

本文書 = **マルチエージェント運用の上位方針**。
PROMPT-STRUCTURE.md = **Gemini向けの具体的テンプレート**（引き続き使用可）。

将来的にPROMPT-STRUCTURE.mdの内容は `skills/shader-impl.md` と `context-pack/TASK.md` テンプレートに分解・吸収される可能性がある。当面は併存。

---

## 7. 策定経緯

| ラウンド | 内容 |
|---------|------|
| R1 | 三者に同一質問「コンテキスト共有の最適設計」→ 初期案収集 |
| R1→R2 | ChatGPTの提案をGeminiに、Geminiの提案をChatGPTに相互レビュー |
| R2 | 収束: 4点セット×動的ロード共存、LEARNINGS.md、ファイルツリー必須 |
| v1.1 | レビュー指摘反映: 配置整合、HTML例外、CHANGED日付化、tree フィルタ |

### 三者の貢献

- **ChatGPT**: 分離統治、4点セットハンドオフ、権限制御、ACCEPTANCE省略禁止
- **Gemini**: Visual Specs必須、ファイルツリーが最重要コンテキスト、LEARNINGS.md、Claude実装禁止
- **Claude**: Layer構成の統合設計、既存docs体系との整合、運用フローの具体化
