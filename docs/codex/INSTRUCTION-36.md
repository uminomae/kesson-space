# Issue #36: config re-export チェーン実行時検証テスト追加

## 目的
config分割の re-export 破損を即検知するランタイムテストを追加する。

## 背景
`config-consistency.test.js` は正規表現でexport名を検証しているが、
`config.js` → `config/index.js` → `config/params.js` 等のre-exportチェーンを
実行時に検証していない。re-exportが壊れても文字列が残っていればテストが通る。

## 対象ファイル
- 新規: `tests/config-exports.test.js`
- 参考: `tests/config-consistency.test.js`, `src/config.js`, `src/config/index.js`, `src/config/params.js`

## 要件
1. Node.jsで `src/config.js` を実行時importし、named exportsの存在を確認する
2. 検証対象のexport名:
   - toggles, breathConfig, sceneParams, fluidParams
   - liquidParams, distortionParams, gemParams, xLogoParams
   - vortexParams, DEV_TOGGLES, DEV_SECTIONS, DEV_PARAM_REGISTRY
   - FOG_V002_COLOR, FOG_V002_DENSITY, FOG_V004_COLOR, FOG_V004_DENSITY
3. 各exportが `undefined` でないことも検証する
4. 既存の `config-consistency.test.js` のテスト形式に合わせる

## ブランチ
`feature/kesson-codex-app-test36`

## コミットメッセージ規約
Conventional Commits: `test: add runtime import verification for config re-export chain (#36)`

## 完了条件
- `node --experimental-vm-modules` または適切な方法でテストが通る
- 既存テストが壊れない
