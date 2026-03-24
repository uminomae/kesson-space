<!-- Ported from: creation-space (2026-03-24) -->
# コミットルール

## ブランチ戦略

| ブランチ | 用途 | 直接コミット |
|---|---|---|
| `main` | GitHub Pages 公開 | **禁止** |
| `develop` | 目視確認ゲート | マージのみ |
| `feature/*`, `claude/*` | 実装作業 | OK |
| `gemini-dev` | Gemini シェーダー実験 | OK |

## コミットメッセージ形式

```
{type}: {summary}

{body}

Co-Authored-By: Claude <noreply@anthropic.com>
```

### type 一覧

| type | 用途 |
|---|---|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `style` | 見た目のみの変更（CSS等） |
| `refactor` | 機能変更なしのリファクタ |
| `docs` | ドキュメント |
| `test` | テスト追加・修正 |
| `chore` | ビルド・CI・設定 |

## Push 前チェックリスト

1. `git status --short --branch` で差分確認
2. `git diff --stat` で変更量確認
3. `node tests/config-consistency.test.js` パス確認
4. Issue にコメント（SHA + 変更ファイル + テスト結果）
5. `git push origin <branch>`
