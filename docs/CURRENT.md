# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-11
**セッション**: #2 進行中

---

## 現在の状態

### 完了

- [x] リポジトリ作成
- [x] コンセプト文書（docs/CONCEPT.md）
- [x] Three.js MVP実装（src/main.js）— Gemini初版
- [x] ローカル開発環境（serve.sh, ポート3001）
- [x] プロジェクト管理体制（WORKFLOW.md, ARCHITECTURE.md）
- [x] HTMLとJS分離（index.html + src/main.js）
- [x] GitHub Pages有効化
- [x] main.jsをシェーダー版に更新
- [x] バージョン管理体制の構築（src/versions/, LOG.md, PROMPT-STRUCTURE.md）

### 進行中

- [ ] ビジュアル微調整サイクル（Claude=プロンプト、Gemini=実装、User=判定）

### 未着手

- [ ] 欠損データ構造設計（data/kesson/）
- [ ] クリック時の詳細ページ遷移
- [ ] モバイル対応
- [ ] 音響の検討

---

## ビジュアル調整の役割分担

| 役割 | 担当 | 成果物 |
|------|------|--------|
| プロンプト設計・版管理 | Claude | docs/prompts/PNNN-*.md, LOG.md更新 |
| コード実装 | Gemini | src/versions/vNNN-*.js |
| 判定（◎○△✗） | User | 口頭報告 → Claudeが記録 |

---

## 未決定事項

| 項目 | 選択肢 | メモ |
|------|--------|------|
| 光の数・配置 | 固定30個 / データ駆動 | 現在は固定30個 |
| 詳細ページ形式 | 別HTML / モーダル / SPA | 未検討 |
| データ形式 | YAML / JSON | YAMLの方向 |
| pjdhiroとの統合 | 別サイト / サブディレクトリ | 当面は別サイト |

---

## 参照画像

Prompt: "Abstract figure on the boundary between form and formlessness, body contour as Julia set fractal edge, luminous point at the center of chest, hands open, holding nothing yet receiving everything, dark slate blue gradient background, ethereal and philosophical, digital art, high contrast --ar 16:10"

---

## 次セッションのタスク

1. 最初のビジュアル微調整プロンプトを作成
2. Geminiに投入 → 結果判定
3. 反復サイクルを回す

---

## 技術的メモ

- Three.js 0.160.0（CDN）
- シェーダー: simplex noise使用（GLSL埋め込み）
- ポート: 3001（pjdhiroの4000と干渉回避）
- ベースライン: src/versions/v001-baseline.js

---

## 参照リンク

- [CONCEPT.md](./CONCEPT.md) - 理論とビジュアルの対応
- [ARCHITECTURE.md](./ARCHITECTURE.md) - ファイル構成・技術決定
- [PROMPT-STRUCTURE.md](./PROMPT-STRUCTURE.md) - プロンプトテンプレート
- [src/versions/LOG.md](../src/versions/LOG.md) - バージョン追跡ログ
