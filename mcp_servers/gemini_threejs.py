"""Gemini MCP Server for Three.js Development

Claude がマネージャー、Gemini がプログラマーとして分業するためのMCPサーバー。
シェーダーや視覚的品質が重要なThree.jsコード生成をGeminiに委託する。

Usage:
    uv run mcp_servers/gemini_threejs.py
"""

from mcp.server.fastmcp import FastMCP
import google.generativeai as genai
import os
from pathlib import Path

# .envから読み込み（python-dotenvがあれば使用）
try:
    from dotenv import load_dotenv
    # プロジェクトルートの.envを探す
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass  # dotenvがなくても環境変数から読める

# APIキー設定
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GENAI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found. "
        "Set it in .env file or as environment variable."
    )

genai.configure(api_key=GENAI_API_KEY)
mcp = FastMCP("Gemini-ThreeJS-Assistant")

# 利用可能なモデル
# https://ai.google.dev/gemini-api/docs/models
AVAILABLE_MODELS = {
    # Flash系（高速・低コスト）
    "flash": "gemini-2.0-flash",
    "flash-lite": "gemini-2.0-flash-lite",
    # Pro系（高品質）
    "pro": "gemini-2.5-pro-preview-05-06",
    # Gemini 3
    "3-flash": "gemini-3.0-flash",
}

DEFAULT_MODEL = "flash"

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


def get_model(model_key: str) -> str:
    """モデルキーから実際のモデル名を取得"""
    return AVAILABLE_MODELS.get(model_key, AVAILABLE_MODELS[DEFAULT_MODEL])


@mcp.tool()
def generate_threejs_code(
    task_description: str,
    model: str = "flash",
    optimization_level: str = "standard",
    include_kesson_context: bool = True
) -> str:
    """
    GeminiでThree.jsコードを生成
    
    Args:
        task_description: 実装したいThree.jsの機能説明
        model: 使用モデル ("flash", "flash-lite", "pro", "3-flash")
        optimization_level: "standard" or "advanced"
        include_kesson_context: kesson-spaceのコンテキストを含めるか
    """
    context = KESSON_CONTEXT if include_kesson_context else ""
    model_name = get_model(model)
    
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
        gemini = genai.GenerativeModel(model_name)
        response = gemini.generate_content(prompt)
        
        if not response.text:
            return "Geminiから有効な回答が得られませんでした。"
        
        return f"[Model: {model_name}]\n\n{response.text}"
        
    except Exception as e:
        return f"Gemini APIエラー: {type(e).__name__}: {str(e)}"


@mcp.tool()
def generate_shader(
    shader_description: str,
    model: str = "flash",
    shader_type: str = "fragment"
) -> str:
    """
    GLSLシェーダーコードを生成
    
    Args:
        shader_description: シェーダーで実現したい視覚効果
        model: 使用モデル ("flash", "flash-lite", "pro", "3-flash")
        shader_type: "vertex", "fragment", or "both"
    """
    model_name = get_model(model)
    
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
        gemini = genai.GenerativeModel(model_name)
        response = gemini.generate_content(prompt)
        return f"[Model: {model_name}]\n\n{response.text}" if response.text else "シェーダー生成に失敗しました。"
    except Exception as e:
        return f"エラー: {str(e)}"


@mcp.tool()
def review_threejs_code(
    code: str,
    model: str = "flash",
    focus_areas: str = "visual quality, performance, shader optimization"
) -> str:
    """
    Three.jsコードをGeminiでレビュー
    
    Args:
        code: レビューするコード
        model: 使用モデル ("flash", "flash-lite", "pro", "3-flash")
        focus_areas: レビューの焦点
    """
    model_name = get_model(model)
    
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
        gemini = genai.GenerativeModel(model_name)
        response = gemini.generate_content(prompt)
        return f"[Model: {model_name}]\n\n{response.text}" if response.text else "レビュー結果を取得できませんでした。"
    except Exception as e:
        return f"エラー: {str(e)}"


@mcp.tool()
def compare_implementations(
    task: str,
    claude_code: str,
    model: str = "pro"
) -> str:
    """
    Claudeのコードとの比較（デフォルトはPro）
    
    Args:
        task: 実装タスクの説明
        claude_code: Claudeが生成したコード
        model: 使用モデル ("flash", "flash-lite", "pro", "3-flash")
    """
    model_name = get_model(model)
    
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
        gemini = genai.GenerativeModel(model_name)
        response = gemini.generate_content(prompt)
        return f"[Model: {model_name}]\n\n{response.text}" if response.text else "比較結果を取得できませんでした。"
    except Exception as e:
        return f"エラー: {str(e)}"


@mcp.tool()
def list_models() -> str:
    """
    利用可能なGeminiモデル一覧を表示
    """
    lines = ["利用可能なモデル:", ""]
    for key, model in AVAILABLE_MODELS.items():
        default = " (default)" if key == DEFAULT_MODEL else ""
        lines.append(f"  {key}: {model}{default}")
    
    lines.extend([
        "",
        "使用例:",
        '  generate_threejs_code(task="...", model="pro")',
        '  generate_shader(shader_description="...", model="3-flash")',
    ])
    
    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run()
