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

#### 1. Gemini APIキー取得

https://aistudio.google.com/apikey

#### 2. .env ファイル作成

```bash
cd ~/Documents/GitHub/kesson-space
cp .env.example .env
# .env を編集してAPIキーを設定
```

#### 3. 依存関係インストール

```bash
uv sync
```

#### 4. Claude Desktop設定

`~/Library/Application Support/Claude/claude_desktop_config.json`:

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
      ]
    }
  }
}
```

※ `env` ブロックは不要（.envから自動読み込み）

#### 5. Claude Desktopを再起動

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

### トラブルシューティング

**「GEMINI_API_KEY not found」**
- `.env` ファイルがプロジェクトルートにあるか確認
- APIキーが正しく設定されているか確認

**MCPサーバーが認識されない**
- Claude Desktopを完全に終了して再起動
- `--directory` パスが正しいか確認
