# スキーマ一覧（Schema Index）

**目的**: 欠損駆動思考のコア定義・構造・対応表を管理する。

**設計意図**:
- 理論の骨格となる定義・モジュール構造を集約
- 用語統一のためのグロッサリを格納
- 補助モデル（BSPL等）を auxiliary/ に分離

---

## ファイル一覧

| ファイル | タイトル | 状態 |
|---------|---------|------|
| [core-definitions.md](core-definitions.md) | コア定義（Core Definitions） | 確定 |
| [four-modules.md](four-modules.md) | 4モジュール構造（Four Modules） | M1/M2確定、M3/M4仮 |
| [container-mapping.md](container-mapping.md) | Container対応表（Container Mapping） | active |
| [hoji-matching-v2.md](hoji-matching-v2.md) | 抱持マッチング表 v2（有向7x7） | active |
| [glossary.md](glossary.md) | 用語グロッサリ（Glossary） | active |

## auxiliary/

| ファイル | タイトル | 状態 |
|---------|---------|------|
| [auxiliary/bspl-model.md](auxiliary/bspl-model.md) | BSPLモデル（脳のBS/PL会計モデル） | 探索的 |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-04-07 | 初版作成（techo#101） |
