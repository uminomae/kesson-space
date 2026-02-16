# TODO: 欠損駆動思考 記事一覧 (T-040)

**作成日**: 2026-02-16  
**優先度**: P1  
**ブランチ**: `feature/kesson-articles`  
**実装者**: Claude Code（単体）  

---

## 概要

kesson-space の index.html に、pjdhiro サイトの欠損駆動思考関連記事を最新3件表示する。

---

## タスク一覧

### Phase 0: 準備（DT 作業）

- [ ] **T-040-00a**: pjdhiro に JSON API テンプレート配置
  - ファイル: `api/kesson-articles.json`（ルート直下 `api/` ディレクトリ）
  - テンプレート: `docs/RESEARCH-pjdhiro-json-api.md` §4 参照
  - push 先: `public-pjdhiro` ブランチ
  - **プレフライトチェック**: `docs/RESEARCH-pjdhiro-json-api.md` §6 参照
  - **ブロッカー**: なし（Claude Code はモックで先行開発可能）

- [ ] **T-040-00b**: JSON API 動作確認
  - URL: `https://uminomae.github.io/pjdhiro/api/kesson-articles.json`
  - 確認項目:
    - JSON valid か
    - teaser URL が正しいか
    - date ソートが正しいか
    - excerpt に HTML 残りがないか
  - **要検証項目 V1-V6**: `docs/RESEARCH-pjdhiro-json-api.md` §3 参照
  - もし V1-V6 で問題多発 → 代替案 A1 (GitHub Actions) を検討（§5 参照）

- [ ] **T-040-00c**: pjdhiro 対象 pages に `date:` 追加確認
  - `thinking-kesson.md`, `thinking-bi.md` 等の front matter に `date:` があるか
  - 理由: `sort: "date"` でソートするため、`date` が nil だと順序不定
  - 現状: 両方 `date: 2026-01-26` を設定済み → OK のはず

### Phase 1: 基盤作成（Claude Code）

- [ ] **T-040-01**: ワークツリー + ブランチ作成
  ```bash
  cd /Users/uminomae/Documents/GitHub/kesson-space
  git branch feature/kesson-articles main
  git worktree add ../kesson-articles feature/kesson-articles
  ```

- [ ] **T-040-02**: モックデータ配置
  - `assets/articles/articles.json` (5件)
  - **判断**: pjdhiro API 完成前にモックで開発を進める

- [ ] **T-040-03**: 指示書・ドキュメント配置
  - `docs/INSTRUCTIONS-kesson-articles.md`
  - `docs/pjdhiro-api-kesson-articles.json.txt`（メモ）

### Phase 2: index.html 実装（Claude Code）

- [ ] **T-040-04**: CSS 追加 — `#articles-section` スタイル
  - devlog カードスタイルを流用
  - `/* Devlog Gallery */` コメントの直前に配置

- [ ] **T-040-05**: HTML 追加 — articles セクション
  - 配置: `#hero-spacer` と `#devlog-gallery-section` の間
  - 構成: h2 "Articles" + count + grid container + error div

- [ ] **T-040-06**: JavaScript 追加 — データ取得 + カード描画
  - API fetch → 失敗時モックにフォールバック
  - 日付降順ソート → 最新3件描画
  - カードクリック → `target="_blank"` で pjdhiro ページ遷移

- [ ] **T-040-07**: 動作確認
  - チェックリスト: `docs/INSTRUCTIONS-kesson-articles.md` §チェックリスト
  - 最優先: **バグなく遷移すること**

### Phase 3: API 接続（DT + Claude Code）

- [ ] **T-040-08**: pjdhiro API 完成後、モック → API 切り替え確認
  - フォールバックが正常動作するか
  - キャッシュバスター要否の判断

### Phase 4: UI 改善（後続）

- [ ] **T-040-09**: devlog との UI 差別化検討
- [ ] **T-040-10**: index.html ナビゲーション統合検討
- [ ] **T-040-11**: 全件表示 / Read More 機能（記事が増えた場合）

---

## 判断ログ

| 日付 | 判断 | 理由 | 参照 |
|------|------|------|------|
| 2026-02-16 | pjdhiro JSON API 方式を採用 | Jekyll Liquid で静的生成可能。CORS 問題なし。プラグイン不要 | RESEARCH §1 |
| 2026-02-16 | `api/` ルート直下に配置（`_pages` 配下ではない） | `_` 始まりディレクトリの `include` 挙動への依存リスク回避 | RESEARCH §2-1 |
| 2026-02-16 | loop+push 方式（`where_exp` OR 不使用） | GitHub Pages は Jekyll 3.10。`where_exp` の OR は Jekyll 4 専用 | RESEARCH §2-2 |
| 2026-02-16 | モックデータで先行開発 | API 検証と並行して実装を進めるため | — |
| 2026-02-16 | 表示位置: devlog の上、最新3件 | DT 指示。スクロール導線の自然さ | — |
| 2026-02-16 | スタイルは devlog 流用 | DT 指示。バグなし遷移が最優先。差別化は後続 | — |
| 2026-02-16 | 対象: tags/categories に欠損駆動思考 or デザイン思考 | _posts + _pages 両方。OR 条件 | — |
| 2026-02-16 | ChatGPT 参照ドキュメントは Jekyll 4.x 版 | フィルタ可否は 3.10 で実デプロイして確認が必要 | RESEARCH §3 冒頭注意 |
| 2026-02-16 | V1-V6 検証で問題多発時は GitHub Actions 方式に切替 | 代替案 A1。Jekyll バージョン制約から解放される | RESEARCH §5 |

---

## 技術メモ

### Jekyll 3.10 制約（GitHub Pages）

- `where_exp` に `or` 演算子は使えない → loop+push で回避
- カスタムプラグインは `--safe` で無効 → 標準 Liquid のみ使用
- **ChatGPT が参照した Jekyll docs は 4.x 版**。3.10 で動かないフィルタがあり得る（V1, V2）
- 詳細: `docs/RESEARCH-pjdhiro-json-api.md`

### kesson-space 側の注意

- fetch フォールバック: API → モック の順序。両方失敗時はエラー表示
- 外部リンク: `target="_blank"` + `rel="noopener"`
- XSS 対策: JSON データを innerHTML に直接注入するため、テンプレートリテラル内でのエスケープに注意（モックデータは信頼済み、API データは pjdhiro Jekyll が生成するため信頼可）

### pages 固有の注意

- `doc.excerpt` が空になることがある → テンプレートで `doc.content` にフォールバック
- `date:` が front matter にないとソート順が不定 → pages には必ず `date:` を入れる運用

---

## 関連ドキュメント

- `docs/INSTRUCTIONS-kesson-articles.md` — Claude Code 実装指示書
- `docs/RESEARCH-pjdhiro-json-api.md` — JSON API 技術検証レポート（ChatGPT 回答の吟味含む）
- `docs/DEVLOG-SPEC.md` — devlog 仕様（UI 参照元）
