# WORKFLOW.md — セッション運用

**バージョン**: 2.2
**更新日**: 2026-02-17

---

## 1. セッション開始手順

→ **[ルートREADME.md](../README.md) を参照**

常駐エージェント起動、状態確認、ワークツリー確認の手順はルートREADMEに記載。

### 補足: コンテキスト負荷の事前判定

**ユーザーがタスクを指定した時点で、着手前に必ず実行する。**

| カテゴリ | 条件 | 対応 |
|---------|------|------|
| 🟢 低 | CSS/HTML修正、config値調整、ドキュメント更新 | そのまま着手 |
| 🟡 中 | 単一シェーダー修正、E2Eテスト実行、ナビ機能調整 | 作業範囲を確認 |
| 🔴 高 | 複数シェーダー修正、Gemini MCP連携、4エージェント分析 | **セッション分割を提案** |

詳細は [AGENT-RULES.md §8](./AGENT-RULES.md) を参照。

### 補足: ワークツリー統合チェック

複数ワークツリーが存在する場合、**他ワークツリーの最新を取り込む必要があるか**を確認。
必要なら対象ブランチを明示し、マージ方針（fast-forward / merge）をユーザーに確認する。

---

## 2. セッション終了手順

### 必須チェックリスト

- [ ] `docs/CURRENT.md` を更新（完了タスク、未完了、新規課題）
- [ ] `docs/TODO.md` を更新（完了→移動、新規タスク→追加）
- [ ] ブランチ確認：作業ブランチで作業した場合、mainにマージするか？
- [ ] GitHubにプッシュ

### CURRENT.md テンプレート

```markdown
# CURRENT - 進捗・引き継ぎ

**最終更新**: YYYY-MM-DD
**セッション**: #N タイトル

## 現在の状態
### 完了 / 進行中 / 未着手

## 技術的メモ
## 参照リンク
```

### セッション番号の採番

- 新しいセッションごとに `#N` をインクリメント
- 日付が変わったら新セッション
- 長時間空いたら新セッション

---

## 3. 正本の原則

```
GitHub リポジトリ = 正本（single source of truth）
Project Knowledge = GitHubの同期先（読み取り専用の鏡）
```

PKを直接編集・削除しない。すべての変更はGitHubに対して行う。

### DTアプリの場合

```
Claude → GitHub APIで直接コミット → 完了
```

### ウェブ版の場合（DT App Code）

```
Chat で指示書作成 → docs/prompts/ に push
                        ↓
DT App Code: 「docs/prompts/NEXT-TASK.md を読んで実行して」
                        ↓
DT App Code: 実装 → GitHub API でコミット → push
                        ↓
Chat: diff 確認 → 承認 → main マージ → TODO 更新
```

詳細は [§3a. DT App Code 運用フロー](#3a-dt-app-code-運用フロー) を参照。

---

## 3a. DT App Code 運用フロー

PC拘束からの解放を目的に、DT App Code（Web版 Claude Code）をメイン実装環境として運用する。
CLI はフォールバック先として維持する。

参照: [ANALYSIS-dt-code-first.md](./ANALYSIS-dt-code-first.md)

### 指示書ベースのワークフロー

| ステップ | 実行者 | 操作 |
|----------|--------|------|
| 1. 指示書作成 | Chat（DT チャット） | `docs/prompts/NEXT-TASK.md` に push |
| 2. 実装指示 | ユーザー → DT App Code | 「docs/prompts/NEXT-TASK.md を読んで実行して」 |
| 3. 実装 & push | DT App Code | GitHub API でコミット（自動push） |
| 4. diff確認 | Chat | `git log` / `git diff` で変更確認 |
| 5. 承認 & マージ | ユーザー → Chat | main にマージ、TODO 更新 |
| 6. 指示書アーカイブ | Chat | `docs/prompts/done/` に移動 |

### 指示書ファイル規約

```
docs/prompts/NEXT-TASK.md              ← 常に「次のタスク」を配置
docs/prompts/done/T-XXX-description.md ← 完了した指示書を移動
docs/prompts/TEMPLATE-instruction-v2.md ← 指示書テンプレート
```

### DT Code / CLI の使い分け

| 条件 | 実行環境 |
|------|----------|
| git 操作 + ファイル編集 + テスト実行 | DT App Code |
| Gemini MCP 連携（シェーダー生成） | CLI（要検証） |
| DevTools 必須のプロファイリング | CLI / PC 作業 |
| 実機テスト | 物理デバイス操作 |
| DT Code のコンテキスト上限を超える大タスク | CLI |

### 環境判別

指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い環境を自己判定する。
CLI / DT App Code で操作コマンドが異なるため、テンプレートに環境判別セクションを含める。

---

## 4. Cross-repoプロトコル

### プロジェクト構成

```
kesson-driven-thinking（理論の正本・Private）
    │
    ├──→ kesson-space（3D体験空間）  ← 本リポジトリ
    │
    └──→ pjdhiro（ブログ・PDF配信）
```

情報の流れは**単方向**。kesson-driven-thinking → kesson-space。

### kesson-thinking → kesson-space（読み取り）

| 参照ファイル | 提供する情報 |
|-------------|-------------|
| `docs/CURRENT.md` | 進捗・未着手タスク・技術メモ |
| `docs/CONCEPT.md` | 理論と視覚表現の対応表 |

### kesson-space → kesson-thinking

本リポジトリからkesson-driven-thinkingの内部文書を参照する運用はない。
理論的な指示はCONCEPT.mdを経由して受け取る。

### 理論的議論が発生した場合

1. 判断を保留し、ユーザーに報告
2. 「この判断はkesson-thinkingセッションで行うべきか？」を確認
3. ここで決定するならCONCEPT.mdに反映。持ち帰るならCURRENT.mdに保留記録

---

## 5. ブランチ運用

| ブランチ | 役割 | pushする人/ツール |
|---------|------|------------------|
| main | 正本。GitHub Pagesデプロイ対象 | DTアプリ（GitHub API） |
| feature/* | 機能開発用 | 必要時に作成 |

- DTアプリは通常mainに直接push
- 大きな変更は feature/* で作業し、レビュー後にマージ
- **セッション終了時に必ず確認**: 作業ブランチが残っていたら、mainにマージするかをユーザーに確認

Worktree運用については [ENVIRONMENT.md §4](./ENVIRONMENT.md) を参照。

---

## 6. 参照リンク

- [README.md](../README.md) — セッション起動（エントリーポイント）
- [docs/README.md](./README.md) — ドキュメントハブ
- [ENVIRONMENT.md](./ENVIRONMENT.md) — 開発環境・ツールチェーン
- [AGENT-RULES.md](./AGENT-RULES.md) — エージェント分業
- [ANALYSIS-dt-code-first.md](./ANALYSIS-dt-code-first.md) — DT Code-first 分析
- [TEMPLATE-instruction-v2.md](./prompts/TEMPLATE-instruction-v2.md) — 指示書テンプレート v2
