# pjdhiro JSON API 技術検証レポート

**調査日**: 2026-02-16  
**調査方法**: ChatGPT (GPT) に技術質問 → DT + Claude (書類管理) で吟味  
**ステータス**: ✅ 技術的に可能。実装方式確定。

---

## 結論

pjdhiro (Jekyll + Minimal Mistakes + GitHub Pages) から、特定タグ/カテゴリの記事を JSON で出力し、kesson-space から fetch で取得することは**技術的に可能**。

---

## 1. 調査結果サマリ

| 項目 | 結論 |
|------|------|
| Jekyll Liquid で JSON 出力 | ✅ 可能。front matter 付き `.json` ファイル |
| `_pages` を `site.pages` で取得 | ✅ 可能。`include: [_pages]` が設定済み |
| OR 条件フィルタ | ⚠️ `where_exp` の OR は Jekyll 4 専用。**loop+push 方式**を使用 |
| CORS | ✅ 問題なし。同一オリジン (`uminomae.github.io`) |
| GitHub Pages 制約 | ✅ カスタムプラグイン不要。標準 Liquid で完結 |

---

## 2. 決定事項

### 2-1. 配置場所

**`api/kesson-articles.json`（pjdhiro リポジトリのルート直下に `api/` ディレクトリ）**

- `_pages` 配下ではなくルート直下が推奨
- 理由: `_` 始まりディレクトリの `include` 挙動に依存しないため安全
- permalink: `/api/kesson-articles.json`

### 2-2. フィルタ方式

**loop + push 方式**（`where_exp` の OR 演算子を使わない）

- GitHub Pages は **Jekyll 3.10.0 / Liquid 4.0.4**
- `where_exp` の `or` は **Jekyll 4.0 以降**の機能
- loop + push は Jekyll 3 系でも確実に動作する

### 2-3. 公開 URL

```
https://uminomae.github.io/pjdhiro/api/kesson-articles.json
```

---

## 3. 吟味：ChatGPT 回答の検証ポイント

### ✅ 確認済み・問題なし

| ポイント | 判断 |
|----------|------|
| `jsonify` フィルタ | Jekyll 3.10 で利用可。JSON エスケープ処理として正しい |
| `forloop.last` で末尾カンマ制御 | 標準 Liquid 機能。問題なし |
| `strip_html` フィルタ | Jekyll 3.10 で利用可 |
| `date_to_xmlschema` | Jekyll 3.10 で利用可。ISO 8601 出力 |
| CORS 同一オリジン判定 | MDN 定義通り。scheme + host + port が一致 |

### ⚠️ 要検証（ローカル or GitHub Pages ビルドで確認必要）

| ポイント | リスク | 対処 |
|----------|--------|------|
| `doc.header.teaser`（ネストプロパティ） | Liquid のドットアクセスで nested hash に到達できるか | テンプレート内で `doc.header.teaser` → 動かなければ `doc.header["teaser"]` に変更 |
| `sort: "date", "last"` 第2引数 | Jekyll 3.10 で `last` パラメータが使えるか | 使えない場合、`nil` date の page がソート先頭に来る。`date` 未設定 page に date を追加する運用で回避 |
| `normalize_whitespace` フィルタ | Jekyll 3.10 での利用可否 | 使えない場合、`strip_newlines` に置換 |
| `doc.collection == "posts"` | pages は `doc.collection` が `nil` の可能性 | type 判定ロジックを `site.posts contains doc` に変更するか、フォールバック追加 |
| `absolute_url` フィルタ | `_config.yml` の `url` + `baseurl` が正しく設定されているか | 現状 `url: "https://uminomae.github.io"`, `baseurl: "/pjdhiro"` で OK |

### 💡 ChatGPT が触れなかった追加リスク

1. **GitHub Pages ビルドキャッシュ**: JSON ファイル更新後、CDN キャッシュで古い版が返る可能性
   - 対処: kesson-space 側で `fetch(url + '?t=' + Date.now())` キャッシュバスター、または `Cache-Control` ヘッダに依存
   
2. **pjdhiro の記事追加時に JSON が自動更新されるか**: Jekyll ビルドが走れば自動更新される。GitHub Pages は対象ブランチへの push でビルドが走るので問題なし

3. **JSON 出力の改行・空白**: Liquid テンプレートの `{%- -%}` （ハイフン付きタグ）で空白制御しているが、意図しない空白が入る可能性
   - 対処: kesson-space 側の `JSON.parse()` は空白に寛容なので実害は低い

---

## 4. Liquid テンプレート（確定版）

以下を pjdhiro リポジトリの `api/kesson-articles.json` に配置する。

```liquid
---
layout: null
permalink: /api/kesson-articles.json
sitemap: false
---

{% assign TAG_TARGET  = "欠損駆動思考" %}
{% assign CAT_KESSON   = "欠損駆動思考" %}
{% assign CAT_DESIGN   = "デザイン思考" %}
{% assign EMPTY_ARR    = "" | split: "" %}

{%- assign items = "" | split: "" -%}

{%- for doc in site.posts -%}
  {%- assign tags = doc.tags | default: EMPTY_ARR -%}
  {%- assign cats = doc.categories | default: EMPTY_ARR -%}
  {%- if tags contains TAG_TARGET or cats contains CAT_KESSON or cats contains CAT_DESIGN -%}
    {%- assign items = items | push: doc -%}
  {%- endif -%}
{%- endfor -%}

{%- for doc in site.pages -%}
  {%- assign tags = doc.tags | default: EMPTY_ARR -%}
  {%- assign cats = doc.categories | default: EMPTY_ARR -%}
  {%- if tags contains TAG_TARGET or cats contains CAT_KESSON or cats contains CAT_DESIGN -%}
    {%- assign items = items | push: doc -%}
  {%- endif -%}
{%- endfor -%}

{%- assign items = items | sort: "date", "last" | reverse -%}

[
{%- for doc in items -%}
  {%- if doc.collection == "posts" -%}
    {%- assign dtype = "post" -%}
  {%- else -%}
    {%- assign dtype = "page" -%}
  {%- endif -%}

  {%- assign raw_excerpt = doc.excerpt | default: doc.content | default: "" -%}
  {%- assign excerpt = raw_excerpt | strip_html | normalize_whitespace | strip | truncate: 200, "..." -%}

  {%- assign teaser = doc.header.teaser -%}
  {%- if teaser and teaser contains '://' -%}
    {%- assign teaser_url = teaser -%}
  {%- elsif teaser -%}
    {%- assign teaser_url = teaser | absolute_url -%}
  {%- else -%}
    {%- assign teaser_url = nil -%}
  {%- endif -%}

  {
    "type": {{ dtype | jsonify }},
    "title": {{ doc.title | default: "" | jsonify }},
    "url": {{ doc.url | absolute_url | jsonify }},
    "date": {{ doc.date | date_to_xmlschema | jsonify }},
    "excerpt": {{ excerpt | jsonify }},
    "tags": {{ doc.tags | default: EMPTY_ARR | jsonify }},
    "categories": {{ doc.categories | default: EMPTY_ARR | jsonify }},
    "teaser": {{ teaser_url | jsonify }}
  }{%- unless forloop.last -%},{%- endunless -%}
{%- endfor -%}
]
```

---

## 5. DT アクション

### 即時（T-040 ブロッカー解除）

1. 上記テンプレートを pjdhiro リポジトリに配置:
   ```
   pjdhiro/api/kesson-articles.json
   ```
2. `public-pjdhiro` ブランチに push
3. GitHub Pages ビルド完了後、以下にアクセスして JSON 出力を確認:
   ```
   https://uminomae.github.io/pjdhiro/api/kesson-articles.json
   ```
4. JSON が壊れている場合、§3 の「要検証」項目を一つずつ潰す

### 確認ポイント

- [ ] JSON が valid か（ブラウザで開いてパースエラーがないか）
- [ ] `teaser` が正しい URL になっているか（相対パス → absolute_url 変換）
- [ ] pages の `date` が null でソート順がおかしくないか
- [ ] excerpt に HTML タグが残っていないか

---

## 参照

- [Jekyll Directory Structure](https://jekyllrb.com/docs/structure/) — `_` 始まりディレクトリの扱い
- [GitHub Pages Dependency versions](https://pages.github.com/versions/) — Jekyll 3.10.0
- [Jekyll Liquid Filters](https://jekyllrb.com/docs/liquid/filters/) — jsonify, strip_html 等
- [MDN 同一オリジンポリシー](https://developer.mozilla.org/ja/docs/Web/Security/Defenses/Same-origin_policy) — CORS 判定
