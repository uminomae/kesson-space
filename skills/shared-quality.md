# shared-quality.md — 全エージェント共通の品質基準

## パフォーマンス
- 60fps on mid-range laptop
- 毎フレームの `new` 禁止（GC圧力）
- オブジェクトはモジュールスコープに事前確保

## コード規約
- ES Modules only（no npm, no build tools）
- `import * as THREE from 'three';`
- magic number → named constant（config.js に定義）
- 変更箇所に `// CHANGED(YYYY-MM-DD)` コメント（1ヶ月経過で除去可）

## 禁止事項
- 指定外ファイルの変更
- 依存ライブラリの追加（明示許可がない限り）
- 大域リファクタリング（タスクスコープ外）
- HTMLの変更（JSコードのみ出力。HTML変更が必要な場合は別途明記）
  - **例外**: アクセシビリティ改善（aria属性、セマンティックHTML化）がACCEPTANCEに含まれる場合はHTML変更を許可

## 設計原則
- config.js = Single Source of Truth（全パラメータ）
- scene.js = 薄いオーケストレーション
- 各ファイルは1つの責務

## テスト
- 静的: `node tests/config-consistency.test.js` 通過
- E2E: `?test` で主要テスト通過
- シェーダー変更時: before/after スクリーンショット推奨
- **テストが存在しない場合の代替**: `python3 -m http.server 3001` でローカル確認 → 手動チェック3項目（FPS安定/描画破綻なし/主要操作動作）

## 美学（kesson-space固有）
- 忍的美学: 露骨にしない、秘すれば花
- やりすぎない（過剰なエフェクト、派手すぎる色は避ける）
- CONCEPT.md との整合性を保つ
