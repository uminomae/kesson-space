"""Gemini MCP Server for Three.js Development

Claude がマネージャー、Gemini がプログラマーとして分業するためのMCPサーバー。
シェーダーや視覚的品質が重要なThree.jsコード生成をGeminiに委託する。

Usage:
    uv run mcp_servers/gemini_threejs.py
"""

from mcp.server.fastmcp import FastMCP
import google.generativeai as genai
import os
import json
import base64
from pathlib import Path
from datetime import datetime

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
    "flash-lite": "gemini-2.0-flash-lite-001",
    # Pro系（高品質）
    "pro": "gemini-2.5-pro",
    # Gemini 3
    "3-flash": "gemini-3-flash-preview",
    "3-pro": "gemini-3-pro-preview",
    "3.1-pro": "gemini-3.1-pro-preview",
}

# モデルごとの推定コスト（円/回）
MODEL_COSTS = {
    "flash": 0.07,
    "flash-lite": 0.02,
    "pro": 0.7,
    "3-flash": 0.12,
    "3-pro": 1.5,
    "3.1-pro": 2.0,
    "image": 0.5,
}

DEFAULT_MODEL = "flash"
MONTHLY_BUDGET = 1000  # 円
REQUEST_TIMEOUT_SECONDS = int(os.getenv("GEMINI_REQUEST_TIMEOUT", "120"))

# 使用量記録ファイル
USAGE_FILE = Path(__file__).parent.parent / ".gemini_usage.json"

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


def get_model_key(model_key: str) -> str:
    """正規化されたモデルキーを取得"""
    return model_key if model_key in AVAILABLE_MODELS else DEFAULT_MODEL


def load_usage() -> dict:
    """使用量データを読み込み"""
    if USAGE_FILE.exists():
        try:
            return json.loads(USAGE_FILE.read_text())
        except:
            pass
    return {"calls": []}


def save_usage(data: dict):
    """使用量データを保存"""
    USAGE_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False))


def record_usage(model_key: str, tool_name: str):
    """API呼び出しを記録"""
    data = load_usage()
    data["calls"].append({
        "timestamp": datetime.now().isoformat(),
        "model": model_key,
        "tool": tool_name,
        "cost": MODEL_COSTS.get(model_key, 0.07)
    })
    save_usage(data)


@mcp.tool()
def get_usage() -> str:
    """
    Gemini API使用量を表示（今月の使用回数・推定コスト）
    """
    data = load_usage()
    calls = data.get("calls", [])
    
    # 今月のデータをフィルタ
    now = datetime.now()
    current_month = now.strftime("%Y-%m")
    monthly_calls = [c for c in calls if c["timestamp"].startswith(current_month)]
    
    # モデル別集計
    model_stats = {}
    total_cost = 0
    for call in monthly_calls:
        model = call.get("model", "unknown")
        cost = call.get("cost", 0.07)
        if model not in model_stats:
            model_stats[model] = {"count": 0, "cost": 0}
        model_stats[model]["count"] += 1
        model_stats[model]["cost"] += cost
        total_cost += cost
    
    # 出力生成
    lines = [
        f"📊 Gemini API 使用量 ({current_month})",
        f"{'=' * 40}",
        "",
        f"💰 月間予算: ¥{MONTHLY_BUDGET:,}",
        f"💸 使用済み: ¥{total_cost:,.1f} ({total_cost/MONTHLY_BUDGET*100:.1f}%)",
        f"📈 残り: ¥{MONTHLY_BUDGET - total_cost:,.1f}",
        "",
        f"📞 総呼び出し回数: {len(monthly_calls)}回",
        "",
        "モデル別:",
    ]
    
    for model, stats in sorted(model_stats.items()):
        lines.append(f"  {model}: {stats['count']}回 (¥{stats['cost']:.1f})")
    
    if not model_stats:
        lines.append("  （今月の使用なし）")
    
    lines.extend([
        "",
        "コスト目安:",
        f"  flash: ¥{MODEL_COSTS['flash']}/回",
        f"  flash-lite: ¥{MODEL_COSTS['flash-lite']}/回",
        f"  pro: ¥{MODEL_COSTS['pro']}/回",
        f"  3-flash: ¥{MODEL_COSTS['3-flash']}/回",
    ])
    
    return "\n".join(lines)


@mcp.tool()
def reset_usage() -> str:
    """
    使用量データをリセット（新しい月の開始時など）
    """
    save_usage({"calls": []})
    return "✅ 使用量データをリセットしました"


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
    model_key = get_model_key(model)
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
        response = gemini.generate_content(
            prompt,
            request_options={"timeout": REQUEST_TIMEOUT_SECONDS},
        )
        
        # 使用量を記録
        record_usage(model_key, "generate_threejs_code")
        
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
    model_key = get_model_key(model)
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
        response = gemini.generate_content(
            prompt,
            request_options={"timeout": REQUEST_TIMEOUT_SECONDS},
        )
        
        # 使用量を記録
        record_usage(model_key, "generate_shader")
        
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
    model_key = get_model_key(model)
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
        response = gemini.generate_content(
            prompt,
            request_options={"timeout": REQUEST_TIMEOUT_SECONDS},
        )
        
        # 使用量を記録
        record_usage(model_key, "review_threejs_code")
        
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
    model_key = get_model_key(model)
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
        response = gemini.generate_content(
            prompt,
            request_options={"timeout": REQUEST_TIMEOUT_SECONDS},
        )
        
        # 使用量を記録
        record_usage(model_key, "compare_implementations")
        
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
        cost = MODEL_COSTS.get(key, 0.07)
        default = " (default)" if key == DEFAULT_MODEL else ""
        lines.append(f"  {key}: {model} — ¥{cost}/回{default}")
    
    lines.extend([
        "",
        f"画像生成:",
        f"  image: {IMAGE_MODEL} — ¥{IMAGE_COST_PER_CALL}/回",
        "",
        "使用例:",
        '  generate_threejs_code(task="...", model="pro")',
        '  generate_shader(shader_description="...", model="3-flash")',
        '  generate_image(prompt="a cosmic space with floating lights")',
        "",
        "使用量確認:",
        "  get_usage() — 今月の使用状況を表示",
    ])
    
    return "\n".join(lines)


# 画像出力ディレクトリ
IMAGE_OUTPUT_DIR = Path(__file__).parent.parent / "generated_images"

# 画像生成モデル
IMAGE_MODEL = "gemini-2.0-flash-exp-image-generation"
IMAGE_COST_PER_CALL = 0.5  # 円/回（推定）


@mcp.tool()
def generate_image(
    prompt: str,
    output_filename: str = "",
    style_hint: str = "",
) -> str:
    """
    Geminiで画像を生成してファイルに保存

    Args:
        prompt: 画像の説明（英語推奨、日本語も可）
        output_filename: 出力ファイル名（拡張子なし）。省略時は自動生成
        style_hint: スタイルのヒント（例: "photorealistic", "watercolor", "abstract", "3d render"）
    """
    IMAGE_OUTPUT_DIR.mkdir(exist_ok=True)

    if not output_filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"gemini_{timestamp}"

    full_prompt = prompt
    if style_hint:
        full_prompt = f"{prompt}. Style: {style_hint}"

    try:
        from google import genai as genai_new
        from google.genai import types

        client = genai_new.Client(api_key=GENAI_API_KEY)
        response = client.models.generate_content(
            model=IMAGE_MODEL,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )

        # レスポンスから画像パートを探す
        saved_paths = []
        text_parts = []

        for i, part in enumerate(response.candidates[0].content.parts):
            if part.inline_data and part.inline_data.data:
                mime = part.inline_data.mime_type
                ext = "png" if "png" in mime else "jpg" if "jpeg" in mime or "jpg" in mime else "webp"
                suffix = f"_{i}" if i > 0 else ""
                filepath = IMAGE_OUTPUT_DIR / f"{output_filename}{suffix}.{ext}"
                filepath.write_bytes(part.inline_data.data)
                saved_paths.append(str(filepath))
            elif part.text:
                text_parts.append(part.text)

        record_usage("image", "generate_image")

        if not saved_paths:
            return f"画像生成に失敗しました。テキスト応答:\n{''.join(text_parts)}"

        result_lines = [
            f"[Model: {IMAGE_MODEL}]",
            "",
            f"画像を保存しました:",
        ]
        for p in saved_paths:
            result_lines.append(f"  {p}")
        if text_parts:
            result_lines.append("")
            result_lines.append("Geminiのコメント:")
            result_lines.extend(text_parts)

        return "\n".join(result_lines)

    except Exception as e:
        return f"画像生成エラー: {type(e).__name__}: {str(e)}"


if __name__ == "__main__":
    mcp.run()
