# CURRENT - 進捗・引き継ぎ

**最終更新**: 2026-02-17
**セッション**: DTチャット（セルフレビュー + 並列修正計画）

---

## 現在の状態

### タスク管理

**GitHub Issues が正本。** T-XXX 形式のタスクIDは廃止済み。
→ https://github.com/uminomae/kesson-space/issues

### 進行中（Codex 並列3本）

| ブランチ | Issue | 内容 | 状態 |
|---------|-------|------|------|
| feature/kesson-codex-app-test36 | #36 | config re-export ランタイムテスト追加 | ⏳Codex実行中 |
| feature/kesson-codex-app-liquid38 | #38 | liquid.js 圧力ソルブ ping-pong化 | ⏳Codex実行中 |
| feature/kesson-codex-app-toggle34 | #34 | トグル OFF→ON uniform復帰 | ⏳Codex実行中 |

### 待機中（Phase 2: 直列、Phase 1マージ後）

| Issue | 内容 | 備考 |
|-------|------|------|
| #35 | import map self-host（CDN単一依存解消） | devlog.html競合のため#37と直列 |
| #37 | innerHTML 未サニタイズ（3箇所） | #35完了後に着手 |

### マージ順序

```
Phase 1: 3ブランチ各自 → feature/dev（目視確認）
Phase 2: #35 → feature/dev → #37 → feature/dev
最終: feature/dev → main
```

## Open Issues

| # | P | タイトル |
|---|---|---------|
| #35 | P1 | import map単一CDN依存 |
| #36 | P1 | config re-exportテスト不足 |
| #38 | P1 | liquid.js ping-pongフィードバックループ |
| #34 | P2 | トグル片道OFF（uniform復帰なし） |
| #37 | P2 | innerHTML未サニタイズ |
| #20 | P3 | パフォーマンスプロファイリング |
| #23 | P3 | 音響検討 |
| #24 | P3 | SNSワークフロー |

## ブランチ状態

- main: 82b2522
- feature/dev: a3a9236（mainと同期）
- feature/kesson-codex-app-test36: d58dd81（Codex作業中）
- feature/kesson-codex-app-liquid38: 4083f8c（Codex作業中）
- feature/kesson-codex-app-toggle34: c136593（Codex作業中）
- feature/kesson-codex-app: 89708fd（削除可能）

## テスト実行方法

### 静的解析（Node.js / CI自動）
```bash
node tests/config-consistency.test.js
```

### E2Eテスト（ブラウザ独立実行）
```
http://localhost:3001/?test          ← 全テスト自動実行
http://localhost:3001/?test&lang=en  ← 英語版テスト含む
http://localhost:3001/?test&dev      ← devパネルテスト含む
```

## 技術的メモ

- Three.js 0.160.0（CDN importmap → #35でself-host予定）
- Bootstrap 5.3.3（CDN、devパネル ?dev 時のみ動的ロード）
- ES Modules（ビルドツールなし）
- ポート: 3001
- デプロイ: GitHub Pages（mainブランチ直接）

## 参照リンク

- [README.md](../README.md) - セッション起動
- [docs/README.md](./README.md) - ドキュメントハブ
- [AGENT-RULES.md](./AGENT-RULES.md) - マルチエージェント運用ルール
- [GitHub Issues](https://github.com/uminomae/kesson-space/issues) - タスク正本
