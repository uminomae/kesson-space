# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-11
**セッション**: #3 完了

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
- [x] **Gemini MCP連携構築**（mcp_servers/gemini_threejs.py）
- [x] **使用量追跡ツール**（get_usage, reset_usage）

### 進行中

- [ ] ビジュアル微調整サイクル（Claude=プロンプト、Gemini=実装、User=判定）

### 未着手

- [ ] 欠損データ構造設計（data/kesson/）
- [ ] クリック時の詳細ページ遷移
- [ ] モバイル対応
- [ ] 音響の検討

---

## ⚠️ Three.js作業時の重要ルール

**シェーダーや視覚的品質が重要なThree.jsコードを書く際は、Geminiへの作業依頼を検討すること。**

### 判断基準

| 状況 | 対応 |
|------|------|
| シェーダー（GLSL）の新規作成・改良 | → Geminiに依頼 |
| 視覚的品質が重要なアニメーション | → Geminiに依頼 |
| 複数ファイルの構成・リファクタリング | → Claudeが対応 |
| バグ修正・デバッグ | → Claudeが対応 |

### 呼び出し方

```
「Geminiでシェーダーを生成して」
「proモデルで水面のコードを作って」
「Geminiの使用量を見せて」
```

**ユーザーが明示した時のみGeminiを使用。自動呼び出しはしない。**

---

## Claude × Gemini 分業体制

| 役割 | 担当 | 強み |
|------|------|------|
| マネージャー | Claude | コンテキスト把握、複数ファイル管理、対話、プロジェクト管理 |
| プログラマー | Gemini | シェーダー、視覚的品質の高いThree.jsコード生成 |

### MCPツール一覧

| ツール | 用途 |
|--------|------|
| `generate_threejs_code` | Three.jsコード生成 |
| `generate_shader` | GLSLシェーダー生成 |
| `review_threejs_code` | コードレビュー |
| `compare_implementations` | Claude vs Gemini 比較 |
| `list_models` | 利用可能モデル一覧 |
| `get_usage` | 使用量確認 |
| `reset_usage` | 使用量リセット |

### コスト

- 月間予算: ¥1,000
- flash: ¥0.07/回（約14,000回/月）
- pro: ¥5.0/回（約200回/月）

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

1. ビジュアル微調整プロンプトを作成
2. **Geminiに投入**（MCP経由） → 結果判定
3. 反復サイクルを回す

---

## 技術的メモ

- Three.js 0.160.0（CDN）
- シェーダー: simplex noise使用（GLSL埋め込み）
- ポート: 3001（pjdhiroの4000と干渉回避）
- ベースライン: src/versions/v001-baseline.js
- MCP: mcp_servers/gemini_threejs.py
- 使用量記録: .gemini_usage.json（gitignore済み）

---

## 参照リンク

- [CONCEPT.md](./CONCEPT.md) - 理論とビジュアルの対応
- [ARCHITECTURE.md](./ARCHITECTURE.md) - ファイル構成・技術決定・Gemini連携詳細
- [PROMPT-STRUCTURE.md](./PROMPT-STRUCTURE.md) - プロンプトテンプレート
- [src/versions/LOG.md](../src/versions/LOG.md) - バージョン追跡ログ
- [mcp_servers/README.md](../mcp_servers/README.md) - MCPセットアップ手順
