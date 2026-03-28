# 抱持 マッチング表 v2（有向7×7）

## 概要
抱持 7段階の関係を、A（Container役）→B（Contained役）として表現した有向7×7の再校正版（観測指標付き）。
本ファイルは `codex/archive/deepdive/REPORT-matching-recalibration.md` から抽出・再構成した。

## マッチング表 v2
### §D: マッチング表v2（再校正済み統合表）

> 表示方針: 各セルは「原典の短い要約」＋「成功兆候/失敗兆候（各1つ）」の最小追記に留める。詳細は§A/§B参照。

| A\\B | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---:|---|---|---|---|---|---|---|
| **1** | 断絶（停止共振）<br>成: L0回復が始まる<br>失: 応答消失 | 断絶（支え不能）<br>成: 第三Container介入<br>失: 2が暴走→1固定 | 断絶（回復不足）<br>成: L0-4が改善<br>失: 早期収束へ | 断絶<br>成: まず回復<br>失: 相互作用消失 | 断絶<br>成: 回復→保持入口<br>失: 断絶固定 | 断絶<br>成: 安全回復<br>失: 断絶固定 | 断絶<br>成: 安全回復<br>失: 断絶固定 |
| **2** | 断絶（脅威）<br>成: 2が速度低下<br>失: 1がフリーズ | 共鳴（即応強化）<br>成: 高速同意<br>失: 分裂増幅 | 衝突（保留破壊）<br>成: 発話遮り減<br>失: 早い結論 | 衝突（固着加速）<br>成: 停止点導入<br>失: 反復増幅 | 調和?（依存）<br>成: L0-6観測<br>失: 抱え込み | 衝突（価値ズレ）<br>成: 押し付け回避<br>失: 説教化 | 片側化（対話破壊）<br>成: 保留維持<br>失: 衝突へ |
| **3** | 断絶（凍結支え不能）<br>成: 身体/対人先行<br>失: 押してフリーズ | 衝突（急かし）<br>成: 言い換え維持<br>失: 即応増幅 | 共鳴（短い保持）<br>成: 同テンポで閉<br>失: 速度固定 | 衝突（噛み合わず）<br>成: 差分外部化<br>失: 反復×閉 | 調和（入口）<br>成: 問いが落ちない<br>失: 依存増幅 | 調和（師弟）<br>成: 問い1文化<br>失: 押し付け | 片側化（過剰設計）<br>成: 最小設計<br>失: 早期収束増 |
| **4** | 断絶（閉じる）<br>成: 安全回復<br>失: 断絶固定 | 衝突（正当化）<br>成: 単純化圧下げ<br>失: 分裂補強 | 衝突（誘導）<br>成: 外部化で差分<br>失: 早期収束強化 | 共鳴（固定化）<br>成: 差分が出る<br>失: L1-3継続 | 調和?（依存誘導）<br>成: 外部化併用<br>失: 5固定 | 衝突（価値ズレ）<br>成: 対話で保留<br>失: 規範が盾に | 片側化（形骸化）<br>成: 停止点運用<br>失: 形式だけ |
| **5** | 断絶（共倒れ）<br>成: まず安全<br>失: 相互急落 | 調和?（抱え込み）<br>成: 抱え込み回避<br>失: 2維持 | 調和（悪化防止）<br>成: 急落回避<br>失: 依存強化 | 調和（関係で止める）<br>成: 問い保持増<br>失: 儀式化 | 共鳴（二者安定）<br>成: 外的抱持継続<br>失: 混線 | 衝突（移行摩擦）<br>成: 段階的撤去<br>失: 早い撤去 | 片側化（不安増）<br>成: 対話が保護<br>失: 命令化 |
| **6** | 断絶（安全回復）<br>成: L0先行<br>失: 断絶 | 調和（Contain）<br>成: 2が速度低下<br>失: 説教化 | 衝突（急ぎvs待つ）<br>成: 保留合意<br>失: 摩擦増 | 衝突（ほどく摩擦）<br>成: 外部化導入<br>失: 押し付け | 調和（内在化支援）<br>成: 揺れ→回復<br>失: 急落 | 共鳴（相互再評価）<br>成: 問い共有<br>失: 単純化圧 | 調和（制度/対話運用）<br>成: 停止が守られる<br>失: 形骸化 |
| **7** | 断絶（届かない）<br>成: 安全回復<br>失: 断絶 | 片側化（命令化）<br>成: 最小運用<br>失: 衝突 | 片側化（過剰枠）<br>成: 最小設計<br>失: 早期収束増 | 衝突（硬直vs固着）<br>成: 停止点再設計<br>失: 形骸化 | 片側化（依存増）<br>成: 保留が保護<br>失: 不安増 | 調和（継続支援）<br>成: 制度/対話で守る<br>失: 退行 | 共鳴（共同設計）<br>成: 仕組みが場で作動<br>失: 命令化 |

---

## 横断分析
### §C: マッチングパターンの横断分析

#### C.1 H2の観測的検証（隣接衝突・2段調和）

観測の入口（本repo内の観測指標に基づく暫定）:
- 隣接（差=1）は、**“速度/解除タイミング/境界の置き方”**がズレやすく、境界判定（§B.2〜§B.5）で誤判定が起きやすい（例: 3↔4, 5↔6）。
- 2段階差（差=2）は、Containment（EV-PA-002）やZPD（EV-DP-002）の説明枠が当てやすく、**支援→内在化**の方向で運用しやすい兆候がある。

ただし:
- H2は仮説であり、観測は文脈依存。セルごとに`[CONTEXT_DEPENDENT]`が残る。

#### C.2 非対称性のパターン

- Aが上位段階のとき、A→Bは「外的抱持の提供」として記述しやすい（L3-7, EV-PA-002）。
- 逆向き（Bが下位→Aが上位）は、“Containment”ではなく、Layer 0（現場性/身体的入力）やβ要素へのアクセス提供として現れる可能性がある（`REPORT-抱持-structuring.md` §B.5）。`[WEAK_MAPPING][SCALE_JUMP]`

#### C.3 「共倒れ」パターン

共倒れが起きやすい兆候（例: [5→1]の断絶・共倒れリスク）:
- 両者が同時に安全を失い（L0-1）、外的抱持が成立しない
- 相互の関係が不安定になり、保持が関係の揺れで増幅する（O軸固定の強化）`[CONTEXT_DEPENDENT]`

---

## 限界と残課題
### §E: 統合と限界

#### E.1 `[UNCERTAIN]`残量レポート

- [7→*]や[*→7]は`[SCALE_JUMP]`が避けられない。個人→集団の同一視はしない。
- [1→*]は「AがContainer役」になりにくく、観測指標も第三のContainer介入前提になりやすい（`[WEAK_MAPPING]`が残る）。

#### E.2 H2仮説の現時点での支持度

- 観測指標への落とし込みとしては、隣接（3↔4, 5↔6）の誤判定ガイドが厚く、摩擦が“出やすい”ことは示唆される。
- ただし「差=1は衝突、差=2は調和」を一般則として言い切る根拠は不足。`[SPECULATIVE]`

---

#### 付録: 本レポートが参照した主要ファイル

- `codex/archive/deepdive/REPORT-抱持-structuring.md`
- `codex/archive/deepdive/REPORT-抱持-observability.md`
- `codex/archive/deepdive/REPORT-抱持-uncertain-resolution.md`
- `base/schema/core-definitions.md`
- `/Users/uminomae/dev/creation-space/evidence/evidence-psychoanalysis.md`
- `/Users/uminomae/dev/creation-space/evidence/evidence-developmental-psychology.md`
- `/Users/uminomae/dev/creation-space/evidence/evidence-neuroscience.md`
- `/Users/uminomae/dev/creation-space/evidence/evidence-business-org.md`
- `/Users/uminomae/dev/creation-space/evidence/evidence-creativity.md`
- `/Users/uminomae/dev/creation-space/evidence/evidence-life-sciences.md`
- `/Users/uminomae/dev/creation-space/evidence/evidence-philosophy.md`

## 出典
- 抽出元: `codex/archive/deepdive/REPORT-matching-recalibration.md`（TASK #10f, 2026-02-07）
