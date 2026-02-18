# kesson-space — Claude Code CLI

## 1. 役割定義

kesson-space プロジェクトの Claude Code CLI エージェントとして動作する。
DT（Claude.ai Desktop）から指示書を受けて実装するか、ユーザーと直接対話してタスクを遂行する。
セッション中は以下のガードルール（§3）を常時適用する。

## 2. ワークツリーシステム

### 命名規則

`kesson-{llm}-{app}-{補足}` — 全て小文字・ハイフン区切り

| 位置 | 値 | 例 |
|---|---|---|
| llm | `claude` / `codex` | 省略可（LLM無関係なら） |
| app | `code` / `dt` / `app` / `cli` | code=Code, dt=DT, app=App, cli=CLI |
| 補足 | `check` 等 | 省略可 |

### ワークツリー一覧

| ワークツリー | パス | ブランチ | 用途 |
|---|---|---|---|
| **main** | `/Users/uminomae/dev/kesson-space` | main | 本番（直接コミット非推奨） |
| Codex App (staging) | `/Users/uminomae/dev/kesson-codex-app` | feature/dev | 目視確認ゲート・ステージング |
| Codex App 1 | `/Users/uminomae/dev/kesson-codex-1` | feature/codex-1 | Codex App 実装用 |
| Codex App 2 | `/Users/uminomae/dev/kesson-codex-2` | feature/codex-2 | Codex App 実装用 |
| Codex App 3 | `/Users/uminomae/dev/kesson-codex-3` | feature/codex-3 | Codex App 実装用 |

### ワークツリールール

- 作業前に `pwd` で現在のワークツリーを確認する（誤ワークツリーでの変更を防止）
- 作業開始時は `git fetch origin && git pull` で最新化する
- 指示書にはワークツリーパスとブランチを必ず明記する

## 3. ガードルール

### SH（セッションヘルス）— 常時監視

- **SH-1**: シェーダー全文読み込みは2ファイルまで。超過時はセクション指定に切替
- **SH-2**: 長大なコード出力時は分割出力を提案
- **SH-3**: 累積ファイル参照8超で参照整理を提案
- **SH-4**: 連続ツール呼び出し5回で中間確認
- **SH-5**: Gemini MCP応答はdiffのみ抽出（全文保持しない）
- **SH-6**: 高負荷タスク開始前にコンテキスト残量を事前判定

### PM（プロジェクト管理）— タスク認識時に発動

- **PM-1**: タスク分類（実装/修正/コンテンツ/レビュー/シェーダー）
- **PM-2**: 委譲先判断（§6マトリクス参照）
- **PM-3**: 指示書生成（`skills/project-management-agent.md` テンプレート）
- **PM-4**: ワークツリー割り当て（§2参照）
- **PM-5**: 並列実行可否を明記
- **PM-6**: DT確認手順を含める

### QG（品質ガード）

- `src/config.js` = Single Source of Truth。パラメータは必ずここに定義
- 変更箇所に `// CHANGED(YYYY-MM-DD)` コメント付与
- シェーダー/GLSL実装 → Gemini MCPに委譲（ユーザー許可時のみ）
- テスト: `node tests/config-consistency.test.js` + `?test` E2E

## 4. セッション開始手順

指示書を受け取ったら、または新セッション開始時に以下を実行:

1. GitHub Issues（open）を確認して現在の状態を把握
2. `pwd` でワークツリーを確認（§2テーブルと照合）
3. `git status && git log --oneline -5` で作業環境を確認
4. ユーザーに状態レポートを報告:
   - 現在のワークツリー・ブランチ
   - 直近のコミット
   - 推奨タスク（Issue の P0/P1 ラベル）
5. 負荷判定（🟢低/🟡中/🔴高）— 🔴の場合は分割提案

## 5. セッション終了チェックリスト

セッション終了前に必ず実行:

- [ ] 作業中の Issue にコメントで進捗を記録（AGENTS.md §5.2 準拠）
- [ ] コミット: `docs: session #XX end` （必要に応じて）
- [ ] `git push origin <branch>`
- [ ] ユーザーに完了報告

**注意: main への直接 push は行わない。PR経由でマージする。**

## 6. 委譲マトリクス

| タスク種別 | 委譲先 | 備考 |
|---|---|---|
| シェーダー/GLSL | Gemini MCP | ユーザー許可時のみ |
| Three.jsメッシュ・マテリアル | Gemini MCP | 3D専門性 |
| 複数ファイル + 設計判断 | Claude Code CLI | コンテキスト理解 |
| 単純実装・定型作業 | OpenAI Codex CLI | 高速・並列向き |
| PoC・一発実装・コードレビュー | OpenAI Codex App | クラウド実行（codex 5.2/5.3）。指示書を `docs/prompts/` に配置 |
| DT Code向けタスク | DT Code（Web版） | `docs/prompts/NEXT-TASK.md` 経由。DTチャットが指示書作成・push |
| 1ファイル・即時必要 | Claude直接 | 例外 |

指示書フォーマット詳細: `skills/project-management-agent.md`

## 7. 技術スタック・参照

### 技術スタック

- Three.js 0.160.0 (ES Modules, importmap, self-host `vendor/`)
- Bootstrap 5.3.3 (CDN, `?dev` 時のみ動的ロード)
- ローカルサーバー: `./serve.sh` → http://localhost:3001/
- デプロイ: GitHub Pages (main ブランチ直接)

### 参照リンク

- [GitHub Issues](https://github.com/uminomae/kesson-space/issues) — タスク正本・進捗追跡
- [docs/AGENT-RULES.md](docs/AGENT-RULES.md) — マルチエージェント運用ルール（完全版）
- [skills/project-management-agent.md](skills/project-management-agent.md) — 委譲判断・指示書生成
- [skills/shared-quality.md](skills/shared-quality.md) — コーディング品質基準
