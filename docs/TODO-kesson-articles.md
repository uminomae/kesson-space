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

### Phase 1: 基盤作成（Claude Code） ✅ 完了

- [x] **T-040-01**: ワークツリー + ブランチ作成
- [x] **T-040-02**: モックデータ配置 (`assets/articles/articles.json`)
- [x] **T-040-03**: 指示書・ドキュメント配置

### Phase 2: index.html 実装（Claude Code） ✅ 完了

- [x] **T-040-04**: CSS 追加 — `#articles-section` スタイル
- [x] **T-040-05**: HTML 追加 — articles セクション
- [x] **T-040-06**: JavaScript 追加 — データ取得 + カード描画
- [x] **T-040-07**: 動作確認 — DT テスト全項目 OK (2026-02-16)

### Phase 2.5: Read More 機能（Claude Code）

- [ ] **T-040-11**: Read More トグルボタン追加
  - 指示書: `docs/INSTRUCTIONS-articles-readmore.md`
  - 初期3件 → ボタンで残り展開 → Show Less で折りたたみ
  - CSS `.btn-read-more` は既存。JS のみ変更
  - **実装中**（CLI Codex で作業中）
  - Web版 Claude Code でも検証実装済み → `claude/test-vs-cli-differences-Mejjf` (`0cc44c1`)

### Phase 3: API 接続（DT + Claude Code）

- [ ] **T-040-08**: pjdhiro API 完成後、モック → API 切り替え確認
  - フォールバックが正常動作するか
  - キャッシュバスター要否の判断

### Phase 4: UI 改善（後続）

- [ ] **T-040-09**: devlog との UI 差別化検討
- [ ] **T-040-10**: index.html ナビゲーション統合検討

### Phase 5: 運用改善（横断）

- [ ] **T-040-12**: 指示書テンプレートに Web版 Claude Code 用「前提手順」セクション追加
  - `git fetch origin <branch>` + `git checkout <branch>` を含める
  - CLI では不要だが Web版での安全弁
  - 詳細: `docs/RESEARCH-web-claude-code.md` §5

- [ ] **T-040-13**: 検証ブランチ掃除
  - `claude/test-vs-cli-differences-Mejjf` を削除
  - diff 比較完了後に実行: `git push origin --delete claude/test-vs-cli-differences-Mejjf`

---

## 判断ログ

| 日付 | 判断 | 理由 | 参照 |
|------|------|------|------|
| 2026-02-16 | pjdhiro JSON API 方式を採用 | Jekyll Liquid で静的生成可能。CORS 問題なし。プラグイン不要 | RESEARCH-json §1 |
| 2026-02-16 | `api/` ルート直下に配置 | `_pages` 配下の `include` 挙動への依存リスク回避 | RESEARCH-json §2-1 |
| 2026-02-16 | loop+push 方式 | GitHub Pages は Jekyll 3.10。`where_exp` OR は Jekyll 4 専用 | RESEARCH-json §2-2 |
| 2026-02-16 | モックデータで先行開発 | API 検証と並行して実装を進めるため | — |
| 2026-02-16 | 表示位置: devlog の上、最新3件 | DT 指示。スクロール導線の自然さ | — |
| 2026-02-16 | スタイルは devlog 流用 | DT 指示。バグなし遷移が最優先 | — |
| 2026-02-16 | Phase 2 テスト全項目 OK | DT が localhost で全チェックリスト確認 | — |
| 2026-02-16 | T-040-11 Read More を Phase 2.5 として追加 | DT 要望。記事増加に備える | INSTRUCTIONS-readmore |
| 2026-02-16 | Web版 Claude Code は「ロジック実装 + レビュー」に限定 | ブラウザ確認不可。CSS/レイアウトは CLI or DT が担当 | RESEARCH-web §2-P2 |
| 2026-02-16 | 指示書に Web版用「前提手順」セクションを追加する運用 | ブランチ不在問題の根本対策 | RESEARCH-web §5 |

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
- XSS 対策: モックデータは信頼済み、API データは pjdhiro Jekyll が生成するため信頼可

### pages 固有の注意

- `doc.excerpt` が空になることがある → テンプレートで `doc.content` にフォールバック
- `date:` が front matter にないとソート順が不定 → pages には必ず `date:` を入れる運用

### Web版 Claude Code 運用

- ブランチ問題: `main` のみクローンされる。指示書に `git fetch` 手順を含める
- ブラウザ確認不可: 視覚的検証は CLI or DT が担当
- `gh` CLI 未搭載: GitHub 連携はチャット側 Claude (GitHub MCP) が担当
- 独自ブランチ `claude/*` が生成される → 使用後に削除する運用
- 詳細: `docs/RESEARCH-web-claude-code.md`

---

## 関連ドキュメント

- `docs/INSTRUCTIONS-kesson-articles.md` — Claude Code 実装指示書（Phase 1-2）
- `docs/INSTRUCTIONS-articles-readmore.md` — Read More 指示書（T-040-11）
- `docs/RESEARCH-pjdhiro-json-api.md` — JSON API 技術検証レポート
- `docs/RESEARCH-web-claude-code.md` — Web版 Claude Code 検証レポート
- `docs/DEVLOG-SPEC.md` — devlog 仕様（UI 参照元）
