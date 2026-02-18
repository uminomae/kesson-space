# 指示書: #74 v3 量子場シェーダー書き直し — 1D波束ライン描画

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/74

## 作業ブランチ
- ブランチ: `feature/kesson-codex-app-qwave74`（既存を上書き）
- ワークツリー: `~/dev/kesson-codex-app`

## 背景・問題
v2 実装（現在のコード）は12方向からの平面波を重ね合わせて `|ψ|²` 確率密度を面塗りしている。
結果は **等方的なスペックルパターン（ノイズ的ちらつき）** になり、目標ビジュアルと全く異なる。

### 目標ビジュアル（必ず理解してから実装すること）
- **水平軸に沿った1D波束** が左側で振幅の大きい波として揺らめく
- **中央付近で遷移**（波の振幅が減衰し、形が変わる）
- **右側で粒子的に収束** — 発光する丸い点に集約
- 全体が **光るライン/曲線** として描画される（面塗りではない）
- 水中の波のような前後のゆらめき感
- 色はシアン〜白のグロー

### 技術方針
```
現在（v2 — 廃止する方針）:
  12方向の2D平面波 → |ψ|² 面塗り → スペックルノイズ

v3（新実装）:
  水平方向の1D波束 → ライン描画（SDFまたはstroke）→ 波動→収束の遷移
```

## 対象ファイル（2ファイルのみ書き換え）

### 1. `src/shaders/quantum-field.glsl.js` — 全面書き直し

#### フラグメントシェーダーの設計要件

**波形生成:**
- 複数の正弦波を **水平方向(x軸)に沿って** 重ね合わせる
- 各波は `y = A(x) * sin(k*x - ω*t + φ)` の形
- エンベロープ `A(x)`: 左側（x < transitionCenter）で大きく、右側で減衰
- 波数 k と位相 φ は波ごとに異なる（コヒーレントな波束を形成）

**ライン描画:**
- 重ね合わせた波形の曲線からの距離を SDF 的に計算
- `float dist = abs(pos.y - waveY)` → `smoothstep` でライン化
- ラインの太さは左側で太く（波動的）、右側で細く（粒子的）

**遷移（波動→粒子）:**
- x座標に応じて波の振幅が減衰: 左で揺らぎ大 → 右で収束
- 右端では波形が消え、代わりに発光する円（粒子）を配置
- 遷移は `smoothstep` でなめらかに

**揺らぎ:**
- 時間変化で波が前後にゆらめく（水中の波のイメージ）
- fbm ノイズで微妙な歪みを加える（有機的な動き）

**発光:**
- ラインには glow エフェクト: `1.0 / (dist * glowFactor + epsilon)`
- 粒子部分にも radial glow

#### uniform は現在の定義をそのまま使う
params.js の `quantumFieldParams` のフィールドは変更しない。
既存 uniform の意味を以下のように再解釈する:
- `uWaveCount` → 重ね合わせるライン数
- `uBaseFreq` → 波の基本波数
- `uDispersion` → 波束の拡散度合い
- `uNoiseAmp` / `uNoiseScale` → fbm揺らぎの強さ・スケール
- `uEnvelopeWidth` → 波束の幅
- `uTransitionCenter` / `uTransitionWidth` → 波動→粒子の遷移位置・幅
- `uColorR/G/B` → ベースライン色
- `uGlowR/G/B` → グロー色
- `uSpeed`, `uIntensity`, `uOpacity` → そのまま

#### vertexShader は変更不要（そのまま）

### 2. `src/shaders/quantum-field.js` — 変更不要
uniform 定義は既存のまま使えるため、このファイルは触らない。

### 3. `src/config/params.js` — 変更不要
パラメータ構造はそのまま。

### 4. `src/scene.js` — 変更不要

## 完了条件
1. `src/shaders/quantum-field.glsl.js` のフラグメントシェーダーが全面書き直しされている
2. snoise / fbm は引き続き内包（外部 import なし）
3. 水平方向のライン描画による波束可視化が実装されている
4. 左側: 振幅の大きい揺らめく波ライン、右側: 収束する発光粒子
5. `node --check` 全対象ファイル通過
6. `git status --short` クリーン
7. `git push origin feature/kesson-codex-app-qwave74` 成功
8. vertexShader は変更しない
9. uniform の追加・削除をしない（既存 uniform を再解釈して使う）

## 禁止事項
- `quantum-field.glsl.js` 以外のファイル変更禁止
- 新規ファイル作成禁止
- 新規 uniform 追加禁止（params.js / quantum-field.js の変更禁止）
- main / feature/dev への直接 push 禁止
- npm パッケージの追加禁止

---

## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-qwave74`
- ワークツリー: `~/dev/kesson-codex-app`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `fix: quantum field shader v3 — 1D wave packet line rendering (Fix #74)`
- push 先: `origin/feature/kesson-codex-app-qwave74`

### 変更ファイル一覧
- `src/shaders/quantum-field.glsl.js` — 変更概要

### 検証結果
- [ ] `node --check` 通過（対象: `src/shaders/quantum-field.glsl.js`）
- [ ] `git status --short` クリーン
- [ ] `git push origin feature/kesson-codex-app-qwave74` 成功

### 残作業・注意事項
- （なければ「なし」と記入）

---

## 目視確認手順（DT / ユーザー用）
```bash
cd ~/dev/kesson-codex-app
./serve.sh
# ブラウザで http://localhost:3001 を開く
# コンソールで toggles.quantumField = true を実行して確認
```
