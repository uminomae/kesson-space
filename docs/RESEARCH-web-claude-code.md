# Web版 Claude Code 検証レポート

**検証日**: 2026-02-16
**検証内容**: DTアプリ「コード」機能（Web版 Claude Code）で T-040-11 Read More を実装
**セッションID**: `session_01RaSUALi81owW3pZAcKXsP3`
**ブランチ**: `claude/test-vs-cli-differences-Mejjf`
**コミット**: `0cc44c1`

---

## 結論

**指示書品質が高ければ、CLI と Web で実装結果に差は出ない。差は作業開始までの準備工程に集中する。**

---

## 1. CLI vs Web 比較

| 観点 | CLI (Codex) | Web版 Claude Code |
|------|------------|-------------------|
| ブランチ取得 | ワークツリーに既存、即作業可能 | `main` のみクローン。手動 fetch が必要 |
| 環境認識 | ローカルの全ブランチ・ワークツリーを把握 | リモートの存在に気づくまでラグあり |
| ブラウザ確認 | `localhost:3001` で即時確認 | 不可（コードレビューのみ） |
| コミット先 | `feature/kesson-articles` | `claude/test-vs-cli-differences-Mejjf`（独自ブランチ） |
| 実装コード | 指示書通り | 同一（指示書が具体的だったため差なし） |
| `gh` CLI | 利用可能 | 未インストール |

---

## 2. 発見した問題と対策

### P1: ブランチ不在問題（最大の落とし穴）

**現象**: Web環境の初期クローンは `main` のみ。指示書に `feature/kesson-articles` と書いてあっても、クローン時に含まれていなければ「存在しない」と判断してゼロから作ろうとする。

**対策（指示書テンプレート改善）**:
```
## 前提手順（Web版 Claude Code 用）
git fetch origin feature/kesson-articles
git checkout feature/kesson-articles
```

→ **指示書に「前提手順」セクションを必ず含める**運用にすべき。CLI では不要だが、Web版での安全弁として機能する。

### P2: ブラウザ確認不可

**影響**: CSS やレイアウトの視覚的バグは検出不可能。

**対策**: Web版の役割を以下に限定:
- ロジック実装（JS の関数追加・修正）
- コードレビュー・静的解析
- ドキュメント作成

→ **視覚的検証は CLI 側 or DT が担当**する分業を明文化。

### P3: `gh` CLI 未搭載

**影響**: PR 作成、issue 操作ができない。

**対策**: GitHub 連携はチャット側 Claude（GitHub MCP）か DT が担当。Web版は実装に専念。

### P4: 独自ブランチ命名

**現象**: Web版は `claude/test-vs-cli-differences-Mejjf` のような独自ブランチ名を生成。

**影響**: ブランチが散らかる。merge 戦略が不明確。

**対策**:
- 検証用ブランチは使用後に削除する運用
- 本番利用時は指示書で明示的に `git checkout feature/xxx` を指定
- 定期的に `claude/*` ブランチを掃除

---

## 3. 運用上の位置づけ

### Web版 Claude Code が向いている作業

- 具体的な JS コード付き指示書に基づく実装
- ロジック変更（UI なし）
- コードレビュー・リファクタリング
- ドキュメント・テスト生成
- CLI Codex が Quota exceeded 時の代替

### Web版 Claude Code が向いていない作業

- CSS/レイアウトの視覚的調整
- 複数ブランチ間の複雑な操作
- PR 作成・GitHub 連携
- Three.js / GLSL シェーダーの視覚確認が必要な作業

---

## 4. 未検証事項

| 項目 | 重要度 | 理由 |
|------|--------|------|
| コンテキスト上限 | 中 | 長時間・大規模タスクでどうなるか未確認 |
| セッション持続性 | 中 | セッション切断時の作業復旧可否 |
| コスト体系 | 低 | Pro/Max プラン内の利用枠か、Codex CLI とは別カウントか |
| 並列実行 | 中 | CLI Codex と Web版を同時にdiff作業にかけられるか |
| AGENTS.md 対応 | 低 | Web版がリポジトリの AGENTS.md を読むか |

---

## 5. 指示書テンプレート改善案

現在の指示書フォーマットに以下を追加すべき:

```markdown
## 前提手順

### CLI (Codex)
ワークツリー: `/Users/uminomae/dev/kesson-articles`
→ 追加手順なし

### Web版 Claude Code
```bash
git fetch origin feature/kesson-articles
git checkout feature/kesson-articles
```
→ ブランチが存在しない場合は `git ls-remote origin` で確認
```

---

## 6. ブランチ掃除

検証で作成された以下のブランチは、diff 比較後に削除可能:

```
claude/test-vs-cli-differences-Mejjf
```

削除コマンド:
```bash
git push origin --delete claude/test-vs-cli-differences-Mejjf
```

---

## 参照

- T-040-11 指示書: `docs/INSTRUCTIONS-articles-readmore.md`
- CLI 側実装: `feature/kesson-articles` ブランチ
- diff 比較: `git diff feature/kesson-articles..claude/test-vs-cli-differences-Mejjf -- index.html`
