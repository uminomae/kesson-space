# Issue #38: liquid.js 圧力ソルブ ping-pong化

## 目的
Poisson圧力ソルブの framebuffer-texture feedback loop を排除する。

## 背景
`src/shaders/liquid.js` L244-249 で `tPressure` に `pressure.texture` をバインドしつつ、
同じ `pressure` をレンダーターゲットとして書き込んでいる。
WebGL仕様上、同一テクスチャへの同時読み書きは未定義動作。

## 対象ファイル
- `src/shaders/liquid.js`

## 要件
1. pressure用に2つのWebGLRenderTarget（pressureRead / pressureWrite）を作成
2. Poissonイテレーションループで毎反復ごとにswap:
   ```js
   for (let i = 0; i < iterations; i++) {
       pressureMat.uniforms.tPressure.value = pressureRead.texture;
       renderer.setRenderTarget(pressureWrite);
       // render quad...
       [pressureRead, pressureWrite] = [pressureWrite, pressureRead];
   }
   ```
3. 最終的な pressureRead.texture を gradient subtraction パスで使用
4. 既存の createLiquidSystem が返すオブジェクト構造を壊さない
5. RenderTarget のサイズ・フィルタ設定は既存 pressure と同一にする

## 検証方法
- ブラウザでレンダリング崩れがないこと（目視）
- コンソールにGL errorが出ないこと
- 流体の挙動が修正前と同等以上であること

## ブランチ
`feature/kesson-codex-app-liquid38`

## コミットメッセージ規約
Conventional Commits: `fix: use ping-pong buffers for pressure solve in liquid.js (#38)`

## 注意
- シェーダーGLSLコード自体の変更は不要（JSのレンダーパイプラインのみ）
- uniforms構造が外部から参照されている場合は互換性を維持すること
