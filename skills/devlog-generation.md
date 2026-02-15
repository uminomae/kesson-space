# devlog-generation.md — devlog記事・画像生成ワークフロー

## Role
コミット履歴からdevlogセッション記事とカバー画像を生成し、sessions.jsonを更新する。

---

## 現状の問題（2026-02-15時点）

### 壊れている箇所
1. **devlog.yml CI無効化**: sessions.json自動上書きが本番データ破壊を起こした
2. **generate-sessions.py**: 既存データをマージせず上書きする設計
3. **カバー画像生成**: 自動化されていない（手動でインフォグラフィック or AI生成）
4. **記事コンテンツ**: session-004/005がプレースホルダーのまま

### ファイル構成
```
scripts/
├── generate-sessions.py    # コミット履歴 → sessions.json
├── devlog-config.json      # セッション定義
assets/devlog/
├── sessions.json           # 本番データ（正本）
├── covers/                 # カバー画像
content/devlog/
├── session-XXX.md          # 記事Markdown
├── prompts/                # インフォグラフィック生成用HTML
```

---

## 修正プラン

### Phase A: 安全なsessions.json更新（P0）

**問題**: 上書きによるデータ消失

**解決**:
1. generate-sessions.pyをマージモードに修正
2. 既存エントリを保持し、新規のみ追加
3. 手動で追加したフィールド（cover, title_ja等）を上書きしない

**委譲先**: Codex（scripts/generate-sessions.py修正）

### Phase B: カバー画像生成の自動化（P1）

**現状**: 手動でインフォグラフィックHTMLをブラウザで開いてスクショ

**解決案**:
1. Puppeteer/Playwrightでスクリーンショット自動化
2. scripts/generate-covers.jsを新設
3. content/devlog/prompts/session-XXX-generator.html → PNG

**委譲先**: Claude Code（設計）→ Codex（実装）

### Phase C: 記事コンテンツ生成（P2）

**問題**: session-004/005がプレースホルダー

**解決**:
1. コミット履歴を分析してサマリー生成
2. DTが内容を確認・編集
3. content/devlog/session-XXX.md更新

**委譲先**: DT執筆 or Claude Code（下書き生成）

### Phase D: CI再有効化（P2）

**前提**: Phase A完了後

**解決**:
1. devlog.ymlを安全な形で再設計
2. sessions.jsonマージロジック適用
3. 自動トリガー復活（content/devlog変更時）

**委譲先**: Codex

---

## 委譲パターン

### Pattern 1: sessions.json修正（Codex向け）

```markdown
## Codex 指示書: T-039a

### 概要
generate-sessions.pyをマージモードに修正

### 対象
scripts/generate-sessions.py

### 変更内容
1. 既存のassets/devlog/sessions.jsonを読み込み
2. 新規セッションのみ追加
3. 既存エントリのcover, title_ja, title_en等は保持
4. end日時でソート（降順）

### テスト
python scripts/generate-sessions.py --dry-run
→ 既存データが消えていないことを確認
```

### Pattern 2: カバー画像生成（Claude Code向け）

```markdown
## Claude Code 指示書: T-039b

### 概要
Puppeteerでインフォグラフィック画像を自動生成

### 新規ファイル
scripts/generate-covers.js

### 処理
1. content/devlog/prompts/session-XXX-generator.html を検索
2. 各HTMLをheadless Chromeで開く
3. 1280x720でスクリーンショット
4. assets/devlog/covers/session-XXX.png に保存

### 依存
npm install puppeteer
```

### Pattern 3: 記事下書き生成（Claude Code向け）

```markdown
## Claude Code 指示書: T-039c

### 概要
コミット履歴からセッション記事の下書きを生成

### 入力
git log --oneline --since="2026-02-14" --until="2026-02-15"

### 出力
content/devlog/session-004.md（frontmatter + 本文）

### フォーマット
---
title_ja: "Part 4: [テーマ]"
title_en: "Part 4: [Theme]"  
date_range: "2026-02-14"
---

## 概要
[コミットサマリーから生成]

## 実装内容
- [コミット1の説明]
- [コミット2の説明]
```

---

## 実行手順（手動）

### 今すぐできること

1. **sessions.json手動更新**
   ```bash
   # assets/devlog/sessions.jsonを直接編集
   # 日付順（降順）になっているか確認
   ```

2. **カバー画像手動生成**
   ```bash
   # ブラウザで開く
   open content/devlog/prompts/session-004-generator.html
   # スクリーンショット → assets/devlog/covers/session-004.png
   ```

3. **記事手動執筆**
   ```bash
   # コミット履歴確認
   git log --oneline --since="2026-02-14" --until="2026-02-15"
   # content/devlog/session-004.md を編集
   ```

---

## チェックリスト

### devlog更新時
- [ ] sessions.jsonの順序が正しい（新しい順）
- [ ] 各セッションにcover, title_ja, title_en, date_range, end がある
- [ ] カバー画像が存在する（./assets/devlog/covers/session-XXX.png）
- [ ] content/devlog/session-XXX.md が存在する
- [ ] E2Eテスト: TC-E2E-12（整合性チェック）がパスする

### CI再有効化前
- [ ] generate-sessions.pyがマージモードになっている
- [ ] --dry-runで既存データが保持されることを確認
- [ ] devlog.ymlのトリガー条件が適切

---

## 関連ファイル

- `.github/workflows/devlog.yml` — CI（現在無効）
- `scripts/generate-sessions.py` — セッション生成スクリプト
- `scripts/devlog-config.json` — セッション定義
- `src/devlog/devlog.js` — フロントエンド表示
- `tests/e2e-runner.js` — TC-E2E-12整合性テスト
