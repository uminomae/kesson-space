# devlog-writing スキル

## 目的
kesson-space の devlog を **JA/EN 両対応** で継続運用する。

## 文体ルール
- レポート調（事実ベース）
- 簡潔で再現可能な記述
- 小説調・主観過多は避ける

## 必須アウトプット
1. `content/devlog/session-NNN.md`（日本語本文）
2. `content/devlog/session-NNN.en.md`（英語本文）
3. `assets/devlog/sessions.json` へのエントリ追加/更新

## sessions.json 推奨構造
```json
{
  "id": "session-XXX",
  "title_ja": "Part X: ...",
  "title_en": "Part X: ...",
  "summary_en": "One-line English summary for devlog cards.",
  "date_range_ja": "2026-02-19",
  "date_range_en": "Feb 19, 2026",
  "cover_by_lang": {
    "ja": "./assets/devlog/covers/session-XXX.png",
    "en": "./assets/devlog/covers/session-XXX-en.svg"
  },
  "content_by_lang": {
    "ja": "./content/devlog/session-XXX.md",
    "en": "./content/devlog/session-XXX.en.md"
  }
}
```

## フォールバック方針
- `content_by_lang.en` 未整備時: `ja` 本文を表示
- `title_en` / `date_range_en` 未整備時: `ja` を表示
- `summary_en` 未整備時: 英語カードのサマリーは表示しない
- `cover_en` / `cover_by_lang.en` 未整備時: `default.svg` を表示

## 本文構成（JA/EN 共通）
1. Overview / 概要
2. Work Completed / 実施内容
3. Technical Decisions / 技術的決定
4. Risks or Next Steps / 課題と次アクション

## 作業手順
1. 日本語本文を先に作成（事実整理）
2. 英語本文を作成（直訳ではなく意味一致）
3. sessions.json の ja/en キーを更新
4. カバー画像パスを ja/en で設定
5. 初期 EN カバー自動生成（必要時）: `npm run devlog:covers:en`
6. 検証を実行: `npm run devlog:validate`
   - パス規約に揃える場合: `npm run devlog:covers:en -- --sync-paths`
7. 表示確認: `devlog.html?id=session-XXX&lang=en`

## 完了条件
- JA/EN の本文パスが sessions.json と一致
- `npm run devlog:validate` が error 0
- 英語表示で日本語のみ要素が残らない（未翻訳カバーは default.svg で明示的フォールバック）
