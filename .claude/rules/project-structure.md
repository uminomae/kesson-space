<!-- Adapted from: creation-space (2026-03-24) -->
# プロジェクト構造

## ディレクトリレイアウト

```
kesson-space/
├── src/               # ソースコード
│   ├── config/        # SSoT: params, dev-ui, dev-registry
│   ├── core/          # Three.js セットアップ、レンダラー
│   ├── shaders/       # GLSL シェーダー
│   ├── consciousness/ # 意識シーン（レイマーチング SDF）
│   ├── styles/        # CSS（main.css 等）
│   └── devlog/        # Devlog ギャラリーシステム
├── assets/            # 静的データ（JSON, 画像, Blender）
├── vendor/            # Three.js 0.160.0 (self-hosted)
├── tests/             # テスト（Node.js static + E2E）
├── scripts/           # ユーティリティスクリプト
├── docs/              # 管理ドキュメント
├── knowledge/         # 理論・概念・スキーマ（docs/theory/ から移設）
├── transform/         # コンテンツ変換（devlog生成、スライド等）
├── content/           # Devlog Markdown コンテンツ
├── mcp_servers/       # Gemini MCP サーバー
└── .github/workflows/ # CI/CD
```

## データフロー

```
index.html → src/main.js → scene.js → core/ (renderer, background)
                                     → shaders/ (GLSL)
                                     → config/ (SSoT パラメータ)
```

## CSS 配置ルール

- Bootstrap 5.3.3: CDN（`?dev` 時のみ動的ロード）
- プロジェクト CSS: `src/styles/` に配置
- インラインスタイル: 原則禁止（config.js 経由の動的値のみ例外）

## 技術制約

| 制約 | 理由 |
|---|---|
| ビルドツールなし | GitHub Pages + ES Modules importmap |
| Three.js 0.160.0 固定 | vendor/ にセルフホスト |
| npm 依存追加禁止 | メンテナンス負荷削減（要ユーザー承認） |
| config.js = SSoT | パラメータ散在を防止 |
