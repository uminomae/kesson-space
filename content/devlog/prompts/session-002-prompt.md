# session-002 インフォグラフィック生成プロンプト

## 使用ツール
Gemini MCP (flash) → Canvas 2D API版に修正

## プロンプト
以下の開発ログからインフォグラフィックを生成してください。

要件:
- アスペクト比: 16:9 (1280x720)
- スタイル: テック系、ダークテーマ (#0a0e1a)
- アクセントカラー: blue (#4a90d9), cyan (#00d4ff), amber (#f59e0b)
- 含める要素: タイムライン、技術スタック、主要マイルストーン
- 文字: 日本語

開発ログ内容:
- Title: "Part 2: UX実装"
- Date: "02-12 〜 02-13"
- 統一ブレスシステム（HTML + FOV + シェーダー同期）
- Bootstrap 5 devパネル（13トグル）
- OrbitControls撤廃 → スクロール駆動カメラダイブ
- モバイルファーストスクロール
- 横スワイプ回転 + ピンチズーム
- vmin基準レスポンシブ統一
- Gemシェーダー探求

技術的決定:
- OrbitControls廃止 → モバイルファースト設計
- vmin単位でフォントサイズ統一
- Gem正三角形配置

## 備考
- Gemini出力はThree.js TextGeometry（日本語非対応）だったため、Canvas 2D APIベースに手動修正
- 生成ファイル: session-002-generator.html（ブラウザで開いてダウンロード）
