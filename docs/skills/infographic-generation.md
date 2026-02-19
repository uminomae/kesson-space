# infographic-generation スキル

## 目的
devlog カバー画像を、英語運用に耐える形で生成・管理する。

## 基本方針
- **SVG-first**: まず SVG を正本として作る
- 必要なら PNG/JPG を派生物として作る
- JA/EN で画像テキストが異なる場合は `ja/en` を分離して管理する

## 推奨出力
- `assets/devlog/covers/session-NNN.svg`（日本語または言語非依存）
- `assets/devlog/covers/session-NNN-en.svg`（英語）

## 入力
- `content/devlog/session-NNN.md`
- `content/devlog/session-NNN.en.md`
- `assets/devlog/sessions.json` の対象エントリ

## Gemini 2.5 Pro 利用フロー
1. Gemini 2.5 Pro に JA/EN 本文を渡し、構成（タイムライン/要点）を抽出
2. SVG マークアップ生成を依頼（背景・配色・文字サイズを指定）
3. 出力SVGを `assets/devlog/covers/` に保存
4. `sessions.json` の `cover_by_lang` に反映

## Gemini 2.5 Pro プロンプト要点
- モデル: Gemini 2.5 Pro
- 出力形式: **純粋な SVG コードのみ**（説明文なし）
- 要件:
  - 16:9 レイアウト
  - ダークテーマ
  - 可読性優先（モバイル幅でも潰れない）
  - 英語版は英語テキストのみ

## 運用ルール
- 生成プロンプトは `content/devlog/prompts/session-NNN-prompt.md` に保存
- 画像内テキストが日本語のみの場合、英語表示では `default.svg` フォールバックを許容
- 英語運用を強化する場合は `session-NNN-en.svg` を必須化する

## 自動検証
- `npm run devlog:covers:en`
  - `cover_by_lang.en` 未設定時に `session-NNN-en.svg` を自動作成
- `npm run devlog:validate`
  - `content_by_lang` の存在
  - `title_ja/title_en` や `date_range_ja/date_range_en` の欠落
  - cover path の欠落（ENカバー未整備は warning）
