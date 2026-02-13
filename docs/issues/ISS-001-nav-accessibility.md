# ISS-001: ナビゲーションリンクのアクセシビリティ改善

**作成日**: 2026-02-15
**重大度**: 🔴 HIGH
**カテゴリ**: アクセシビリティ / UX / テスト
**影響範囲**: ナビゲーションオーブ、E2Eテスト、キーボード操作

---

## 問題の概要

現在のナビゲーションオーブは**視覚的には「クリックできそう」だが、実際にはキーボードアクセス不可**という致命的なアクセシビリティ問題を抱えている。

HTMLラベルが `pointer-events: none` に設定されており、ユーザーが見ているテキストは**実際のクリックターゲットではない**。実際のクリック判定は背後の透明なThree.jsスプライトに依存している。

---

## 現状のリンク実装マップ

| 要素 | HTML設定 | JS設定 | クリック可能 | キーボード可 | WCAG適合 | 問題 |
|------|---------|--------|------------|-------------|---------|------|
| h1→ブログ | ✅ `<a href>` | - | ✅ | ✅ | ✅ | なし |
| 言語トグル | ✅ `<button>` | ✅ click | ✅ | ✅ | ⚠️ | aria不足 |
| 浮上ボタン | ✅ `<button>` | ✅ scroll | ✅ | ✅ | ⚠️ | aria不足 |
| **ナビオーブ** | ❌ **div only** | ✅ Raycaster | ⚠️ **3Dのみ** | ❌ | ❌ | **致命的** |
| クレジット | ❌ なし | - | ❌ | ❌ | N/A | 無害 |

---

## 4エージェント分析結果

### 🔍 Agent-R (Review): バグ検出

**CRITICAL BUG #1: HTMLラベルが非クリック**

```css
/* nav-objects.js line 442 */
.nav-label {
    pointer-events: none;  /* ← 🚨 ユーザーが見えるテキストがクリック不可 */
}
```

**影響**:
- ユーザーは「一般向け」「設計者向け」というテキストを見る
- テキストをクリックしても何も起こらない
- 実際のクリックターゲットは背後の**透明な**Three.jsスプライト
- これはUXの根本的な裏切り

**BUG #2: Raycasterの信頼性問題**

```javascript
// navigation.js line 25-29
if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
    return;  // ドラッグ判定でクリック無効化
}
```

- OrbitControlsとの競合でクリック失敗の可能性
- モバイルでのタッチ精度問題
- デバッグが困難

**BUG #3: アクセシビリティ法令違反リスク**

- WCAG 2.1 Level A: キーボードアクセス必須 → **不適合**
- Section 508準拠が必要な組織では使用不可
- 公共サイトでの使用は法的リスク

---

### 🔧 Agent-F (Refactor): 構造改善

**アンチパターン検出**

現在の実装は「見た目優先・機能後回し」の典型例：

```
Three.js (視覚)      ← 浮遊する光
Raycaster (判定)     ← 透明なヒットボックス
HTML div (ラベル)    ← pointer-events: none (装飾のみ)
```

**推奨アーキテクチャ**

```
HTML <button> (インタラクション主体) ← ユーザーが見て触る
CSS position (配置)                  ← 3Dオブジェクトに重ねる
Three.js (視覚装飾)                  ← 背景エフェクトとして
```

**保守性の問題**:
- Raycasterのデバッグは困難
- モバイルテストの再現性が低い
- アクセシビリティ修正のコストが高い

---

### 🧪 Agent-T (Test): テスタビリティ

**現在のE2Eテストの限界**

```javascript
// e2e-runner.js TC-05
assert('05-2', 'PDF種別ラベルがページ内に存在', hasPdfLabels, ...);
warn('05-3', 'オーブ視認確認はスクリーンショットで実施', ...);
```

**問題**: 「ラベルが存在する」だけで**クリック可能性を検証していない**

**提案したTC-09の問題点**

```javascript
// 提案コード（動作しない）
const navLabel = qs('[class*="nav-label"]');
navLabel.click();  // ← pointer-events: none なので何も起こらない
await wait(300);
const viewer = qs('#pdf-viewer');
assert('09-3b', 'ビューアーが表示', viewer && visible);  // ← FAIL
```

**テスト可能な実装の条件**:
1. DOM要素が実際のクリックターゲット
2. `tabIndex`, `role`, `aria-label`が設定されている
3. キーボードイベントがテスト可能
4. Raycasterに依存しない

---

### 📋 Agent-Q (Quality): ドキュメント整合性

**設計書との矛盾**

**CONCEPT.md**:
```markdown
## 体験の流れ
5. **クリック**: 水面を通過し、存在の現前（詳細ページ）へ降りる
```
→ 「クリック」と明記されているが、実際には「Three.jsオブジェクトの正確なポインティング」が必要

**README.md §8**:
```markdown
| カテゴリ | 検証内容 |
| ナビ | 鬼火オーブが表示され、クリックでPDFビューアーが開くか |
```
→ 「クリック」としか書いていないが、アクセシビリティは未定義

**品質基準の欠如**:
- WCAGレベルの目標設定なし
- キーボードナビゲーション要件なし
- モバイルタップエリアの最小サイズ規定なし（WCAG推奨44×44px）

---

## 推奨される修正

### Phase 1: 緊急修正（即座に実施可能）

#### 1.1 nav-objects.js の修正

**変更箇所1: createHtmlLabel 関数**

```javascript
// BEFORE
function createHtmlLabel(text, extraClass) {
    const el = document.createElement('div');
    el.className = 'nav-label' + (extraClass ? ' ' + extraClass : '');
    el.textContent = text;
    document.body.appendChild(el);
    return el;
}

// AFTER
function createHtmlLabel(text, extraClass, url, isExternal) {
    const btn = document.createElement('button');
    btn.className = 'nav-label' + (extraClass ? ' ' + extraClass : '');
    btn.textContent = text;
    btn.tabIndex = 0;
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', `${text}のPDFを開く`);
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isExternal) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            import('./viewer.js').then(({ openPdfViewer }) => {
                openPdfViewer(url, text);
            });
        }
    });
    
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
        }
    });
    
    document.body.appendChild(btn);
    return btn;
}
```

**変更箇所2: createNavObjects 関数**

```javascript
// BEFORE (line 491付近)
_labelElements.push(createHtmlLabel(navItem.label));

// AFTER
_labelElements.push(
    createHtmlLabel(navItem.label, '', navItem.url, false)
);
```

**変更箇所3: Gemラベル生成 (line 503付近)**

```javascript
// BEFORE
_gemLabelElement = createHtmlLabel(gemData.label, 'nav-label--gem');

// AFTER
_gemLabelElement = createHtmlLabel(
    gemData.label, 
    'nav-label--gem', 
    gemData.url, 
    true  // external
);
```

#### 1.2 CSSの修正

**変更箇所: injectNavLabelStyles 関数 (line 436付近)**

```css
/* BEFORE */
.nav-label {
    position: fixed;
    z-index: 15;
    pointer-events: none;  /* ← 削除 */
    color: rgba(255, 255, 255, 0.9);
    /* ... */
}

/* AFTER */
.nav-label {
    position: fixed;
    z-index: 15;
    pointer-events: auto;  /* ← 変更 */
    cursor: pointer;       /* ← 追加 */
    background: none;      /* ← 追加 */
    border: none;          /* ← 追加 */
    padding: 0;            /* ← 追加 */
    color: rgba(255, 255, 255, 0.9);
    font-family: "Sawarabi Mincho", "Yu Mincho", "Hiragino Mincho ProN", serif;
    font-size: clamp(0.45rem, 2.8vmin, 1.1rem);
    letter-spacing: clamp(0.05em, 0.4vmin, 0.15em);
    text-shadow: 0 0 12px rgba(100, 150, 255, 0.5), 0 0 4px rgba(0, 0, 0, 0.8);
    transform: translate(-50%, -100%);
    white-space: nowrap;
    transition: filter 0.15s ease, opacity 0.3s ease;
    will-change: filter;
}

/* ← 追加 */
.nav-label:focus {
    outline: 2px solid rgba(100, 150, 255, 0.8);
    outline-offset: 4px;
    filter: blur(0px) !important;
}

.nav-label:hover {
    filter: blur(0px);
    color: rgba(255, 255, 255, 1.0);
}

.nav-label--gem {
    color: rgba(180, 195, 240, 0.85);
    text-shadow: 0 0 12px rgba(123, 143, 232, 0.5), 0 0 4px rgba(0, 0, 0, 0.8);
}
```

#### 1.3 lang-toggle.js の修正（aria追加）

```javascript
// AFTER (line 28付近)
btn.setAttribute('role', 'button');
btn.setAttribute('aria-label', lang === 'ja' ? '言語を英語に切り替え' : 'Switch language to Japanese');
```

#### 1.4 index.html の修正（浮上ボタンaria追加）

```html
<!-- BEFORE -->
<button id="surface-btn">↑ surface</button>

<!-- AFTER -->
<button id="surface-btn" aria-label="ページ上部に戻る">↑ surface</button>
```

---

### Phase 2: E2Eテスト追加

**tests/e2e-runner.js に TC-09 を追加**

```javascript
// ============================
// TC-E2E-09: リンク機能検証
// ============================

async function tc09_links() {
    // 09-1: h1リンクが有効なURL
    const h1Link = qs('#title-h1')?.closest('a');
    if (h1Link) {
        const href = h1Link.href;
        assert('09-1', 'h1リンクが有効なURL', 
            href.startsWith('http'), 
            href);
        
        const isClickable = href !== '#' && href !== '';
        assert('09-2', 'h1リンクがクリック可能',
            isClickable,
            `href="${href}"`);
    }
    
    // 09-3: ナビオーブのHTMLボタンクリック→PDFビューアー表示
    const navButtons = qsa('button.nav-label');
    if (navButtons.length > 0) {
        const firstBtn = navButtons[0];
        
        // tabIndex確認
        assert('09-3a', 'ナビボタンにtabIndex設定',
            firstBtn.tabIndex === 0,
            `tabIndex=${firstBtn.tabIndex}`);
        
        // aria-label確認
        const ariaLabel = firstBtn.getAttribute('aria-label');
        assert('09-3b', 'ナビボタンにaria-label設定',
            !!ariaLabel && ariaLabel.includes('PDF'),
            ariaLabel || 'なし');
        
        // クリック→ビューアー表示
        let viewer = qs('#kesson-viewer');
        const initialVisible = viewer?.classList.contains('visible');
        
        firstBtn.click();
        await wait(800);
        
        viewer = qs('#kesson-viewer');
        const nowVisible = viewer?.classList.contains('visible');
        assert('09-3c', 'クリックでビューアーが表示',
            !initialVisible && nowVisible,
            nowVisible ? 'ビューアー表示' : 'ビューアー未表示');
        
        // ビューアーを閉じる
        const closeBtn = viewer?.querySelector('.viewer-close');
        if (closeBtn) {
            closeBtn.click();
            await wait(600);
        }
    } else {
        warn('09-3', 'ナビボタンが見つからない（初期化タイミングの可能性）');
    }
    
    // 09-4: 言語トグルの機能
    const toggle = qs('#lang-toggle');
    if (toggle) {
        const ariaLabel = toggle.getAttribute('aria-label');
        assert('09-4a', '言語トグルにaria-label設定',
            !!ariaLabel,
            ariaLabel || 'なし');
        
        const beforeLang = document.documentElement.lang;
        toggle.click();
        await wait(500);
        const afterLang = document.documentElement.lang;
        assert('09-4b', '言語トグルが機能',
            beforeLang !== afterLang,
            `${beforeLang} → ${afterLang}`);
    }
    
    // 09-5: 浮上ボタン
    const surfaceBtn = qs('#surface-btn');
    if (surfaceBtn) {
        const ariaLabel = surfaceBtn.getAttribute('aria-label');
        assert('09-5', '浮上ボタンにaria-label設定',
            !!ariaLabel,
            ariaLabel || 'なし');
    }
}

// ============================
// TC-E2E-10: キーボードナビゲーション
// ============================

async function tc10_keyboard() {
    // 10-1: フォーカス可能要素のカウント
    const focusable = qsa('a, button, [tabindex]:not([tabindex="-1"])');
    assert('10-1', 'フォーカス可能要素が存在',
        focusable.length >= 5, // h1リンク + 3ナビ + トグル
        `${focusable.length} 要素`);
    
    // 10-2: Tab順序の検証
    const firstFocusable = focusable[0];
    firstFocusable.focus();
    assert('10-2', '最初の要素にフォーカス可能',
        document.activeElement === firstFocusable,
        firstFocusable.tagName);
    
    // 10-3: ナビボタンにEnterでビューアー起動
    const navButton = qs('button.nav-label');
    if (navButton) {
        navButton.focus();
        assert('10-3a', 'ナビボタンにフォーカス可能',
            document.activeElement === navButton,
            'フォーカス成功');
        
        const enterEvent = new KeyboardEvent('keydown', { 
            key: 'Enter',
            bubbles: true,
            cancelable: true
        });
        navButton.dispatchEvent(enterEvent);
        await wait(800);
        
        const viewer = qs('#kesson-viewer');
        const visible = viewer?.classList.contains('visible');
        assert('10-3b', 'Enterキーでビューアー起動',
            visible,
            visible ? 'ビューアー表示' : '未表示');
        
        // 閉じる
        const closeBtn = viewer?.querySelector('.viewer-close');
        if (closeBtn) {
            closeBtn.click();
            await wait(600);
        }
    }
}
```

**testMap に追加**

```javascript
const testMap = {
    'TC-E2E-01': tc01_webgl,
    'TC-E2E-02': tc02_ui,
    'TC-E2E-03': tc03_lang,
    'TC-E2E-04': tc04_console,
    'TC-E2E-05': tc05_nav,
    'TC-E2E-06': tc06_scroll,
    'TC-E2E-07': tc07_dev,
    'TC-E2E-08': tc08_perf,
    'TC-E2E-09': tc09_links,      // ← 追加
    'TC-E2E-10': tc10_keyboard,   // ← 追加
};
```

---

### Phase 3: ドキュメント更新

#### 3.1 tests/e2e-test-design.md 更新

**追加セクション**:

```markdown
### TC-E2E-09: リンク機能検証

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 09-1 | h1リンクが有効なURL | `javascript_tool` | href starts with http |
| 09-2 | h1リンクがクリック可能 | `javascript_tool` | href !== '#' |
| 09-3a | ナビボタンにtabIndex設定 | `javascript_tool` | tabIndex === 0 |
| 09-3b | ナビボタンにaria-label設定 | `javascript_tool` | aria-label contains 'PDF' |
| 09-3c | クリックでビューアー表示 | `javascript_tool` | viewer.classList.contains('visible') |
| 09-4a | 言語トグルにaria-label設定 | `javascript_tool` | aria-label exists |
| 09-4b | 言語トグルが機能 | `javascript_tool` | lang changes |
| 09-5 | 浮上ボタンにaria-label設定 | `javascript_tool` | aria-label exists |

### TC-E2E-10: キーボードナビゲーション

| # | 検証項目 | 判定方法 | 期待値 |
|---|---------|---------|--------|
| 10-1 | フォーカス可能要素が存在 | `javascript_tool` | count >= 5 |
| 10-2 | 最初の要素にフォーカス可能 | `javascript_tool` | activeElement === first |
| 10-3a | ナビボタンにフォーカス可能 | `javascript_tool` | focus() succeeds |
| 10-3b | Enterキーでビューアー起動 | `javascript_tool` + KeyboardEvent | viewer visible |
```

#### 3.2 README.md §8 更新

```markdown
### Chromeベーステスト（実装済み）

| カテゴリ | 検証内容 |
|----------|----------|
| 描画 | ページロード後にcanvasが描画されているか |
| ナビ | 鬼火オーブが表示され、**HTMLボタン経由で**クリック/キーボードアクセス可能か |
| リンク | h1・言語トグル・浮上ボタンの機能とaria-label設定 |
| キーボード | Tab移動・Enter/Spaceキーでのアクティベーション |
| UI | タイトル・クレジット・言語トグルが表示されるか |
| 言語 | `?lang=en` で英語切替が動作するか |
| モバイル | レスポンシブ表示、タッチ操作 |
| コンソール | JSエラーがないか |
| パフォーマンス | 極端なフレーム落ちがないか |

**アクセシビリティ基準**: WCAG 2.1 Level A準拠を目標
```

#### 3.3 CONCEPT.md 更新（表現の調整）

```markdown
## 体験の流れ

1. **入場**: 上空から闇を見下ろす
2. **感じる**: 空間全体が呼吸している（L0）
3. **見える**: 闇から光が滲み出る（L1→L2→L3）
4. **近づく**: 光の色と動きを観察
5. **インタラクション**: 水面を通過し、存在の現前（詳細ページ）へ降りる
   - マウス/タッチ: オーブまたはラベルをクリック
   - キーボード: Tabでフォーカス→Enter/Spaceで選択
```

---

## 実装チェックリスト

### Phase 1: コード修正

- [ ] `src/nav-objects.js`: createHtmlLabel関数を`<button>`に変更
- [ ] `src/nav-objects.js`: createNavObjects内の呼び出しにurl/external引数追加
- [ ] `src/nav-objects.js`: CSS `.nav-label` の pointer-events を auto に変更
- [ ] `src/nav-objects.js`: CSS focus/hover スタイル追加
- [ ] `src/lang-toggle.js`: aria-label 追加
- [ ] `index.html`: 浮上ボタンに aria-label 追加

### Phase 2: テスト

- [ ] `tests/e2e-runner.js`: tc09_links 関数追加
- [ ] `tests/e2e-runner.js`: tc10_keyboard 関数追加
- [ ] `tests/e2e-runner.js`: testMap に TC-09, TC-10 追加
- [ ] ローカル実行: `http://localhost:3001` で手動確認
- [ ] Claude in Chrome MCP でテスト実行
- [ ] スクリーンショット取得

### Phase 3: ドキュメント

- [ ] `tests/e2e-test-design.md`: TC-09, TC-10 セクション追加
- [ ] `docs/README.md`: §8 アクセシビリティ基準追記
- [ ] `docs/CONCEPT.md`: §体験の流れ を「インタラクション」に変更
- [ ] `docs/CURRENT.md`: セッション#11として記録

### Phase 4: デプロイ・検証

- [ ] GitHub Pages デプロイ
- [ ] ライブサイトでキーボードテスト（Tab, Enter, Space）
- [ ] モバイルでタップテスト
- [ ] スクリーンリーダーで読み上げ確認（可能なら）

---

## 期待される効果

### Before（現状）

```
ユーザー視点:
❌ 「一般向け」というテキストが見えるがクリックできない
❌ どこをクリックすればいいか不明確
❌ キーボードでアクセスできない
❌ スクリーンリーダー非対応

技術者視点:
❌ E2Eテストでクリック機能を検証できない
❌ アクセシビリティツールでエラー検出
❌ WCAG準拠を証明できない
```

### After（修正後）

```
ユーザー視点:
✅ 見えるテキストがそのままクリックできる
✅ Tabキーでフォーカス、Enter/Spaceで選択
✅ フォーカス時に視覚的フィードバック
✅ aria-labelでスクリーンリーダー対応

技術者視点:
✅ E2Eテストで完全自動検証可能
✅ WCAG 2.1 Level A準拠
✅ アクセシビリティツールでエラーなし
✅ 保守性・テスタビリティ向上
```

---

## 参考資料

- [WCAG 2.1 - Guideline 2.1 Keyboard Accessible](https://www.w3.org/WAI/WCAG21/quickref/#keyboard-accessible)
- [MDN: ARIA button role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role)
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)

---

## メモ

- Raycasterによる3Dクリック判定は**装飾的な補助機能**として残す
- HTMLボタンが主要なインタラクション手段となる
- 3DオブジェクトとHTMLボタンの両方がクリック可能（冗長性確保）
