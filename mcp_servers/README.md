# MCP Servers for kesson-space

## gemini_threejs.py

Claude × Gemini 連携用MCPサーバー。

### 役割分担

| 役割 | 担当 | 強み |
|------|------|------|
| マネージャー | Claude | コンテキスト把握、複数ファイル管理、対話 |
| プログラマー | Gemini | シェーダー、視覚的品質の高いThree.jsコード |

### 提供ツール

- `generate_threejs_code` — Three.jsコード生成
- `generate_shader` — GLSLシェーダー生成
- `review_threejs_code` — コードレビュー
- `compare_implementations` — Claude vs Gemini 比較

### セットアップ

1. Gemini APIキーを取得（Google AI Studio）
2. Claude Desktop設定を更新

```json
{
  "mcpServers": {
    "gemini-threejs": {
      "command": "uv",
      "args": [
        "--directory",
        "/Users/uminomae/Documents/GitHub/kesson-space",
        "run",
        "mcp_servers/gemini_threejs.py"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### 使用例

```
ユーザー: 「水面のシェーダーを改良して。Geminiに頼んで」

Claude: [generate_shader を呼び出し]
        ↓
        Geminiのコードを取得、説明を添えて提示
```

### コスト目安

- Gemini 2.0 Flash: 約0.07円/回
- Gemini 3 Pro: 約5.7円/回

現在は Flash を使用（十分な品質でコスト効率が良い）。
