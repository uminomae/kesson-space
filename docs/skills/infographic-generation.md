# infographic-generation スキル

## 目的
devlogカバー画像（インフォグラフィック）をGemini経由で生成する

## 入力
- content/devlog/session-NNN.md の内容

## 出力
- assets/devlog/covers/session-NNN.jpg (16:9)

## プロンプトアーカイブ
- content/devlog/prompts/ に保存
- ファイル名: session-NNN-prompt.md

## 書類管理
- 重くなったら prompts/ は削除可
- 生成履歴は Git で追跡

## Gemini プロンプトテンプレート
```
以下の開発ログからインフォグラフィックを生成してください。

要件:
- アスペクト比: 16:9
- スタイル: テック系、ダークテーマ
- 含める要素: タイムライン、技術スタック、主要マイルストーン
- 文字: 日本語、読みやすいフォント

開発ログ内容:
{session-NNN.md の内容}
```

## 呼び出し
常駐PM (Claude Code) が devlog更新時に実行
