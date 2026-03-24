<!-- Ported from: creation-space (2026-03-24) -->
# 破壊的変更チェックリスト

## 破壊的変更の定義

以下のいずれかに該当する変更:

- `src/config.js` (config/params.js) のパラメータ名変更・削除
- シェーダー uniform 名の変更
- Three.js マテリアル/メッシュのプロパティ変更
- HTML の id/class 名変更（CSS・JSから参照されるもの）
- `assets/` 内の JSON スキーマ変更
- importmap のモジュール名変更

## チェックリスト

1. **下流消費者の列挙**: `grep -r "{変更対象}" src/ tests/ index.html` で参照箇所を全て特定
2. **影響範囲の評価**: 各参照箇所への影響を判定
3. **同時修正**: 全ての参照箇所を同一コミットで修正（分割禁止）
4. **テスト**: `node tests/config-consistency.test.js` + E2E smoke

## config.js 変更時の追加チェック

config.js は Single Source of Truth。変更時は以下も確認:

- `src/config/dev-ui.js` のデフォルト値
- `src/config/dev-registry.js` のトグル/スライダー定義
- シェーダー内で参照している uniform 名
- `tests/config-consistency.test.js` のアサーション

## Agent 委譲時の注意

破壊的変更を含むタスクを Agent に委譲する場合、プロンプトに以下を含めること:

```
## 下流消費者（必ず同時修正）
- file1.js: {field} を参照 (L42)
- file2.glsl: uniform {name} を使用
```
