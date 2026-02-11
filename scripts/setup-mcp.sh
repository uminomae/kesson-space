#!/bin/bash
# Claude Desktop に gemini-threejs MCP を追加するスクリプト

set -e

CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
PROJECT_DIR="/Users/uminomae/Documents/GitHub/kesson-space"

# jq がなければインストール
if ! command -v jq &> /dev/null; then
    echo "jq をインストールしています..."
    brew install jq
fi

# 設定ファイルがなければ作成
if [ ! -f "$CONFIG_FILE" ]; then
    echo '{"mcpServers":{}}' > "$CONFIG_FILE"
    echo "設定ファイルを作成しました"
fi

# バックアップ
cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
echo "バックアップ作成: $CONFIG_FILE.backup"

# gemini-threejs を追加
jq --arg dir "$PROJECT_DIR" '.mcpServers["gemini-threejs"] = {
    "command": "uv",
    "args": [
        "--directory",
        $dir,
        "run",
        "mcp_servers/gemini_threejs.py"
    ]
}' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"

echo "✅ gemini-threejs MCP を追加しました"
echo ""
echo "次のステップ:"
echo "1. cd $PROJECT_DIR"
echo "2. cp .env.example .env"
echo "3. .env を編集して GEMINI_API_KEY を設定"
echo "4. uv sync"
echo "5. Claude Desktop を再起動"
