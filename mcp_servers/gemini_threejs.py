"""Gemini MCP Server for Three.js Development

Claude がマネージャー、Gemini がプログラマーとして分業するためのMCPサーバー。
シェーダーや視覚的品質が重要なThree.jsコード生成をGemini 3 Proに委託する。

Usage:
    uv run mcp_servers/gemini_threejs.py
"""

from mcp.server.fastmcp import FastMCP
import google.generativeai as genai
import os

# APIキー設定
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GENAI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=GENAI_API_KEY)
mcp = FastMCP("Gemini-ThreeJS-Assistant")

# kesson-space用のコンテキスト
KESSON_CONTEXT = """
あなたはkesson-spaceプロジェクトのThree.jsエキスパートです。

プロジェクトの特徴:
- 「欠損駆動思考」を視覚化する3D空間
- 闇の中に浮かぶ光（欠損）を表現
- 水面、呼吸する空間、フラクタル輪郭
- シェーダーによる視覚的品質が最重要

技術スタック:
- Three.js 0.160.0（ES Modules、CDN）
- GLSL シェーダー（simplex noise使用）
- ビルドツールなし（GitHub Pages直接デプロイ）

コードスタイル:
- モジュール分割（scene.js, controls.js, navigation.js）
- uniformでパラメータ制御
- uMixによる状態遷移パターン
"""


@mcp.tool()
def generate_threejs_code(
    task_description: str,
    optimization_level: str = "standard",
    include_kesson_context: bool = True
) -> str:
    """
    Gemini 3 ProでThree.jsコードを生成
    
    Args:
        task_description: 実装したいThree.jsの機能説明
        optimization_level: "standard" or "advanced"
        include_kesson_context: kesson-spaceのコンテキストを含めるか
    """
    context = KESSON_CONTEXT if include_kesson_context else ""
    
    prompt = f"""
{context}

以下の要件に基づいて、高品質なThree.jsコードを生成してください。

要件: {task_description}
最適化レベル: {optimization_level}

コードには以下を含めてください:
- 適切なコメント（日本語可）
- パフォーマンス最適化
- シェーダーを使う場合はGLSLを埋め込み
- ES Modules形式（import/export）
"""
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        
        if not response.text:
            return "Geminiから有効な回答が得られませんでした。"
        
        return response.text
        
    except Exception as e:
        return f"Gemini APIエラー: {type(e).__name__}: {str(e)}"


@mcp.tool()
def generate_shader(
    shader_description: str,
    shader_type: str = "fragment"
) -> str:
    """
    GLSLシェーダーコードを生成
    
    Args:
        shader_description: シェーダーで実現したい視覚効果
        shader_type: "vertex", "fragment", or "both"
    """
    prompt = f"""
{KESSON_CONTEXT}

以下の視覚効果を実現するGLSLシェーダーを生成してください。

効果: {shader_description}
シェーダータイプ: {shader_type}

要件:
- simplex noiseを使用可（関数は別途提供されている前提）
- Three.jsのShaderMaterial用
- uniformsの定義も含める
- 美しさと滑らかさを最優先
"""
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text if response.text else "シェーダー生成に失敗しました。"
    except Exception as e:
        return f"エラー: {str(e)}"


@mcp.tool()
def review_threejs_code(
    code: str,
    focus_areas: str = "visual quality, performance, shader optimization"
) -> str:
    """
    Three.jsコードをGeminiでレビュー
    
    Args:
        code: レビューするコード
        focus_areas: レビューの焦点
    """
    prompt = f"""
{KESSON_CONTEXT}

以下のThree.jsコードをレビューしてください。

レビュー観点: {focus_areas}

コード:
```javascript
{code}
```

以下の点を分析してください:
1. 視覚的品質の改善点
2. シェーダーの最適化
3. パフォーマンスの問題
4. kesson-spaceのコンセプトとの整合性
"""
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text if response.text else "レビュー結果を取得できませんでした。"
    except Exception as e:
        return f"エラー: {str(e)}"


@mcp.tool()
def compare_implementations(
    task: str,
    claude_code: str
) -> str:
    """
    ClaudeのコードとGeminiの実装を比較
    
    Args:
        task: 実装タスクの説明
        claude_code: Claudeが生成したコード
    """
    prompt = f"""
{KESSON_CONTEXT}

以下のタスクに対して、別のAI（Claude）が生成したコードがあります。
あなた（Gemini）も同じタスクを実装し、両者を比較してください。

タスク: {task}

Claudeのコード:
```javascript
{claude_code}
```

以下を提供してください:
1. あなたの実装案（視覚的品質を最優先）
2. 両者の比較（特にシェーダー品質）
3. 推奨：どちらをベースにすべきか
"""
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text if response.text else "比較結果を取得できませんでした。"
    except Exception as e:
        return f"エラー: {str(e)}"


if __name__ == "__main__":
    mcp.run()
