# kesson-space

> pjdhiroの主観世界を追体験する3D空間

神経現象学的な意識モデルを、暗闇と夢のような視覚体験として表現する。

---

## 🚀 セッション開始（Claude向け）

```
1. docs/CURRENT.md を読む（進捗・TODO確認）
2. 前回の「次セッションのタスク」を確認
3. 必要に応じて docs/CONCEPT.md, docs/ARCHITECTURE.md 参照
```

詳細: [docs/WORKFLOW.md](docs/WORKFLOW.md)

---

## 📁 ファイル構成

| パス | 役割 |
|------|------|
| [docs/CURRENT.md](docs/CURRENT.md) | 進捗・TODO・次タスク（毎セッション更新） |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | セッション管理手順 |
| [docs/CONCEPT.md](docs/CONCEPT.md) | 理論とビジュアルの対応 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技術構成・決定記録 |
| src/main.js | Three.jsメインコード |
| data/ | コンテンツデータ（将来） |

---

## 💻 開発

```bash
./serve.sh
# → http://localhost:3001/
```

---

## コンセプト

- **意識の4層**: 内受容感覚 → 予測誤差 → F-O評価 → Withhold
- **創造の5段階**: 場 → 波 → 縁 → 渦 → 束（海のメタファー）
- **忍的雰囲気**: 秘すれば花、正心、未発の中

---

## 技術スタック

- GitHub Pages
- Vanilla JS + Three.js (ES Modules)
- Git as Database（YAML）

---

## プロジェクト群

本リポジトリは「欠損駆動思考」プロジェクトの体験出力。理論を3D空間として追体験する場所。

| 場所 | 役割 | リンク |
|------|------|--------|
| **kesson-space** | 体験する | [ライブ](https://uminomae.github.io/kesson-space/) |
| pjdhiro ブログ | 読む | [欠損駆動思考](https://uminomae.github.io/pjdhiro/thinking-kesson/) / [創造5段階](https://uminomae.github.io/pjdhiro/dialogueCreation/) |
| kesson-driven-thinking | 理論の正本 | [GitHub](https://github.com/uminomae/kesson-driven-thinking)（Private） |
