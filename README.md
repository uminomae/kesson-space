# kesson-space

> 欠損駆動思考の3D体験空間

---

## 🚀 セッション開始

**このセクションを読んだ時点で常駐エージェントが起動する。**

### 常駐エージェント

| エージェント | 役割 | 詳細 |
|--------------|------|------|
| 📋 プロジェクト管理 | タスク委譲・指示書生成 | [skills/project-management-agent.md](skills/project-management-agent.md) |
| 🩺 セッションヘルス | コンテキスト監視 | [docs/AGENT-RULES.md §8](docs/AGENT-RULES.md) |
| 🔎 PKガード | ドキュメント参照最適化 | [docs/AGENT-RULES.md §7](docs/AGENT-RULES.md) |

### Step 1: 状態確認

→ [docs/CURRENT.md](docs/CURRENT.md) を読む

### Step 2: ワークツリー確認

DTが見ているディレクトリは？
→ 📋エージェントが出力先を決定

### Step 3: タスク着手

ユーザーがタスクを指示 → 📋エージェントが委譲判断

---

## 📖 ドキュメント

→ [docs/README.md](docs/README.md)

---

## 💻 開発

```bash
./serve.sh  # → http://localhost:3001/
```

---

## 🔗 関連プロジェクト

| 場所 | 役割 |
|------|------|
| [kesson-space](https://uminomae.github.io/kesson-space/) | 体験する（本リポジトリ） |
| [pjdhiro ブログ](https://uminomae.github.io/pjdhiro/thinking-kesson/) | 読む |
| kesson-driven-thinking | 理論の正本（Private） |
