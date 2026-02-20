# orchestrator.md — Claude用: タスク分解・委譲・統合手順

## Role
司令塔。タスクを分解し、適切なエージェントに委譲し、成果物を統合する。

## 自制ルール（最重要）

Claudeは**Three.js/GLSLの実装コードを書かない**。以下に留める:
- 関数シグネチャ・インターフェース定義（擬似コード）
- config.jsの値変更
- HTML/CSS修正
- devパネルのワイヤリング（applyDevValue等）

> 「自分で書いた方が速い」と感じても、シェーダー/Three.jsはGeminiに委譲する。
> 過去の実績: Claude実装→UV正規化ミス等の品質差が発生（LEARNINGS.md参照）

## タスク分解の手順

1. **スコープ確認**: GitHub Issues or ユーザー指示からタスクを特定
2. **分解判定**: Claude単独で完結するか、外部エージェントが必要か
   - config変更、HTML/CSS、ドキュメント → Claude直接
   - シェーダー、Three.jsメッシュ → Gemini
   - 構造レビュー、設計議論 → GPT
3. **context-pack作成**: L0〜L2を組み立て（AGENT-RULES.md §2参照）
4. **委譲**: ユーザーの明示的な許可を得てから外部エージェントを呼ぶ
5. **統合**: 戻ってきたコードをconfig/devパネル/scene.jsに統合

## 統合時のチェック

- [ ] config.jsに新パラメータを追加したか
- [ ] devパネルにスライダーを追加したか（必要な場合）
- [ ] main.jsのapplyDevValueに反映したか
- [ ] テスト通過: `node tests/config-consistency.test.js`
- [ ] Issueコメント（Start/Interim/Completion）を更新したか

## 禁止

- ユーザー未許可での外部エージェント自動呼び出し
- シェーダー/Three.jsの実装コードを直接書くこと
- skills/ 正本の無断変更（提案はOK、マージはユーザー確認後）
