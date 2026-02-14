# DEVLOG-SPEC — Devlog Gallery 仕様書

**ブランチ**: `feature/devlog-gallery`
**セッション**: #10 Devlog Gallery
**作成日**: 2026-02-14

---

## 0. コンセプト

コミットログを「写真アルバム」として体験する3D空間。
3時間以上の空白でセッションを区切り、各セッションをカードとしてInstagram風グリッドに配置。
kesson-spaceの闇の中に浮かぶ光のカード群。選択するとズームイン。

**メタファー**: iPhoneの写真アプリ × kesson-spaceの闇

---

## 1. 承認バイパスフラグ

### 設計思想

事前許可したリポジトリに対するローカル・リモート操作は、セッション中の都度承認を省略する。
git履歴が残るため追跡可能。

### 設定ファイル: `scripts/devlog-config.json`

- `approved_repos`: 許可済みリポジトリ一覧（name, owner, local_path, remote, permissions）
- `auto_approve`: true でセッション中の確認をスキップ
- `permissions`: `read_log`, `push_assets`, `push_branch` を個別に制御

---

## 2. データパイプライン

### git log → sessions.json

`scripts/generate-sessions.py` がコミットログを解析し、3h以上の空白でセッション分割。

### sessions.json スキーマ

各セッション: id, repo, start, end, duration_min, commit_count, files_changed, insertions, deletions, dominant_category, color, messages, intensity, texture_url

### カテゴリ分類

| パターン | カテゴリ | 色 |
|---------|---------|----|
| shaders/ | shader | #1a237e |
| docs/, .md | document | #f59e0b |
| config., .json | config | #94a3b8 |
| src/, .js | code | #22c55e |
| assets/ | asset | #a855f7 |
| scripts/, .github/ | infra | #ef4444 |

---

## 3. Three.js ギャラリー

### モジュール構成

- `src/devlog/devlog.js` — エントリ
- `src/devlog/grid.js` — 3×Nグリッド配置
- `src/devlog/card.js` — カードMesh（ShaderMaterial）
- `src/devlog/zoom.js` — ズームアニメーション

### インタラクション

- ホイール/タッチ: スクロール
- クリック/タップ: カード選択→ズームイン + 右パネル詳細表示
- Esc/背景クリック: ズームアウト

---

## 4. GitHub Actions

push to main → sessions.json 自動更新（自己ループ防止付き）

---

## 5. フェーズ計画

| Phase | 内容 | 状態 |
|-------|------|------|
| 0 | git log → sessions.json | ✓ 本コミット |
| 1 | Three.js グリッド表示 | ✓ 本コミット |
| 2 | ズーム + 詳細overlay | ✓ 本コミット |
| 3 | Gemini テクスチャ生成 | 未着手 |
| 4 | 複数リポジトリ統合ビュー | 未着手 |
