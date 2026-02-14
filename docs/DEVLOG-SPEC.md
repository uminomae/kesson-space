# DEVLOG-SPEC — Devlog Gallery 仕様書

**バージョン**: 1.1
**更新日**: 2026-02-15

---

## 0. コンセプト

コミットログを「写真アルバム」として体験する3D空間。
意味的なまとまりでセッションを区切り、各セッションをカードとしてInstagram風グリッドに配置。
kesson-spaceの闘の中に浮かぶ光のカード群。選択するとズームイン。

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

### 2.1 エントリ生成ルール

| 項目 | 値 | 説明 |
|------|-----|------|
| **最小単位** | 1日 | どんなに多くても1日未満では分割しない |
| **標準** | 2〜3日 | 通常のまとまり |
| **最大** | 7日 | 超えたら強制分割 |
| **統合条件** | コミット<10/区間 | 薄い期間は前後と統合 |
| **分割条件** | コミット>50/区間 | 濃すぎたら日で分割検討 |

### 2.2 除外フィルタ

以下のコミットはエントリ集計から除外:

| パターン | 例 |
|---------|-----|
| typo/誤字修正 | `fix: typo`, `fix typo`, `誤字修正` |
| リンク追加のみ | `add link`, `リンク追加` |
| フォーマット調整 | `style:`, `format:`, `lint` |
| マージコミット | `Merge branch`, `Merge pull request` |
| 変更行数が極小 | insertions + deletions < 10 |

### 2.3 判断フロー（GitHub Actions週1回）

```
1. 前回エントリ以降のコミット取得
2. 除外フィルタ適用
   - メッセージパターン (typo, link, style, Merge)
   - 変更行数 < 10
3. 残ったコミットを日ごとにグループ化
4. 2〜3日単位で区切りを試行
5. 各区間のコミット数チェック
   - 10未満/区間 → 隣と統合
   - 50超/区間 → 分割検討
6. 最終的なエントリ境界確定
7. sessions.json + content/devlog/*.md 生成
```

### 2.4 ファイル対応関係

```
assets/devlog/
├── sessions.json           ← メタデータ索引
└── covers/
    ├── session-001.svg     ← カバー画像
    └── session-002.svg

content/devlog/
├── session-001.md          ← 本文（日本語）
└── session-002.md
```

命名規則: `session-{NNN}` で紐付け

### 2.5 sessions.json スキーマ

各セッション:
- id, repo, start, end, duration_min
- commit_count, files_changed, insertions, deletions
- dominant_category, color, messages
- intensity, texture_url
- narrative: { ja: {...}, en: {...} }

### 2.6 カテゴリ分類

| パターン | カテゴリ | 色 |
|---------|---------|-----|
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

### トリガー

- 週1回（日曜深夜）
- 手動dispatch

### 処理

1. git log取得（前回エントリ以降）
2. 判断フロー実行
3. sessions.json更新
4. content/devlog/*.md生成（テンプレートから）
5. 自己ループ防止: `[skip ci]` or 専用botアカウント

---

## 5. フェーズ計画

| Phase | 内容 | 状態 |
|-------|------|------|
| 0 | git log → sessions.json | ✓ 完了 |
| 1 | Three.js グリッド表示 | ✓ 完了 |
| 2 | ズーム + 詳細overlay | ✓ 完了 |
| 3 | エントリ生成ルール策定 | ✓ 本コミット |
| 4 | GitHub Actions自動化 | 未着手 |
| 5 | カバー画像自動生成 | 未着手 |
| 6 | 複数リポジトリ統合ビュー | 未着手 |
