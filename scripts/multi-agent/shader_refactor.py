"""kesson-space shader refactor — multi-agent orchestration

Codex MCP Server + OpenAI Agents SDK で
Architect / Developer / Reviewer の3エージェントが協調して
シェーダーファイルをリファクタする。

初回テスト対象: noise.glsl.js + water.js

Usage:
    python shader_refactor.py
"""

import asyncio
import os

from dotenv import load_dotenv

from agents import Agent, Runner, set_default_openai_api
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX
from agents.mcp import MCPServerStdio

load_dotenv(override=True)
set_default_openai_api(os.getenv("OPENAI_API_KEY"))

# ---------- target files for this run ----------
TARGET_FILES = [
    "src/shaders/noise.glsl.js",
    "src/shaders/water.js",
]

TARGET_DESCRIPTION = """
## リファクタ対象

### src/shaders/noise.glsl.js (1,284 bytes)
- 共有 simplex noise GLSL関数
- snoise(vec2) を export
- water.js, liquid-shaders.glsl.js から使用される

### src/shaders/water.js (3,851 bytes)
- 水面シェーダー (ShaderMaterial)
- noise.glsl.js の noiseGLSL をテンプレートリテラルで頂点シェーダーに埋め込み
- fbm (fractal brownian motion) を頂点シェーダー内でインライン定義
- createWaterMaterial() と createWaterMesh() を export

### 依存関係
noise.glsl.js → water.js (import { noiseGLSL })
water.js → THREE, noise.glsl.js

### 既知の課題
- fbm関数がwater.jsの頂点シェーダー内にインライン定義されており再利用不可
- noiseGLSL がテンプレートリテラル埋め込みで型安全性なし
- マジックナンバー（0.02, 0.04, 0.03, 2.0 等）が散在
"""

REFACTOR_GUIDELINES = """
## リファクタガイドライン

### 守ること
1. リファクタ後もレンダリング結果が視覚的に同一であること（振る舞い保存）
2. 既存の export インターフェース (createWaterMaterial, createWaterMesh, noiseGLSL) を維持
3. kesson-space は バニラJS + Three.js (ES modules, importmap) 構成。ビルドツールなし
4. main ブランチへの直接 push 禁止。作業は feature/multi-agent-orchestration ブランチ

### やってよいこと
- マジックナンバーを名前付き定数または uniform に抽出
- fbm関数を noise.glsl.js に移動して共有化
- GLSL文字列の構造改善（liquid-shaders.glsl.js パターンに倣う）
- JSDoc / コメントの追加

### やってはいけないこと
- 新しい npm パッケージの追加
- Three.js のバージョン変更
- 他のシェーダーファイルの変更（今回のスコープ外）
- WebGL2 専用機能の使用（WebGL1互換を維持）
"""


async def main() -> None:
    # Codex CLIをMCPサーバーとして起動
    # cwdをリポジトリルートに設定
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    async with MCPServerStdio(
        name="Codex CLI",
        params={
            "command": "npx",
            "args": ["-y", "codex", "mcp-server"],
        },
        client_session_timeout_seconds=360000,
    ) as codex_mcp_server:

        # ---- Agent definitions ----

        architect_agent = Agent(
            name="Shader Architect",
            instructions=(
                f"{RECOMMENDED_PROMPT_PREFIX}"
                "You are the Shader Architect for kesson-space, a Three.js + vanilla JS 3D experience.\n\n"
                f"{TARGET_DESCRIPTION}\n\n"
                f"{REFACTOR_GUIDELINES}\n\n"
                "Your job:\n"
                "1. Read the target shader files using Codex\n"
                "2. Analyze the dependency structure and identify refactoring opportunities\n"
                "3. Write REFACTOR_PLAN.md in the repo root with:\n"
                "   - Current structure analysis\n"
                "   - Proposed changes (specific, actionable)\n"
                "   - Risk assessment\n"
                "   - Verification steps\n"
                "4. Hand off to the Developer with transfer_to_shader_developer\n\n"
                "CRITICAL: Do NOT modify any source files. Only create REFACTOR_PLAN.md.\n"
                f"Working directory: {repo_root}\n"
                'When calling Codex, use {{"approval-policy":"never","sandbox":"workspace-write","cwd":"{repo_root}"}}'
            ),
            model="gpt-5",
            mcp_servers=[codex_mcp_server],
        )

        developer_agent = Agent(
            name="Shader Developer",
            instructions=(
                f"{RECOMMENDED_PROMPT_PREFIX}"
                "You are the Shader Developer for kesson-space.\n\n"
                f"{REFACTOR_GUIDELINES}\n\n"
                "Your job:\n"
                "1. Read REFACTOR_PLAN.md created by the Architect\n"
                "2. Implement the refactoring changes to the target files:\n"
                f"   {', '.join(TARGET_FILES)}\n"
                "3. Ensure all existing exports remain compatible\n"
                "4. Add clear comments explaining changes\n"
                "5. Hand off to the Reviewer with transfer_to_shader_reviewer\n\n"
                "CRITICAL: Only modify the target files listed above. Do not touch other files.\n"
                f"Working directory: {repo_root}\n"
                f'When calling Codex, use {{"approval-policy":"never","sandbox":"workspace-write","cwd":"{repo_root}"}}'
            ),
            model="gpt-5",
            mcp_servers=[codex_mcp_server],
        )

        reviewer_agent = Agent(
            name="Shader Reviewer",
            instructions=(
                f"{RECOMMENDED_PROMPT_PREFIX}"
                "You are the Shader Reviewer for kesson-space.\n\n"
                f"{TARGET_DESCRIPTION}\n\n"
                f"{REFACTOR_GUIDELINES}\n\n"
                "Your job:\n"
                "1. Read the modified files and REFACTOR_PLAN.md\n"
                "2. Verify:\n"
                "   - All existing exports (createWaterMaterial, createWaterMesh, noiseGLSL) are preserved\n"
                "   - Import paths are correct\n"
                "   - No syntax errors in GLSL strings\n"
                "   - No new dependencies added\n"
                "   - Magic numbers have been properly extracted\n"
                "   - Behavior should be visually identical\n"
                "3. Write REVIEW_RESULT.md with:\n"
                "   - Pass/Fail verdict\n"
                "   - Issues found (if any)\n"
                "   - Suggestions for improvement\n"
                "4. If FAIL: hand off back to Developer with transfer_to_shader_developer and specific fix instructions\n"
                "5. If PASS: report completion. The refactoring is done.\n\n"
                f"Working directory: {repo_root}\n"
                f'When calling Codex, use {{"approval-policy":"never","sandbox":"workspace-write","cwd":"{repo_root}"}}'
            ),
            model="gpt-5",
            mcp_servers=[codex_mcp_server],
        )

        # ---- Hand-off wiring ----
        architect_agent.handoffs = [developer_agent]
        developer_agent.handoffs = [reviewer_agent]
        reviewer_agent.handoffs = [developer_agent]  # fail時にdeveloperに戻せる

        # ---- Run ----
        print(f"🚀 Starting multi-agent shader refactor")
        print(f"   Target: {', '.join(TARGET_FILES)}")
        print(f"   Repo:   {repo_root}")
        print(f"   Branch: feature/multi-agent-orchestration")
        print()

        task = (
            "kesson-spaceのシェーダーリファクタを実行してください。\n"
            f"対象ファイル: {', '.join(TARGET_FILES)}\n"
            "まずArchitectがファイルを分析してリファクタ計画を立て、"
            "DeveloperがGLSL/JSを書き換え、"
            "Reviewerが検証します。"
        )

        result = await Runner.run(architect_agent, task, max_turns=25)
        print()
        print("=" * 60)
        print("✅ Refactoring complete")
        print("=" * 60)
        print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
