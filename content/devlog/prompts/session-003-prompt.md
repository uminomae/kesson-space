# session-003 インフォグラフィック生成プロンプト

## 使用ツール
Gemini MCP (flash) → Canvas 2D API版に修正

## プロンプト
以下の開発ログからインフォグラフィックを生成してください。

要件:
- アスペクト比: 16:9 (1280x720)
- スタイル: テック系、ダークテーマ (#0a0e1a)
- アクセントカラー: blue (#4a90d9), cyan (#00d4ff), amber (#f59e0b)
- 含める要素: 3カラムレイアウト、技術カテゴリ分類、技術的決定
- 文字: 日本語

開発ログ内容:
- Title: "Part 3: コンテンツ統合"
- Date: "02-14 〜 02-15"
- E2Eテスト設計書 + ブラウザ内テストランナー
- GitHub Actions CI構築
- ナビゲーションアクセシビリティ改善（WCAG 2.1 Level A）
- Bootstrap条件付きロード + 流体フィールド128x128化
- 渦シェーダー追加（FBM spiral）
- AGENT-RULES v1.1策定（マルチエージェント運用）
- devlogギャラリー実装（Bootstrap カード）
- 液体屈折エフェクト
- CLAUDE.md新設、ドキュメント階層再構成

技術的決定:
- devlog表示をThree.js 3Dカードから Bootstrap HTMLカードに変更
- セッション粒度を18件→3パートに統合
- marked.jsでmarkdownレンダリング

## 備考
- Gemini出力をCanvas 2D APIベースに修正（日本語対応）
- 3カラムレイアウト: テスト&CI / ビジュアル&UI / アーキテクチャ
- 生成ファイル: session-003-generator.html（ブラウザで開いてダウンロード）
