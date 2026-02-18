# Multi-Agent Orchestration for kesson-space

Codex MCP Server + OpenAI Agents SDK を使ったマルチエージェント協調スクリプト。

## セットアップ

### 前提
- Node.js 18+
- Python 3.10+
- OpenAI API キー（GPT-5.3-Codex対応プラン）
- Codex CLI (`npm install -g @anthropic-ai/codex` or `npx codex`)

### インストール

```bash
cd scripts/multi-agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# .env にAPIキーを設定
```

## 使い方

### シェーダーリファクタ（小規模テスト）

```bash
python shader_refactor.py
```

noise.glsl.js + water.js を対象に、3エージェント（Architect / Developer / Reviewer）が協調してリファクタを実行。

### エージェント構成

| 役割 | やること |
|------|---------|
| Architect | シェーダー依存分析、リファクタ方針策定、REFACTOR_PLAN.md作成 |
| Developer | GLSL/JSの書き換え実装 |
| Reviewer | コードレビュー、import整合性チェック、既存機能の破壊がないか検証 |

### トレース確認

実行後、[OpenAI Traces](https://platform.openai.com/trace) で全hand-off・ツールコール・プロンプトを確認可能。

## セキュリティ

- `.env` は `.gitignore` 済み
- APIキーはローカルのみ保持
- Codexのsandboxは `workspace-write` に制限

## 今後の拡張

- 全11シェーダーファイル対象のフルリファクタ
- パーティクルシステム新規追加
- ポストプロセッシングパイプライン拡張
- Visual QAエージェント追加（スクリーンショット比較）
