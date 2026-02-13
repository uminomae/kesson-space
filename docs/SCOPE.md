# SCOPE.md — kesson-space のスコープと参照体系

**バージョン**: 1.0
**作成日**: 2026-02-13
**配置先**: `docs/SCOPE.md`

---

## 1. 本リポジトリの位置づけ

kesson-spaceは、欠損駆動思考プロジェクト群の**3D体験空間**を担当するリポジトリである。

```
kesson-driven-thinking（理論の正本・Private）
    │
    ├──→ kesson-space（3D体験空間）  ← 本リポジトリ
    │
    └──→ pjdhiro（ブログ・PDF配信）
```

情報の流れは**単方向**。kesson-driven-thinking → kesson-space。逆方向の依存は作らない。

---

## 2. このリポジトリが扱うこと

Three.jsサイト（https://uminomae.github.io/kesson-space/）に関する**技術的な実装・運用・改善**のみ。

具体的には：

- Three.js / GLSL シェーダーの実装・調整
- サイトのUI/UX・モバイル対応・パフォーマンス
- ナビゲーション・PDFビューアー・言語切替
- devパネル・テスト・デプロイ
- CONCEPT.md に基づく理論→視覚表現の変換判断

## 3. このリポジトリが扱わないこと

- 理論の構築・精緻化（→ kesson-driven-thinking）
- 保持論点（ISS-*）の議論（→ kesson-driven-thinking）
- タスク（TASK #*）のうち理論に関するもの（→ kesson-driven-thinking）
- PDF本文の生成・変換ルールの策定（→ kesson-driven-thinking）
- ブログ記事の執筆（→ pjdhiro）

理論的な判断が必要になった場合は、kesson-driven-thinkingセッションで決定し、その結果をCONCEPT.mdに反映する。kesson-spaceセッションはCONCEPT.mdを参照して実装する。

---

## 4. cross-repo参照プロトコル

### kesson-thinking → kesson-space（読み取り）

kesson-driven-thinkingセッションが本リポジトリの状態を確認する際の参照ポイント。

| 参照ファイル | 提供する情報 | 備考 |
|-------------|-------------|------|
| `docs/CURRENT.md` | 進捗・未着手タスク・技術メモ | セッション毎に更新 |
| `docs/CONCEPT.md` | 理論と視覚表現の対応表 | 理論側の決定を反映 |

これが本リポジトリからkesson-thinkingへの**唯一の報告経路**である。CURRENT.mdとCONCEPT.mdを正確に維持することが、cross-repo連携の品質を決める。

### kesson-space → kesson-thinking（参照しない）

本リポジトリからkesson-driven-thinkingの内部文書を参照する運用はない。理論的な指示はCONCEPT.mdを経由して受け取る。

### 変換ルールの所在

理論→3D体験空間への変換ルールは、kesson-driven-thinking側の `transform/reader-rules/reader-rules-space.md` に正本がある。本リポジトリにコピーは持たない。変換ルールの更新が必要な場合は、kesson-driven-thinkingセッションで行う。

---

## 5. Claude.ai Project（kesson-space）の運用

本リポジトリに対応するClaude.ai Projectは、Three.jsサイトの技術的作業に特化する。

### PKに含まれる文書の読み方

PKにはkesson-driven-thinking側の管理文書（README.md, architecture.md, CURRENT.md等）も含まれている。これらは**プロジェクト群の全体構造を理解するための文脈情報**であり、このセッションで直接操作する対象ではない。

| PK内の文書 | 由来 | このセッションでの扱い |
|-----------|------|---------------------|
| kesson-space の docs/* | 本リポジトリ | 直接操作対象 |
| kesson-thinking の docs/README.md | 親リポジトリ | 文脈参照のみ。運用ルールの参考 |
| kesson-thinking の docs/architecture.md | 親リポジトリ | 文脈参照のみ。構造理解の参考 |
| kesson-thinking の docs/CURRENT.md | 親リポジトリ | 文脈参照のみ。理論側の進捗確認 |

### セッションで理論的議論が発生した場合

kesson-spaceの実装中に理論的判断が必要になった場合：

1. 判断を保留し、ユーザーに報告する
2. 「この判断はkesson-driven-thinkingセッションで行うべきか？」を確認する
3. ユーザーがここで決定する場合はそれに従い、CONCEPT.mdに反映する
4. ユーザーがkesson-thinkingに持ち帰る場合は、CURRENT.mdに保留事項として記録する

---

## 6. 文書間の参照マップ

```
docs/
├── SCOPE.md（本ファイル）     ← 位置づけ・スコープ・参照体系
├── CURRENT.md                ← 進捗・タスク（★ cross-repo報告経路）
├── CONCEPT.md                ← 理論↔視覚対応（★ cross-repo報告経路）
├── ARCHITECTURE.md           ← 技術構成・ファイル依存関係
├── WORKFLOW.md               ← セッション管理手順
├── REVIEW-REPORT.md          ← 品質レビュー結果
├── PROMPT-STRUCTURE.md       ← Geminiプロンプトテンプレート
└── prompts/                  ← 個別プロンプト
```

各文書の責務：

| 文書 | 責務 | 他文書との境界 |
|------|------|--------------|
| SCOPE.md | プロジェクト群における位置・参照ルール | 技術詳細はARCHITECTURE.mdへ |
| CURRENT.md | 今の進捗・次にやること | 運用ルールはここに書かない |
| CONCEPT.md | 理論→視覚の変換定義 | 実装詳細はARCHITECTURE.mdへ |
| ARCHITECTURE.md | ファイル構成・依存関係・設計原則 | 進捗はCURRENT.mdへ |
| WORKFLOW.md | セッション開始/終了の手順 | スコープはSCOPE.mdへ |
| REVIEW-REPORT.md | 品質レビューの記録 | 定常運用には含めない |
| PROMPT-STRUCTURE.md | Gemini向けプロンプト設計 | kesson-space固有 |

---

## 7. 更新ルール

- SCOPE.mdの変更は、プロジェクト群の構造変更を伴う場合にのみ行う
- 構造変更はkesson-driven-thinkingセッションで決定し、両リポジトリに反映する
- 本ファイルの内容がkesson-thinking側の `docs/architecture.md` と矛盾する場合、kesson-thinking側を正とする
