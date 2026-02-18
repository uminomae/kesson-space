# 指示書: #73 量子場ビジュアライゼーション — 波動・粒子の二重性エフェクト

## 環境判別
本指示書を受け取ったエージェントは `skills/env-adaptive.md` §2 に従い、
自身の環境を判定してから操作マッピングに従って実装すること。

## Issue
https://github.com/uminomae/kesson-space/issues/73

## 作業ブランチ
- ベース: `feature/dev`
- 作業: `feature/kesson-codex-app-quantum73`

## 概要
量子場理論をテーマにした別シーンエフェクトを新規追加する。
波動関数パターン → スリット壁 → 粒子化する光球を1つのフラグメントシェーダーで描画。

### ビジュアル構成
- **左側**: 干渉縞パターン（sin/cos重ね合わせの光線群が収束・発散）
- **中央**: スリット壁（遷移ポイント、縦線で表現）
- **右側**: 白く発光する球体群 + 水平ビーム（粒子化した光）
- **全体**: 深海の色調に合うシアン〜白の発光、暗い背景

## 技術アプローチ
- **フルスクリーン quad + フラグメントシェーダー方式**（既存の vortex.js パターンに準拠）
- UV座標ベースで左→右に波動→粒子の遷移を表現
- 干渉パターン: `sin(k*x - omega*t)` の重ね合わせ
- スリット: step関数で壁を生成、隙間部分で回折パターン
- 粒子化: スリット通過後にノイズ + 点状発光で粒子群を表現
- uTime で全体をアニメーション

## 実装手順

### Step 1: 既存パターンを読む
以下のファイルを読んで、シェーダー・シーン統合のパターンを把握する:
- `src/shaders/vortex.js` — フルスクリーン quad シェーダーのパターン
- `src/config/params.js` — toggles と params の定義パターン
- `src/scene.js` — シーンへの統合パターン

### Step 2: シェーダーファイル作成
- パス: `src/shaders/quantum-field.glsl.js`
- 内容:
  - vertex shader: フルスクリーン quad 用（vortex.js と同様）
  - fragment shader:
    - uniform: `uTime`, `uOpacity`, `uSlitPosition`, `uWaveCount`, `uParticleIntensity`
    - 左領域: 複数波の干渉パターン（sin波の重ね合わせ、位相差あり）
    - 中央: スリット壁（2本スリット、smoothstep で境界）
    - 右領域: スリット通過後の回折パターン + 点状発光粒子
    - 色: シアン系 (0.2, 0.8, 1.0) をベースに白発光
  - `export function createQuantumFieldMaterial()` — THREE.ShaderMaterial を返す
  - `export function createQuantumFieldMesh(material)` — PlaneGeometry + mesh を返す

### Step 3: config にトグルとパラメータを追加
- ファイル: `src/config/params.js`
- toggles に追加: `quantumField: false` （デフォルト OFF）
- 新規 export:
```js
export const quantumFieldParams = {
    opacity: 0.8,
    slitPosition: 0.4,    // UV.x でスリットの位置
    waveCount: 5,          // 干渉波の本数
    particleIntensity: 1.0,
    speed: 0.5,
    posX: 15,
    posY: 0,
    posZ: 5,
    size: 30,
};
```

### Step 4: scene.js に統合
- ファイル: `src/scene.js`
- import: `createQuantumFieldMaterial`, `createQuantumFieldMesh` を追加
- import: `quantumFieldParams` を config から追加
- `createScene()` 内で mesh 生成・scene.add
- `updateScene()` 内で toggles.quantumField による表示制御と uniform 更新
- 既存パターン（vortex の統合方法）に完全準拠

### Step 5: 検証
- `node --check src/shaders/quantum-field.glsl.js` — 構文チェック
- `node --check src/scene.js` — 構文チェック
- `node --check src/config/params.js` — 構文チェック
- `git status --short` でクリーンを確認

### Step 6: コミット & プッシュ
- メッセージ: `feat: add quantum field visualization shader (Fix #73)`
- ブランチ: `feature/kesson-codex-app-quantum73`

## 完了条件
1. `src/shaders/quantum-field.glsl.js` が新規作成されている
2. `src/config/params.js` に `quantumField` トグルと `quantumFieldParams` が追加されている
3. `src/scene.js` に量子場エフェクトが統合されている
4. 全対象ファイルが `node --check` を通過する
5. コミットメッセージに `Fix #73` を含む
6. `feature/kesson-codex-app-quantum73` ブランチにプッシュ済み

## 禁止事項
- main ブランチへの直接 push 禁止
- feature/dev への直接マージ禁止
- 既存シェーダー・既存シーン要素の変更禁止（追加のみ）
- 外部依存の追加禁止（Three.js の CDN のみ使用可）
- config/params.js の既存パラメータの値変更禁止

## 完了報告（実装者が記入）

### ブランチ・ワークツリー
- ブランチ: `feature/kesson-codex-app-quantum73`
- ワークツリー: `~/dev/kesson-codex-2`

### コミット
- SHA: `xxxxxxx`
- メッセージ: `feat: add quantum field visualization shader (Fix #73)`
- push 先: `origin/feature/kesson-codex-app-quantum73`

### 変更ファイル一覧
- `path/to/file1` — 変更概要
- `path/to/file2` — 変更概要

### 検証結果
- [ ] `node --check` 通過（対象: ...）
- [ ] `git status --short` クリーン
- [ ] その他実行した検証コマンドと結果

### 残作業・注意事項
- （なければ「なし」と記入）
