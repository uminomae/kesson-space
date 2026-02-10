# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-11
**セッション**: #1 完了

---

## 現在の状態

### 完了

- [x] リポジトリ作成
- [x] コンセプト文書（docs/CONCEPT.md）
- [x] Three.js MVP実装（src/main.js）
- [x] ローカル開発環境（serve.sh, ポート3001）
- [x] プロジェクト管理体制（WORKFLOW.md, ARCHITECTURE.md）
- [x] HTMLとJS分離（index.html + src/main.js）

### 進行中

- [ ] GitHub Pages有効化（Settings → Pages → main / root）
- [ ] main.jsをシェーダー版に更新（コード提供済み、ローカルでコピペ必要）

### 未着手

- [ ] 欠損データ構造設計（data/kesson/）
- [ ] クリック時の詳細ページ遷移
- [ ] モバイル対応
- [ ] 音響の検討

---

## 未決定事項

| 項目 | 選択肢 | メモ |
|------|--------|------|
| 光の数・配置 | 固定30個 / データ駆動 | 現在は固定30個 |
| 詳細ページ形式 | 別HTML / モーダル / SPA | 未検討 |
| データ形式 | YAML / JSON | YAMLの方向 |
| pjdhiroとの統合 | 別サイト / サブディレクトリ | 当面は別サイト |

---

## 次セッションのタスク

1. main.jsをシェーダー版に更新（ローカルで）
2. ローカルサーバーで動作確認（./serve.sh）
3. GitHub Pages有効化・動作確認
4. 詳細ページの設計検討

---

## 技術的メモ

- Three.js 0.160.0（CDN）
- シェーダー: simplex noise使用（GLSL埋め込み）
- ポート: 3001（pjdhiroの4000と干渉回避）
- Gemini用Three.jsプロンプト作成済み

---

## 参照リンク

- [CONCEPT.md](./CONCEPT.md) - 理論とビジュアルの対応
- [ARCHITECTURE.md](./ARCHITECTURE.md) - ファイル構成・技術決定
- [WORKFLOW.md](./WORKFLOW.md) - セッション管理手順
