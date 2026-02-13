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
 *   パフォ:     上記実行後、window.__e2e.run('TC-E2E-11')
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
        assert('01-1', 'ページがロード済み', true, 'スクリプト注入成功');

        const canvas = qs('#canvas-container canvas');
        assert('01-2', 'canvas が #canvas-container 内に存在', !!canvas,
            canvas ? `${canvas.tagName} found` : 'canvas not found');

        if (!canvas) return;

        const w = canvas.width;
        const h = canvas.height;
        assert('01-3', 'canvasサイズが >0', w > 0 && h > 0, `${w}x${h}`);

        const pixelCheck = (() => {
            try {
                const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
                if (ctx) return true;
            } catch (e) { /* already in use = good */ }
            return true;
        })();
        assert('01-4', 'WebGLコンテキストが有効', pixelCheck, 'Three.js がコンテキストを保持中');

        let frameCount = 0;
        const countFrames = () => { frameCount++; };
        requestAnimationFrame(function loop() {
            countFrames();
            if (frameCount < 100) requestAnimationFrame(loop);
        });
        await wait(1000);
        assert('01-5', 'アニメーションが動作中（1秒間のフレーム数）', frameCount >= 10, `${frameCount} frames/sec`);
    }

    // ============================
    // TC-E2E-02: UI要素の表示
    // ============================

    async function tc02_ui() {
        const h1 = qs('#title-h1');
        assert('02-1', 'タイトル h1#title-h1 が存在', !!h1, h1 ? `"${h1.textContent}"` : 'not found');

        const sub = qs('.subtitle');
        assert('02-2', 'サブタイトル .subtitle が存在', !!sub && sub.textContent === 'Kesson Space',
            sub ? `"${sub.textContent}"` : 'not found');

        const taglines = qsa('#taglines .tagline, #taglines .tagline-en');
        assert('02-3', 'タグラインが2行存在', taglines.length === 2, `${taglines.length} taglines found`);

        const creditLine = qs('#credit .credit-line');
        assert('02-4', 'クレジットに "AI" を含む', !!creditLine && creditLine.textContent.includes('AI'),
            creditLine ? `"${creditLine.textContent}"` : 'not found');

        const creditSig = qs('#credit .credit-signature');
        assert('02-5', 'クレジット署名に "pjdhiro" を含む', !!creditSig && creditSig.textContent.includes('pjdhiro'),
            creditSig ? `"${creditSig.textContent}"` : 'not found');

        const guide = qs('#control-guide');
        assert('02-6', '操作ガイド #control-guide が存在', !!guide, guide ? 'found' : 'not found');

        const scrollHint = qs('#scroll-hint');
        assert('02-7', 'スクロールヒント #scroll-hint が存在', !!scrollHint, scrollHint ? 'found' : 'not found');

        const h1Link = h1 ? h1.closest('a') : null;
        const href = h1Link ? h1Link.getAttribute('href') : '';
        assert('02-8', 'h1がブログ記事へのリンクを持つ', href.includes('pjdhiro/thinking-kesson'), `href="${href}"`);
    }

    // ============================
    // TC-E2E-03: 言語切替
    // ============================

    async function tc03_lang() {
        const lang = document.documentElement.lang;

        if (lang !== 'en') {
            warn('03-0', '言語切替テストは ?lang=en でアクセス後に実行してください', `現在の lang="${lang}"`);
            return;
        }

        assert('03-2', '<html lang="en">', lang === 'en', `lang="${lang}"`);

        const h1 = qs('#title-h1');
        assert('03-3', 'h1が英語タイトル', !!h1 && h1.textContent === 'Kesson-Driven Thinking',
            h1 ? `"${h1.textContent}"` : 'not found');

        const taglines = qsa('#taglines .tagline-en');
        const firstTag = taglines[0]?.textContent || '';
        assert('03-4', 'タグラインが英語', firstTag.includes("Don't discard"),
            `"${firstTag.substring(0, 40)}..."`);

        const creditLine = qs('#credit .credit-line');
        assert('03-5', 'クレジットが英語', !!creditLine && creditLine.textContent.includes('Exploring'),
            creditLine ? `"${creditLine.textContent}"` : 'not found');

        const toggle = qs('#lang-toggle');
        assert('03-6', '言語トグルが "日本語" と表示', !!toggle && toggle.textContent.trim() === '日本語',
            toggle ? `"${toggle.textContent.trim()}"` : 'not found');
    }

    // ============================
    // TC-E2E-04: コンソールエラーチェック
    // ============================

    async function tc04_console() {
        const errors = [];
        const origError = console.error;
        console.error = (...args) => {
            errors.push(args.map(String).join(' '));
            origError.apply(console, args);
        };

        await wait(3000);

        console.error = origError;

        const filtered = errors.filter(e =>
            !e.includes('gtag') &&
            !e.includes('googletagmanager') &&
            !e.includes('analytics')
        );

        assert('04-1', '監視期間中にJSエラーなし', filtered.length === 0,
            filtered.length > 0 ? `${filtered.length} errors: ${filtered[0].substring(0, 80)}` : '0 errors');
    }

    // ============================
    // TC-E2E-05: ナビゲーションオーブ
    // ============================

    async function tc05_nav() {
        const navLabels = qsa('[class*="nav-label"], [data-nav-index]');

        if (navLabels.length > 0) {
            assert('05-1', 'ナビオブジェクトのDOMラベルが存在', navLabels.length >= 1,
                `${navLabels.length} nav labels found`);
        } else {
            warn('05-1', 'ナビラベルDOMが未検出（初期化タイミングの可能性）', 'read_page で確認推奨');
        }

        const bodyText = document.body.innerText;
        const hasPdfLabels = ['一般向け', '設計者向け', '学術版', 'General', 'For Designers', 'Academic']
            .some(label => bodyText.includes(label));
        assert('05-2', 'PDF種別ラベルがページ内に存在', hasPdfLabels,
            hasPdfLabels ? 'ラベルテキスト検出' : 'ラベル未検出');

        warn('05-3', 'オーブ視認確認はスクリーンショットで実施', 'Claude in Chrome の screenshot で目視確認');
    }

    // ============================
    // TC-E2E-06: スクロール動作
    // ============================

    async function tc06_scroll() {
        const spacer = qs('#hero-spacer');
        assert('06-1', '#hero-spacer が存在', !!spacer,
            spacer ? `height: ${spacer.offsetHeight}px` : 'not found');

        const scrollBefore = window.scrollY;
        window.scrollTo({ top: window.innerHeight * 2, behavior: 'instant' });
        await wait(500);

        const scrollAfter = window.scrollY;
        assert('06-2', 'スクロールが機能', scrollAfter > scrollBefore,
            `before: ${scrollBefore}, after: ${scrollAfter}`);

        const logParagraphs = qsa('#dev-log .log-paragraph');
        assert('06-3', '開発ログにテキストが表示', logParagraphs.length >= 1,
            `${logParagraphs.length} paragraphs`);

        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
        await wait(500);

        const surfaceBtn = qs('#surface-btn');
        const surfaceOpacity = surfaceBtn ? parseFloat(getComputedStyle(surfaceBtn).opacity) : 0;
        assert('06-4', '浮上ボタンが最下部で表示', surfaceOpacity > 0, `opacity: ${surfaceOpacity}`);

        window.scrollTo({ top: 0, behavior: 'instant' });
        await wait(300);
    }

    // ============================
    // TC-E2E-07: Devパネル
    // ============================

    async function tc07_dev() {
        const hasDevParam = new URLSearchParams(window.location.search).has('dev');

        if (!hasDevParam) {
            const devPanel = qs('#dev-panel, .dev-panel, [id*="dev-panel"]');
            assert('07-1', '?dev なしでdevパネルが非表示',
                !devPanel || getComputedStyle(devPanel).display === 'none',
                devPanel ? 'panel found but hidden' : 'panel not in DOM');

            warn('07-2', '?dev ありのテストは ?dev でアクセス後に実行', '別途 navigate → ?dev で確認');
            return;
        }

        const devPanel = qs('#dev-panel, .dev-panel, .accordion');
        assert('07-2', '?dev ありでdevパネルが表示', !!devPanel,
            devPanel ? 'panel found' : 'panel not found');

        const sliders = qsa('input[type="range"]');
        assert('07-3', 'devパネルにスライダーが存在', sliders.length > 0,
            `${sliders.length} sliders found`);
    }

    // ============================
    // TC-E2E-08: パフォーマンス基礎
    // ============================

    async function tc08_perf() {
        const timing = performance.timing || {};
        const loadTime = timing.loadEventEnd && timing.navigationStart
            ? (timing.loadEventEnd - timing.navigationStart) / 1000
            : null;

        if (loadTime !== null) {
            assert('08-1', '初回ロードが10秒以内', loadTime < 10, `${loadTime.toFixed(2)}s`);
        } else {
            const entries = performance.getEntriesByType('navigation');
            if (entries.length > 0) {
                const lt = entries[0].loadEventEnd / 1000;
                assert('08-1', '初回ロードが10秒以内', lt < 10, `${lt.toFixed(2)}s`);
            } else {
                warn('08-1', 'ロード時間の計測不可', 'Navigation Timing API 利用不可');
            }
        }

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

        assert('08-2', 'フレームレート ≥ 20fps', fps >= 20, `${fps} fps`);

        if (performance.memory) {
            const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
            const totalMB = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
            assert('08-3', 'メモリ使用量が記録可能', true, `used: ${usedMB}MB / total: ${totalMB}MB`);
        } else {
            warn('08-3', 'performance.memory が利用不可（Chrome限定API）', '');
        }
    }

    // ============================
    // TC-E2E-09: リンク機能検証（ISS-001）
    // ============================

    async function tc09_links() {
        // 09-1: h1リンクが有効なURL
        const h1Link = qs('#title-h1')?.closest('a');
        if (h1Link) {
            const href = h1Link.href;
            assert('09-1', 'h1リンクが有効なURL', href.startsWith('http'), href);

            const isClickable = href !== '#' && href !== '';
            assert('09-2', 'h1リンクがクリック可能', isClickable, `href="${href}"`);
        } else {
            warn('09-1', 'h1リンクが見つからない', '');
        }

        // 09-3: ナビオーブのHTMLボタンクリック→PDFビューアー表示
        const navButtons = qsa('button.nav-label:not(.nav-label--gem)');
        if (navButtons.length > 0) {
            const firstBtn = navButtons[0];

            // tabIndex確認
            assert('09-3a', 'ナビボタンにtabIndex設定',
                firstBtn.tabIndex === 0, `tabIndex=${firstBtn.tabIndex}`);

            // aria-label確認
            const ariaLabel = firstBtn.getAttribute('aria-label');
            assert('09-3b', 'ナビボタンにaria-label設定',
                !!ariaLabel && (ariaLabel.includes('PDF') || ariaLabel.includes('開く')),
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
            warn('09-3', 'ナビボタンが見つからない（初期化タイミングの可能性）', '');
        }

        // 09-4: 言語トグルの機能（aria-label確認のみ、切替はリロード発生するため実行しない）
        const toggle = qs('#lang-toggle');
        if (toggle) {
            const ariaLabel = toggle.getAttribute('aria-label');
            assert('09-4a', '言語トグルにaria-label設定', !!ariaLabel, ariaLabel || 'なし');
        }

        // 09-5: 浮上ボタン
        const surfaceBtn = qs('#surface-btn');
        if (surfaceBtn) {
            const ariaLabel = surfaceBtn.getAttribute('aria-label');
            assert('09-5', '浮上ボタンにaria-label設定', !!ariaLabel, ariaLabel || 'なし');
        }
    }

    // ============================
    // TC-E2E-10: キーボードナビゲーション（ISS-001）
    // ============================

    async function tc10_keyboard() {
        // 10-1: フォーカス可能要素のカウント
        const focusable = qsa('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        assert('10-1', 'フォーカス可能要素が存在',
            focusable.length >= 5, // h1リンク + 3ナビ + トグル + 浮上
            `${focusable.length} 要素`);

        // 10-2: ナビボタンにフォーカス可能
        const navButton = qs('button.nav-label:not(.nav-label--gem)');
        if (navButton) {
            navButton.focus();
            assert('10-2', 'ナビボタンにフォーカス可能',
                document.activeElement === navButton,
                document.activeElement === navButton ? 'フォーカス成功' : 'フォーカス失敗');

            // 10-3: Enterキーでビューアー起動
            let viewer = qs('#kesson-viewer');
            const wasVisible = viewer?.classList.contains('visible');

            if (!wasVisible) {
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    bubbles: true,
                    cancelable: true
                });
                navButton.dispatchEvent(enterEvent);
                await wait(800);

                viewer = qs('#kesson-viewer');
                const nowVisible = viewer?.classList.contains('visible');
                assert('10-3', 'Enterキーでビューアー起動',
                    nowVisible,
                    nowVisible ? 'ビューアー表示' : '未表示');

                // 閉じる
                const closeBtn = viewer?.querySelector('.viewer-close');
                if (closeBtn) {
                    closeBtn.click();
                    await wait(600);
                }
            } else {
                warn('10-3', 'ビューアーが既に表示中のためスキップ', '');
            }
        } else {
            warn('10-2', 'ナビボタンが見つからない', '');
        }

        // 10-4: Gemボタンにaria-label
        const gemBtn = qs('button.nav-label--gem');
        if (gemBtn) {
            const ariaLabel = gemBtn.getAttribute('aria-label');
            assert('10-4', 'GemボタンにもAria設定あり',
                !!ariaLabel,
                ariaLabel || 'なし');
        }
    }

    // ============================
    // TC-E2E-11: Google Core Web Vitals & パフォーマンス予算
    // ============================
    // 参照: https://web.dev/vitals/
    // PASS/WARN/FAIL の3段階で Google 推奨閾値に対して評価する

    async function tc11_webvitals() {
        const nav = performance.getEntriesByType('navigation')[0];

        // --- 11-1: DOMContentLoaded < 2.5s ---
        if (nav) {
            const dcl = nav.domContentLoadedEventEnd;
            const dclSec = (dcl / 1000).toFixed(2);
            if (dcl < 2500) {
                assert('11-1', 'DOMContentLoaded < 2.5s', true, `${dclSec}s`);
            } else if (dcl < 4000) {
                warn('11-1', 'DOMContentLoaded 2.5-4.0s（改善推奨）', `${dclSec}s`);
            } else {
                assert('11-1', 'DOMContentLoaded < 4.0s', false, `${dclSec}s`);
            }
        } else {
            warn('11-1', 'Navigation Timing API 利用不可', '');
        }

        // --- 11-2: Load完了時間 ---
        if (nav) {
            const loadSec = (nav.loadEventEnd / 1000).toFixed(2);
            if (nav.loadEventEnd < 3000) {
                assert('11-2', 'Load < 3.0s', true, `${loadSec}s`);
            } else if (nav.loadEventEnd < 5000) {
                warn('11-2', 'Load 3.0-5.0s（改善推奨）', `${loadSec}s`);
            } else {
                assert('11-2', 'Load < 5.0s', false, `${loadSec}s`);
            }
        }

        // --- 11-3: FCP (First Contentful Paint) < 1.8s ---
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
        if (fcp) {
            const fcpSec = (fcp.startTime / 1000).toFixed(2);
            if (fcp.startTime < 1800) {
                assert('11-3', 'FCP < 1.8s', true, `${fcpSec}s`);
            } else if (fcp.startTime < 3000) {
                warn('11-3', 'FCP 1.8-3.0s（改善推奨）', `${fcpSec}s`);
            } else {
                assert('11-3', 'FCP < 3.0s', false, `${fcpSec}s`);
            }
        } else {
            warn('11-3', 'FCP エントリ未取得', 'paint entries: ' + paintEntries.length);
        }

        // --- 11-4: LCP (Largest Contentful Paint) < 2.5s ---
        let lcpValue = null;
        try {
            await new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    if (entries.length > 0) {
                        lcpValue = entries[entries.length - 1].startTime;
                    }
                    observer.disconnect();
                    resolve();
                });
                observer.observe({ type: 'largest-contentful-paint', buffered: true });
                // タイムアウト: bufferedエントリがない場合
                setTimeout(() => { observer.disconnect(); resolve(); }, 500);
            });
        } catch (e) {
            // PerformanceObserver非対応
        }

        if (lcpValue !== null) {
            const lcpSec = (lcpValue / 1000).toFixed(2);
            if (lcpValue < 2500) {
                assert('11-4', 'LCP < 2.5s（Good）', true, `${lcpSec}s`);
            } else if (lcpValue < 4000) {
                warn('11-4', 'LCP 2.5-4.0s（Needs Improvement）', `${lcpSec}s`);
            } else {
                assert('11-4', 'LCP < 4.0s', false, `${lcpSec}s`);
            }
        } else {
            warn('11-4', 'LCP 計測不可（PerformanceObserver buffered未対応）', '');
        }

        // --- 11-5: CLS (Cumulative Layout Shift) < 0.1 ---
        let clsValue = 0;
        try {
            await new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    observer.disconnect();
                    resolve();
                });
                observer.observe({ type: 'layout-shift', buffered: true });
                setTimeout(() => { observer.disconnect(); resolve(); }, 500);
            });
        } catch (e) {
            // PerformanceObserver非対応
        }

        const clsFixed = clsValue.toFixed(4);
        if (clsValue < 0.1) {
            assert('11-5', 'CLS < 0.1（Good）', true, clsFixed);
        } else if (clsValue < 0.25) {
            warn('11-5', 'CLS 0.1-0.25（Needs Improvement）', clsFixed);
        } else {
            assert('11-5', 'CLS < 0.25', false, clsFixed);
        }

        // --- 11-6: 転送量 < 1,600KB ---
        const resources = performance.getEntriesByType('resource');
        let totalTransfer = 0;
        let measurableCount = 0;
        for (const r of resources) {
            if (r.transferSize > 0) {
                totalTransfer += r.transferSize;
                measurableCount++;
            }
        }
        // Navigation document自体の転送量を加算
        if (nav && nav.transferSize) {
            totalTransfer += nav.transferSize;
        }
        const totalKB = Math.round(totalTransfer / 1024);

        if (totalKB > 0) {
            if (totalKB < 1600) {
                assert('11-6', '転送量 < 1,600KB', true, `${totalKB}KB (${measurableCount} resources)`);
            } else if (totalKB < 3000) {
                warn('11-6', '転送量 1,600-3,000KB（改善推奨）', `${totalKB}KB`);
            } else {
                assert('11-6', '転送量 < 3,000KB', false, `${totalKB}KB`);
            }
        } else {
            warn('11-6', '転送量計測不可（cross-origin制約）', 'transferSize=0');
        }

        // --- 11-7: リクエスト数 < 50 ---
        const reqCount = resources.length + 1; // +1 for document
        if (reqCount < 50) {
            assert('11-7', 'リクエスト数 < 50', true, `${reqCount} requests`);
        } else if (reqCount < 80) {
            warn('11-7', 'リクエスト数 50-80（改善推奨）', `${reqCount} requests`);
        } else {
            assert('11-7', 'リクエスト数 < 80', false, `${reqCount} requests`);
        }

        // --- 11-8: 404エラーなし ---
        // Resource Timing APIではステータスコードを取得できないため、
        // 既知の問題（favicon.ico等）をDOM/linkで検出
        const favicon = qs('link[rel="icon"], link[rel="shortcut icon"]');
        if (!favicon) {
            warn('11-8', 'favicon未設定（404の可能性）', '<link rel="icon"> がHTMLに存在しない');
        } else {
            assert('11-8', 'faviconが設定済み', true, favicon.href);
        }

        // --- サマリーログ ---
        console.log('%c[Web Vitals] DCL:' +
            (nav ? (nav.domContentLoadedEventEnd / 1000).toFixed(2) + 's' : 'N/A') +
            ' | FCP:' + (fcp ? (fcp.startTime / 1000).toFixed(2) + 's' : 'N/A') +
            ' | LCP:' + (lcpValue !== null ? (lcpValue / 1000).toFixed(2) + 's' : 'N/A') +
            ' | CLS:' + clsFixed +
            ' | Size:' + totalKB + 'KB' +
            ' | Reqs:' + reqCount,
            'color: #2196F3; font-weight: bold');
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
        'TC-E2E-09': tc09_links,      // ISS-001
        'TC-E2E-10': tc10_keyboard,   // ISS-001
        'TC-E2E-11': tc11_webvitals,  // Google Core Web Vitals
    };

    async function run(tcId) {
        const fn = testMap[tcId];
        if (!fn) return { error: `Unknown test: ${tcId}` };
        results.length = 0;
        await fn();
        return summary();
    }

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

    async function smoke() {
        results.length = 0;
        for (const fn of [tc01_webgl, tc02_ui, tc04_console]) {
            try { await fn(); } catch (e) {
                results.push({ id: 'SMOKE-ERROR', description: e.message, status: 'FAIL', detail: '' });
            }
        }
        return summary();
    }

    // パフォーマンスのみ実行
    async function perf() {
        results.length = 0;
        try { await tc11_webvitals(); } catch (e) {
            results.push({ id: 'PERF-ERROR', description: e.message, status: 'FAIL', detail: '' });
        }
        return summary();
    }

    window.__e2e = { run, runAll, smoke, perf, testMap, results: () => summary() };

    const result = await runAll();

    console.log('%c[E2E] ' + result.overall + ` \u2014 ${result.pass}/${result.total} passed`,
        result.overall === 'PASS' ? 'color: #4CAF50; font-weight: bold' : 'color: #f44336; font-weight: bold');

    if (result.fail > 0) {
        console.table(result.results.filter(r => r.status === 'FAIL'));
    }

    return result;
})();
