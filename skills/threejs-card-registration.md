# threejs-card-registration.md — THREE.JSカード登録スキル

## Role
kesson-space の THREE.JS カードを追加・更新するときに、画像・リンク・ページ形式を一貫して登録する。

## Scope
- `assets/creation-cards.json`
- `assets/images/*.jpg`
- `threejs/*.html`
- `src/pages/creation-cards-section.js`（並び仕様の参照）

## Mandatory Rules
1. カードのリンク先ページは `threejs/01consciousness.html` と同じページ構成で作る。
2. 新規ページは `threejs/NN*.html` 形式で作成する（例: `threejs/02wavefield.html`）。
3. カード画像はリンク先ページのスクリーンショットを使う（流用画像を使わない）。
4. サムネイル画像は 16:9（推奨 1600x900）で保存する。
5. `assets/creation-cards.json` の `path` と `thumbnail` は必ず実在ファイルに合わせる。
6. カード並びは「日付の新しい順、同日なら番号の大きい順」で表示されるため、新規カードには `date`（`YYYY-MM-DD`）を付与する。

## Page Format Contract (`01*.html` 準拠)
1. `threejs/01consciousness.html` をコピーして新規ページを作る。
2. 以下の主要構造は維持する。
- `#canvas-container`
- `#interaction-layer`
- `.hero-section`
- `.main-content`
- `importmap`（`three` / `three/addons/`）
- 末尾の `type="module"` による Three.js 初期化ブロック
3. 変更してよいのは、タイトル・本文・配色・シェーダー表現・補助説明。
4. 変更してはいけないのは、上記主要構造の削除やID名変更。

## Registration Flow
1. 新規ページ作成。
```bash
cp threejs/01consciousness.html threejs/NN<slug>.html
```
2. ローカル起動。
```bash
./serve.sh
# http://localhost:3001/
```
3. ページスクショ取得（16:9）。
```bash
node --input-type=module <<'EOS'
import puppeteer from 'puppeteer';

const url = 'http://127.0.0.1:3001/threejs/NN<slug>.html';
const out = 'assets/images/<slug>-static.jpg';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 5000));
  await page.screenshot({ path: out, type: 'jpeg', quality: 92, fullPage: false });
} finally {
  await browser.close();
}
EOS
```
4. カード情報を `assets/creation-cards.json` に追加。
```json
"creation-card-NN": {
  "status": "published",
  "date": "2026-03-01",
  "path": "./threejs/NN<slug>.html",
  "thumbnail": "./assets/images/<slug>-static.jpg",
  "label_ja": "NN タイトル",
  "label_en": "NN Title",
  "description_ja": "説明",
  "description_en": "Description"
}
```
5. 動作確認。
```bash
curl -I http://localhost:3001/threejs/NN<slug>.html
```

## Definition Of Done
1. THREE.JS カードに新画像が表示される。
2. カードクリックで `threejs/NN*.html` が開く。
3. main 表示と offcanvas 表示の両方で同じ画像・リンクが使われる。
4. 並び順が「日付降順、同日なら番号降順」になっている。
