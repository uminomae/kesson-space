# 指示書: #78 devパネルに量子波屈折 / パーティクル砂嵐のトグル・スライダーを追加

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/78

## 作業ブランチ
- 作業: `feature/kesson-codex-app1-devpanel78`

## 概要
#74（量子波屈折）と #75（パーティクル砂嵐）の実装が feature/dev にマージ済みだが、
devパネル（DEV_TOGGLES / DEV_SECTIONS）に未登録のため UI に表示されない。
2つのトグルと2つのパラメータセクションを追加する。

## 実装手順

### Step 1: 対象ファイルを読む
以下をリモート `feature/kesson-codex-app1-devpanel78` から読むこと:
- `src/config/dev-ui.js`
- `src/config/dev-registry.js`
- `src/config/params.js`（参照のみ、変更しない）

### Step 2: `src/config/dev-ui.js` を編集

#### 2a. import 文を修正
先頭の import に `quantumWaveParams` と `particleStormParams` を追加:

```js
import {
  breathConfig,
  sceneParams,
  gemParams,
  xLogoParams,
  vortexParams,
  liquidParams,
  quantumWaveParams,
  particleStormParams,
  toggles,
} from './params.js';
```

#### 2b. DEV_TOGGLES に2項目追加
既存の `{ key: 'vortex', label: '渦' }` の下に追加:

```js
    { key: 'quantumWave',   label: '量子波屈折' },
    { key: 'particleStorm', label: 'パーティクル砂嵐' },
```

#### 2c. DEV_SECTIONS に2セクション追加
既存の `liquid` セクションの下（`heatdof` セクションの前）に以下2セクションを追加:

```js
    {
        id: 'quantumWave',
        title: '量子波屈折',
        params: {
            qwStrength:    { label: '屈折の強さ',    min: 0.0,  max: 0.2,  step: 0.005, default: quantumWaveParams.strength },
            qwSpeed:       { label: '波の速度',      min: 0.0,  max: 1.0,  step: 0.05,  default: quantumWaveParams.speed },
            qwBaseFreq:    { label: '基本周波数',    min: 0.5,  max: 15.0, step: 0.5,   default: quantumWaveParams.baseFreq },
            qwDispersion:  { label: '分散',          min: 0.0,  max: 0.5,  step: 0.01,  default: quantumWaveParams.dispersion },
            qwNoiseAmp:    { label: 'ノイズ振幅',    min: 0.0,  max: 3.0,  step: 0.1,   default: quantumWaveParams.noiseAmp },
            qwNoiseScale:  { label: 'ノイズスケール', min: 0.5, max: 10.0, step: 0.5,   default: quantumWaveParams.noiseScale },
            qwWaveCount:   { label: '波数',          min: 1.0,  max: 8.0,  step: 1.0,   default: quantumWaveParams.waveCount },
            qwEnvelope:    { label: 'エンベロープ',   min: 0.1,  max: 3.0,  step: 0.1,   default: quantumWaveParams.envelope },
            qwYInfluence:  { label: 'Y方向影響',     min: 0.0,  max: 2.0,  step: 0.1,   default: quantumWaveParams.yInfluence },
            qwGlowAmount:  { label: '発光量',        min: 0.0,  max: 2.0,  step: 0.05,  default: quantumWaveParams.glowAmount },
            qwGlowColorR:  { label: '発光色 R',      min: 0.0,  max: 1.0,  step: 0.05,  default: quantumWaveParams.glowColorR },
            qwGlowColorG:  { label: '発光色 G',      min: 0.0,  max: 1.0,  step: 0.05,  default: quantumWaveParams.glowColorG },
            qwGlowColorB:  { label: '発光色 B',      min: 0.0,  max: 1.0,  step: 0.05,  default: quantumWaveParams.glowColorB },
            qwCaberration: { label: '色収差',        min: 0.0,  max: 0.1,  step: 0.005, default: quantumWaveParams.caberration },
            qwRimBright:   { label: 'リムライト',    min: 0.0,  max: 2.0,  step: 0.05,  default: quantumWaveParams.rimBright },
            qwBlurAmount:  { label: 'ぼかし',        min: 0.0,  max: 0.1,  step: 0.005, default: quantumWaveParams.blurAmount },
            qwFogDensity:  { label: '白濁',          min: 0.0,  max: 1.0,  step: 0.05,  default: quantumWaveParams.fogDensity },
            qwFogColorR:   { label: '霧色 R',        min: 0.0,  max: 1.0,  step: 0.05,  default: quantumWaveParams.fogColorR },
            qwFogColorG:   { label: '霧色 G',        min: 0.0,  max: 1.0,  step: 0.05,  default: quantumWaveParams.fogColorG },
            qwFogColorB:   { label: '霧色 B',        min: 0.0,  max: 1.0,  step: 0.05,  default: quantumWaveParams.fogColorB },
            qwDarken:      { label: '暗化',          min: 0.0,  max: 1.0,  step: 0.05,  default: quantumWaveParams.darken },
            qwTurbulence:  { label: '乱流',          min: 0.0,  max: 2.0,  step: 0.05,  default: quantumWaveParams.turbulence },
            qwSharpness:   { label: 'シャープネス',   min: 0.0,  max: 1.0,  step: 0.05,  default: quantumWaveParams.sharpness },
        }
    },
    {
        id: 'particleStorm',
        title: 'パーティクル砂嵐',
        params: {
            psSpeed:        { label: '波速度',        min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.speed },
            psIntensity:    { label: '強度',          min: 0.0,  max: 3.0,  step: 0.1,   default: particleStormParams.intensity },
            psOpacity:      { label: '透明度',        min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.opacity },
            psBaseFreq:     { label: '基本周波数',    min: 0.5,  max: 15.0, step: 0.5,   default: particleStormParams.baseFreq },
            psDispersion:   { label: '分散',          min: 0.0,  max: 0.5,  step: 0.01,  default: particleStormParams.dispersion },
            psWaveCount:    { label: '波数',          min: 1.0,  max: 8.0,  step: 1.0,   default: particleStormParams.waveCount },
            psNoiseAmp:     { label: 'ノイズ振幅',    min: 0.0,  max: 3.0,  step: 0.1,   default: particleStormParams.noiseAmp },
            psNoiseScale:   { label: 'ノイズスケール', min: 0.5, max: 10.0, step: 0.5,   default: particleStormParams.noiseScale },
            psGrainDensity: { label: '粒密度',        min: 100,  max: 2000, step: 50,    default: particleStormParams.grainDensity },
            psGrainSize:    { label: '粒サイズ',      min: 0.1,  max: 1.0,  step: 0.05,  default: particleStormParams.grainSize },
            psAdvect:       { label: '移流の強さ',    min: 0.0,  max: 0.1,  step: 0.005, default: particleStormParams.advectStrength },
            psColorR:       { label: 'ベース色 R',    min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.colorR },
            psColorG:       { label: 'ベース色 G',    min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.colorG },
            psColorB:       { label: 'ベース色 B',    min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.colorB },
            psBrightR:      { label: '高密度色 R',    min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.brightColorR },
            psBrightG:      { label: '高密度色 G',    min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.brightColorG },
            psBrightB:      { label: '高密度色 B',    min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.brightColorB },
            psColorMix:     { label: '色混合度',      min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.colorMix },
            psBrightness:   { label: '明るさ',        min: 0.0,  max: 3.0,  step: 0.1,   default: particleStormParams.brightness },
            psContrast:     { label: 'コントラスト',   min: 0.2,  max: 3.0,  step: 0.1,   default: particleStormParams.contrast },
            psSaturation:   { label: '彩度',          min: 0.0,  max: 2.0,  step: 0.1,   default: particleStormParams.saturation },
            psGlowAmount:   { label: '発光量',        min: 0.0,  max: 2.0,  step: 0.05,  default: particleStormParams.glowAmount },
            psGlowSpread:   { label: '発光広がり',    min: 0.5,  max: 5.0,  step: 0.5,   default: particleStormParams.glowSpread },
            psGlowColorR:   { label: '発光色 R',      min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.glowColorR },
            psGlowColorG:   { label: '発光色 G',      min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.glowColorG },
            psGlowColorB:   { label: '発光色 B',      min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.glowColorB },
            psSoftness:     { label: 'ソフトネス',    min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.softness },
            psBloom:        { label: 'ブルーム',      min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.bloomAmount },
            psEdgeFadeStart:{ label: 'エッジ開始',    min: 0.5,  max: 3.0,  step: 0.1,   default: particleStormParams.edgeFadeStart },
            psEdgeFadeEnd:  { label: 'エッジ終了',    min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.edgeFadeEnd },
            psCenterDim:    { label: '中心減光',      min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.centerDim },
            psDensityFloor: { label: '密度フロア',    min: 0.0,  max: 0.5,  step: 0.05,  default: particleStormParams.densityFloor },
            psFlickerSpeed: { label: '明滅速度',      min: 0.0,  max: 10.0, step: 0.5,   default: particleStormParams.flickerSpeed },
            psFlickerAmt:   { label: '明滅量',        min: 0.0,  max: 1.0,  step: 0.05,  default: particleStormParams.flickerAmount },
            psDriftSpeed:   { label: 'ドリフト速度',   min: 0.0,  max: 0.1,  step: 0.005, default: particleStormParams.driftSpeed },
            psDriftAngle:   { label: 'ドリフト方向',   min: 0.0,  max: 6.28, step: 0.1,   default: particleStormParams.driftAngle },
            psPosX:         { label: '位置 X',        min: -100, max: 100,  step: 1,     default: particleStormParams.posX },
            psPosY:         { label: '位置 Y',        min: -50,  max: 50,   step: 1,     default: particleStormParams.posY },
            psPosZ:         { label: '位置 Z',        min: -100, max: 100,  step: 1,     default: particleStormParams.posZ },
            psSize:         { label: 'サイズ',        min: 10,   max: 500,  step: 10,    default: particleStormParams.size },
        }
    },
```

### Step 3: `src/config/dev-registry.js` を編集

#### 3a. import 文を修正
`quantumWaveParams` と `particleStormParams` を追加:

```js
import {
  breathConfig,
  sceneParams,
  gemParams,
  xLogoParams,
  vortexParams,
  liquidParams,
  quantumWaveParams,
  particleStormParams,
  toggles,
} from './params.js';
```

#### 3b. 量子波マッピングを追加
`LIQUID_CONFIG_MAP` の下に以下を追加:

```js
const QUANTUM_WAVE_MAP = {
    qwStrength:    'strength',
    qwSpeed:       'speed',
    qwBaseFreq:    'baseFreq',
    qwDispersion:  'dispersion',
    qwNoiseAmp:    'noiseAmp',
    qwNoiseScale:  'noiseScale',
    qwWaveCount:   'waveCount',
    qwEnvelope:    'envelope',
    qwYInfluence:  'yInfluence',
    qwGlowAmount:  'glowAmount',
    qwGlowColorR:  'glowColorR',
    qwGlowColorG:  'glowColorG',
    qwGlowColorB:  'glowColorB',
    qwCaberration: 'caberration',
    qwRimBright:   'rimBright',
    qwBlurAmount:  'blurAmount',
    qwFogDensity:  'fogDensity',
    qwFogColorR:   'fogColorR',
    qwFogColorG:   'fogColorG',
    qwFogColorB:   'fogColorB',
    qwDarken:      'darken',
    qwTurbulence:  'turbulence',
    qwSharpness:   'sharpness',
};

const PARTICLE_STORM_MAP = {
    psSpeed:        'speed',
    psIntensity:    'intensity',
    psOpacity:      'opacity',
    psBaseFreq:     'baseFreq',
    psDispersion:   'dispersion',
    psWaveCount:    'waveCount',
    psNoiseAmp:     'noiseAmp',
    psNoiseScale:   'noiseScale',
    psGrainDensity: 'grainDensity',
    psGrainSize:    'grainSize',
    psAdvect:       'advectStrength',
    psColorR:       'colorR',
    psColorG:       'colorG',
    psColorB:       'colorB',
    psBrightR:      'brightColorR',
    psBrightG:      'brightColorG',
    psBrightB:      'brightColorB',
    psColorMix:     'colorMix',
    psBrightness:   'brightness',
    psContrast:     'contrast',
    psSaturation:   'saturation',
    psGlowAmount:   'glowAmount',
    psGlowSpread:   'glowSpread',
    psGlowColorR:   'glowColorR',
    psGlowColorG:   'glowColorG',
    psGlowColorB:   'glowColorB',
    psSoftness:     'softness',
    psBloom:        'bloomAmount',
    psEdgeFadeStart:'edgeFadeStart',
    psEdgeFadeEnd:  'edgeFadeEnd',
    psCenterDim:    'centerDim',
    psDensityFloor: 'densityFloor',
    psFlickerSpeed: 'flickerSpeed',
    psFlickerAmt:   'flickerAmount',
    psDriftSpeed:   'driftSpeed',
    psDriftAngle:   'driftAngle',
    psPosX:         'posX',
    psPosY:         'posY',
    psPosZ:         'posZ',
    psSize:         'size',
};
```

#### 3c. DEV_PARAM_REGISTRY 構築ロジックに追加
`DEV_SECTIONS.forEach` のループ内、`LIQUID_CONFIG_MAP` のブロックの下に以下を追加:

```js
            if (key in QUANTUM_WAVE_MAP) {
                entry.apply.push({ kind: 'config', object: 'quantumWaveParams', key: QUANTUM_WAVE_MAP[key] });
            }

            if (key in PARTICLE_STORM_MAP) {
                entry.apply.push({ kind: 'config', object: 'particleStormParams', key: PARTICLE_STORM_MAP[key] });
            }
```

### Step 4: コミット & プッシュ
- メッセージ: `feat: add quantumWave & particleStorm to dev panel toggles and sliders (Fix #78)`
- ブランチ: `feature/kesson-codex-app1-devpanel78`

### Step 5: 検証
- `node --check` を `src/config/dev-ui.js` と `src/config/dev-registry.js` に対して実行
- `git status --short` がクリーン
- `git push origin feature/kesson-codex-app1-devpanel78`

## 完了条件
1. devパネルの「表示 ON/OFF」に「量子波屈折」「パーティクル砂嵐」トグルが表示される
2. devパネルのセクション一覧に「量子波屈折」セクション（23個のスライダー）が表示される
3. devパネルのセクション一覧に「パーティクル砂嵐」セクション（40個のスライダー）が表示される
4. 各スライダーを動かすと対応する params の値がリアルタイムで変わる
5. 既存のトグル・セクションが壊れていない
6. `node --check` が通過

## 禁止事項
- `params.js` の変更禁止（既にマージ済み）
- シェーダーファイルの変更禁止
- `scene.js` / `render-loop.js` の変更禁止
- 変更は `dev-ui.js` と `dev-registry.js` の2ファイルのみ

---

## 🔴 完了報告（実装者が必ずこのフォーマットで出力すること）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app1-devpanel78`
- ワークツリー: `~/dev/kesson-codex-app1`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `feat: add quantumWave & particleStorm to dev panel toggles and sliders (Fix #78)`
- push 先: `origin/feature/kesson-codex-app1-devpanel78`

### 変更ファイル一覧
- `path/to/file1` — 変更概要
- `path/to/file2` — 変更概要

### 検証結果
- [ ] `node --check` 通過（対象: ...）
- [ ] `git status --short` クリーン
- [ ] `git push origin feature/kesson-codex-app1-devpanel78` 成功

### 残作業・注意事項
- （なければ「なし」と記入）
