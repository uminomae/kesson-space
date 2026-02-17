# Issue #34: トグル OFF→ON 時の uniform 復帰

## 目的
fluidField / heatHaze / dof トグルを OFF→ON にしたとき、uniform が config既定値に復帰する状態にする。

## 背景
`render-loop.js` でトグルOFF時にuniformを0固定しているが、ONに戻したときに既定値へ復帰するコードがない。
`dev-apply.js` の toggle case は `toggles[key] = value`（bool切替のみ）で、uniform値は0のまま残る。

## 対象ファイル
- `src/main/render-loop.js`（主な修正箇所）
- `src/main/dev-apply.js`（参考・必要なら修正）

## 要件
1. render-loop.js のON分岐冒頭で、config既定値を毎フレーム再代入する:
   ```js
   // fluidField ON時
   if (toggles.fluidField) {
       distortionPass.uniforms.uFluidInfluence.value = fluidParams.influence;
       // 他の関連uniform...
   }
   // heatHaze, dof も同様パターン
   ```
2. 責務は render-loop.js 側に統一する（dev-apply側に持たせない）
3. 以下のトグルすべてで復帰を保証:
   - `fluidField`: uFluidInfluence 等
   - `heatHaze`: uHeatHazeAmount 等
   - `dof`: uDofAmount 等
4. パラメータ名は既存コードの OFF 時 0 固定箇所と対になるように設定
5. 毎フレームの再代入はconfig参照のみなのでパフォーマンス影響なし

## 検証方法
- dev panelでトグルを OFF → ON → 視覚効果が正しく復帰すること
- スライダー操作なしでもON復帰で効果が見えること

## ブランチ
`feature/kesson-codex-app-toggle34`

## コミットメッセージ規約
Conventional Commits: `fix: restore uniforms from config on toggle re-enable (#34)`

## 注意
- config からのimportが不足している場合は追加する
- OFF時の0固定ロジックは変更しない（ON分岐に復帰コードを追加するだけ）
