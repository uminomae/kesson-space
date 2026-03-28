# creation-space-refs

`creation-space/evidence/` 内に残っている kesson 固有参照のうち、抽出または再索引したものを束ねるディレクトリ。

## 5W1H

### What

`creation-space` 由来の kesson 参照メモ、抽出断片、概念インデックス。

### Why

`creation-space` 側を独立モジュールとして薄く保ちながら、kesson 側で再利用できる参照束を保持するため。行番号ベースの脆いインデックスではなく、内容ベースで自立した参照素材とすることで、元ファイルの編集に対する耐性を持たせる。

### Who

pjdhiro、Claude が、Phase 6 以降の理論整理で参照する。

### When

Issue #251 の実装時（2026-03-14）に作成。#278（2026-03-17）で内容ベースに再構築。

### Where

`kesson-driven-thinking/base/evidence/creation-space-refs/`

### How

カテゴリ B 参照21件を概念別インデックス（CR-01 〜 CR-21）として再索引し、横断的所見を付与した。各参照は行番号に依存せず、出典セクション名と要旨で自立する。

## 含まれるもの

| ファイル | 内容 | 参照件数 |
|---------|------|---------|
| `concept-index.md` | creation-space evidence に残る kesson 参照の概念別インデックス。21件の内容ベース参照 + 横断的所見4件 | CR-00 〜 CR-21 |
| `memo-level2-similarities.md` | `memo-level2.md` の `[類似] / [独自] / [学び]` 記述抜粋 | 1件 |

## 参照の形式

各参照は以下の構造を持つ:

```
### [CR-XX] タイトル
- **出典**: `evidence/...` のパスとセクション名（行番号に依存しない）
- **要旨**: 元ファイルから2-3文で内容を転記
- **kesson接続**: D1-D4 / 抱持 / F軸O軸 のどれにどう接続するか
```

## 元ファイルの所在

参照先は全て `~/dev/creation-space/evidence/` 配下:

- `evidence/review/memo-level2.md`
- `evidence/review/p1-cross-domain-insights.md`
- `evidence/review/d01-phase2-evaluation.md`
- `evidence/review/judgments.md`
- `evidence/review/plan-level2-uniform.md`
- `evidence/202602-deep-research-30domains-gpt/DR-D07-engineering.md`
- `evidence/202602-deep-research-30domains-gpt/DR-D15-aesthetics.md`
- `evidence/202602-deep-research-30domains-gpt/DR-D26-musicology.md`
- `evidence/202602-deep-research-30domains-gpt/DR-D30-traditional-knowledge.md`
- `evidence/evidence-D21-economics.md`
