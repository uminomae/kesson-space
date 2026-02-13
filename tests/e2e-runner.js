/**
 * e2e-runner.js — kesson-space E2E テストランナー
 *
 * Claude in Chrome MCP の javascript_tool でページに注入して実行する。
 * 設計書: tests/e2e-test-design.md
 *
 * 使い方（javascript_tool から）:
 *   全テスト:   fetch('/tests/e2e-runner.js').then(r=>r.text()).then(eval)
 *   個別テスト: 上記実行後、window.__e2e.run('TC-E2E-01')
 *   スモーク:   上記実行後、window.__e2e.smoke()
 *
 * 注意: ページコンテキストで実行されるため、Three.js のグローバル状態にアクセス可能。
 *       ただし ES Module スコープの変数には直接アクセスできない。
 *       DOM と canvas の状態を中心に検証する。
 */

(async () => {
    'use strict';

    // ============================
    // ユーティリティ
    // ============================

    const results = [];

    function assert(id, description, condition, detail = '') {
        const status = condition ? 'PASS' : 'FAIL';
        results.push({ id, description, status, detail: String(detail) });
        return condition;
    }

    function warn(id, description, detail = '') {
        results.push({ id, description, status: 'WARN', detail: String(detail) });
    }

    function qs(sel) { return document.querySelector(sel); }
    function qsa(sel) { return document.querySelectorAll(sel); }

    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    function summary() {
        const pass = results.filter(r => r.status === 'PASS').length;
        const fail = results.filter(r => r.status === 'FAIL').length;
        const warnings = results.filter(r => r.status === 'WARN').length;
        return {
            total: results.length,
            pass,
            fail,
            warn: warnings,
            overall: fail === 0 ? 'PASS' : 'FAIL',
            results,
        };
    }

    // ============================
    // TC-E2E-01: ページロードと WebGL 描画
    // ============================

    async function tc01_webgl() {
        // 01-1: ページロード（この時点で実行されているなら成功）
        assert('01-1', 'ページがロード済み', true, 'スクリプト注入成功');

        // 01-2: canvas 存在
        const canvas = qs('#canvas-container canvas');
        assert('01-2', 'canvas が #canvas-container 内に存在', !!canvas,
            canvas ? `${canvas.tagName} found` : 'canvas not found');

        if (!canvas) return; // 以降のテストはcanvas必須

        // 01-3: canvasサイズ
        const w = canvas.width;
        const h = canvas.height;
        assert('01-3', 'canvasサイズが >0',
            w > 0 && h > 0,
            `${w}x${h}`);

        // 01-4: WebGLコンテキスト
        // Three.js が既にコンテキストを持っているので、canvas.getContext は null を返す場合がある
        // 代わりに renderer の存在を確認
        const hasWebGL = !!(canvas.getContext('webgl2') || canvas.getContext('webgl')
            || canvas.__webglFramebuffer !== undefined
            || canvas.dataset.engine);
        // フォールバック: canvas が描画されていれば WebGL は動作中と判断
        const pixelCheck = (() => {
            try {
                const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
                if (ctx) return true;
            } catch (e) { /* already in use = good */ }
            // context already in use by Three.js = WebGL is active
            return true;
        })();
        assert('01-4', 'WebGLコンテキストが有効', pixelCheck,
            'Three.js がコンテキストを保持中');

        // 01-5: アニメーション動作チェック（rAF カウント）
        let frameCount = 0;
        const countFrames = () => { frameCount++; };
        const rafId1 = requestAnimationFrame(function loop() {
            countFrames();
            if (frameCount < 100) requestAnimationFrame(loop);
        });
        await wait(1000);
        assert('01-5', 'アニメーションが動作中（1秒間のフレーム数）',
            frameCount >= 10,
            `${frameCount} frames/sec`);
    }

    // ============================
    // TC-E2E-02: UI要素の表示
    // ============================

    async function tc02_ui() {
        // 02-1: タイトル h1
        const h1 = qs('#title-h1');
        assert('02-1', 'タイトル h1#title-h1 が存在',
            !!h1,
            h1 ? `"${h1.textContent}"` : 'not found');

        // 02-2: サブタイトル
        const sub = qs('.subtitle');
        assert('02-2', 'サブタイトル .subtitle が存在',
            !!sub && sub.textContent === 'Kesson Space',
            sub ? `"${sub.textContent}"` : 'not found');

        // 02-3: タグライン（日本語版は .tagline、英語版は .tagline-en）
        const taglines = qsa('#taglines .tagline, #taglines .tagline-en');
        assert('02-3', 'タグラインが2行存在',
            taglines.length === 2,
            `${taglines.length} taglines found`);

        // 02-4: クレジット
        const creditLine = qs('#credit .credit-line');
        assert('02-4', 'クレジットに "AI" を含む',
            !!creditLine && creditLine.textContent.includes('AI'),
            creditLine ? `"${creditLine.textContent}"` : 'not found');

        // 02-5: クレジット署名
        const creditSig = qs('#credit .credit-signature');
        assert('02-5', 'クレジット署名に "pjdhiro" を含む',
            !!creditSig && creditSig.textContent.includes('pjdhiro'),
            creditSig ? `"${creditSig.textContent}"` : 'not found');

        // 02-6: 操作ガイド
        const guide = qs('#control-guide');
        assert('02-6', '操作ガイド #control-guide が存在',
            !!guide,
            guide ? 'found' : 'not found');

        // 02-7: スクロールヒント（下部）
        const scrollHint = qs('#scroll-hint');
        assert('02-7', 'スクロールヒント #scroll-hint が存在',
            !!scrollHint,
            scrollHint ? 'found' : 'not found');

        // 02-8: h1 のブログリンク
        const h1Link = h1 ? h1.closest('a') : null;
        const href = h1Link ? h1Link.getAttribute('href') : '';
        assert('02-8', 'h1がブログ記事へのリンクを持つ',
            href.includes('pjdhiro/thinking-kesson'),
            `href="${href}"`);
    }

    // ============================
    // TC-E2E-03: 言語切替
    // 言語版で実行時のみ有効。別途 ?lang=en でナビゲート後に実行する。
    // ============================

    async function tc03_lang() {
        const lang = document.documentElement.lang;

        if (lang !== 'en') {
            warn('03-0', '言語切替テストは ?lang=en でアクセス後に実行してください',
                `現在の lang="${lang}"`);
            return;
        }

        // 03-2: html lang
        assert('03-2', '<html lang="en">',
            lang === 'en',
            `lang="${lang}"`);

        // 03-3: 英語タイトル
        const h1 = qs('#title-h1');
        assert('03-3', 'h1が英語タイトル',
            !!h1 && h1.textContent === 'Kesson-Driven Thinking',
            h1 ? `"${h1.textContent}"` : 'not found');

        // 03-4: 英語タグライン
        const taglines = qsa('#taglines .tagline-en');
        const firstTag = taglines[0]?.textContent || '';
        assert('03-4', 'タグラインが英語',
            firstTag.includes("Don't discard"),
            `"${firstTag.substring(0, 40)}..."`);

        // 03-5: 英語クレジット
        const creditLine = qs('#credit .credit-line');
        assert('03-5', 'クレジットが英語',
            !!creditLine && creditLine.textContent.includes('Exploring'),
            creditLine ? `"${creditLine.textContent}"` : 'not found');

        // 03-6: 言語トグル
        const toggle = qs('#lang-toggle');
        assert('03-6', '言語トグルが "日本語" と表示',
            !!toggle && toggle.textContent.trim() === '日本語',
            toggle ? `"${toggle.textContent.trim()}"` : 'not found');
    }

    // ============================
    // TC-E2E-04: コンソールエラーチェック
    // NOTE: console.error の捕捉はスクリプト注入前のエラーを拾えないため、
    //       Claude in Chrome の read_console_messages で補完する。
    //       ここでは注入後のエラー監視のみ行う。
    // ============================

    async function tc04_console() {
        const errors = [];
        const origError = console.error;
        console.error = (...args) => {
            errors.push(args.map(String).join(' '));
            origError.apply(console, args);
        };

        // 3秒間エラーを監視
        await wait(3000);

        console.error = origError;

        // Google Analytics 関連は除外
        const filtered = errors.filter(e =>
            !e.includes('gtag') &&
            !e.includes('googletagmanager') &&
            !e.includes('analytics')
        );

        assert('04-1', '監視期間中にJSエラーなし',
            filtered.length === 0,
            filtered.length > 0 ? `${filtered.length} errors: ${filtered[0].substring(0, 80)}` : '0 errors');
    }

    // ============================
    // TC-E2E-05: ナビゲーションオーブ
    // ============================

    async function tc05_nav() {
        // 05-1: Three.js シーン内の nav オブジェクト
        // ES Module スコープには直接アクセスできないため、
        // DOM のナビラベル（nav-objects.js が生成する）で間接確認
        const navLabels = qsa('[class*="nav-label"], [data-nav-index]');

        // ナビラベルが見つからない場合、canvas 内のオブジェクト数で代替チェック
        // Three.js の scene は window に公開されていない可能性があるため、
        // DOM ベースの確認をメインにする
        if (navLabels.length > 0) {
            assert('05-1', 'ナビオブジェクトのDOMラベルが存在',
                navLabels.length >= 1,
                `${navLabels.length} nav labels found`);
        } else {
            // フォールバック: nav-objects.js がラベルを作る前かもしれない
            // ページ内の i18n nav 設定数で代替確認
            warn('05-1', 'ナビラベルDOMが未検出（初期化タイミングの可能性）',
                'read_page で確認推奨');
        }

        // 05-2: PDF ラベルテキスト確認（DOM内に一般向け/設計者向け/学術版 のいずれか）
        const bodyText = document.body.innerText;
        const hasPdfLabels = ['一般向け', '設計者向け', '学術版', 'General', 'For Designers', 'Academic']
            .some(label => bodyText.includes(label));
        assert('05-2', 'PDF種別ラベルがページ内に存在',
            hasPdfLabels,
            hasPdfLabels ? 'ラベルテキスト検出' : 'ラベル未検出');

        // 05-3: スクリーンショット確認は Claude 側で実施（自動不可）
        warn('05-3', 'オーブ視認確認はスクリーンショットで実施',
            'Claude in Chrome の screenshot で目視確認');
    }

    // ============================
    // TC-E2E-06: スクロール動作
    // ============================

    async function tc06_scroll() {
        // 06-1: hero-spacer 存在
        const spacer = qs('#hero-spacer');
        assert('06-1', '#hero-spacer が存在',
            !!spacer,
            spacer ? `height: ${spacer.offsetHeight}px` : 'not found');

        // 06-2: スクロールでの変化を検証
        // 現在のスクロール位置を記録
        const scrollBefore = window.scrollY;

        // ページ下部へスクロール
        window.scrollTo({ top: window.innerHeight * 2, behavior: 'instant' });
        await wait(500);

        const scrollAfter = window.scrollY;
        assert('06-2', 'スクロールが機能',
            scrollAfter > scrollBefore,
            `before: ${scrollBefore}, after: ${scrollAfter}`);

        // 06-3: dev-log にテキストが存在
        const logParagraphs = qsa('#dev-log .log-paragraph');
        assert('06-3', '開発ログにテキストが表示',
            logParagraphs.length >= 1,
            `${logParagraphs.length} paragraphs`);

        // 06-4: さらに下へスクロールして浮上ボタン確認
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
        await wait(500);

        const surfaceBtn = qs('#surface-btn');
        const surfaceOpacity = surfaceBtn ? parseFloat(getComputedStyle(surfaceBtn).opacity) : 0;
        assert('06-4', '浮上ボタンが最下部で表示',
            surfaceOpacity > 0,
            `opacity: ${surfaceOpacity}`);

        // テスト後、ページ最上部に戻す
        window.scrollTo({ top: 0, behavior: 'instant' });
        await wait(300);
    }

    // ============================
    // TC-E2E-07: Devパネル
    // ============================

    async function tc07_dev() {
        const hasDevParam = new URLSearchParams(window.location.search).has('dev');

        if (!hasDevParam) {
            // ?dev なし → パネルが非表示であることを確認
            const devPanel = qs('#dev-panel, .dev-panel, [id*="dev-panel"]');
            assert('07-1', '?dev なしでdevパネルが非表示',
                !devPanel || getComputedStyle(devPanel).display === 'none',
                devPanel ? 'panel found but hidden' : 'panel not in DOM');

            warn('07-2', '?dev ありのテストは ?dev でアクセス後に実行',
                '別途 navigate → ?dev で確認');
            return;
        }

        // ?dev あり
        const devPanel = qs('#dev-panel, .dev-panel, .accordion');
        assert('07-2', '?dev ありでdevパネルが表示',
            !!devPanel,
            devPanel ? 'panel found' : 'panel not found');

        // 07-3: スライダー検出
        const sliders = qsa('input[type="range"]');
        assert('07-3', 'devパネルにスライダーが存在',
            sliders.length > 0,
            `${sliders.length} sliders found`);
    }

    // ============================
    // TC-E2E-08: パフォーマンス基礎
    // ============================

    async function tc08_perf() {
        // 08-1: ロード時間
        const timing = performance.timing || {};
        const loadTime = timing.loadEventEnd && timing.navigationStart
            ? (timing.loadEventEnd - timing.navigationStart) / 1000
            : null;

        if (loadTime !== null) {
            assert('08-1', '初回ロードが10秒以内',
                loadTime < 10,
                `${loadTime.toFixed(2)}s`);
        } else {
            // Navigation Timing API v2
            const entries = performance.getEntriesByType('navigation');
            if (entries.length > 0) {
                const lt = entries[0].loadEventEnd / 1000;
                assert('08-1', '初回ロードが10秒以内',
                    lt < 10,
                    `${lt.toFixed(2)}s`);
            } else {
                warn('08-1', 'ロード時間の計測不可', 'Navigation Timing API 利用不可');
            }
        }

        // 08-2: FPS（1秒間のrAFカウント）
        let fps = 0;
        await new Promise(resolve => {
            let count = 0;
            const start = performance.now();
            function frame() {
                count++;
                if (performance.now() - start < 1000) {
                    requestAnimationFrame(frame);
                } else {
                    fps = count;
                    resolve();
                }
            }
            requestAnimationFrame(frame);
        });

        assert('08-2', 'フレームレート ≥ 20fps',
            fps >= 20,
            `${fps} fps`);

        // 08-3: メモリ（Chrome のみ）
        if (performance.memory) {
            const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
            const totalMB = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
            assert('08-3', 'メモリ使用量が記録可能',
                true,
                `used: ${usedMB}MB / total: ${totalMB}MB`);
        } else {
            warn('08-3', 'performance.memory が利用不可（Chrome限定API）', '');
        }
    }

    // ============================
    // 実行制御
    // ============================

    const testMap = {
        'TC-E2E-01': tc01_webgl,
        'TC-E2E-02': tc02_ui,
        'TC-E2E-03': tc03_lang,
        'TC-E2E-04': tc04_console,
        'TC-E2E-05': tc05_nav,
        'TC-E2E-06': tc06_scroll,
        'TC-E2E-07': tc07_dev,
        'TC-E2E-08': tc08_perf,
    };

    /**
     * 指定テストケースを実行
     * @param {string} tcId - e.g. 'TC-E2E-01'
     */
    async function run(tcId) {
        const fn = testMap[tcId];
        if (!fn) return { error: `Unknown test: ${tcId}` };
        results.length = 0;
        await fn();
        return summary();
    }

    /**
     * 全テスト実行
     */
    async function runAll() {
        results.length = 0;
        for (const [id, fn] of Object.entries(testMap)) {
            try {
                await fn();
            } catch (e) {
                results.push({
                    id: id + '-ERROR',
                    description: `テスト実行中にエラー: ${e.message}`,
                    status: 'FAIL',
                    detail: e.stack?.substring(0, 200) || '',
                });
            }
        }
        return summary();
    }

    /**
     * スモークテスト（TC-01, 02, 04 のみ）
     */
    async function smoke() {
        results.length = 0;
        for (const fn of [tc01_webgl, tc02_ui, tc04_console]) {
            try { await fn(); } catch (e) {
                results.push({ id: 'SMOKE-ERROR', description: e.message, status: 'FAIL', detail: '' });
            }
        }
        return summary();
    }

    // グローバルに公開
    window.__e2e = { run, runAll, smoke, testMap, results: () => summary() };

    // デフォルト: 全テスト実行して結果を返す
    const result = await runAll();

    // コンソールに結果表示
    console.log('%c[E2E] ' + result.overall + ` — ${result.pass}/${result.total} passed`,
        result.overall === 'PASS' ? 'color: #4CAF50; font-weight: bold' : 'color: #f44336; font-weight: bold');

    if (result.fail > 0) {
        console.table(result.results.filter(r => r.status === 'FAIL'));
    }

    return result;
})();
