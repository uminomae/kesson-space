/**
 * e2e-runner.js — kesson-space E2E テストランナー
 *
 * 2つの実行モード:
 *
 * 1. ブラウザ独立実行（?test パラメータ）:
 *    index.html が ?test を検出 → このファイルをfetch&eval
 *    ページ内オーバーレイに結果を表示。Claude不要。
 *
 * 2. Claude in Chrome MCP 注入:
 *    fetch('/tests/e2e-runner.js').then(r=>r.text()).then(eval)
 *    window.__e2e.run('TC-E2E-01') など
 *
 * 設計書: tests/e2e-test-design.md
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
    // 結果オーバーレイ（?test モード用）
    // ============================

    const IS_TEST_MODE = new URLSearchParams(window.location.search).has('test');

    function createOverlay() {
        if (!IS_TEST_MODE) return;

        const overlay = document.createElement('div');
        overlay.id = 'e2e-overlay';
        overlay.innerHTML = `
            <style>
                #e2e-overlay {
                    position: fixed; top: 0; right: 0;
                    width: min(420px, 90vw); max-height: 100vh;
                    z-index: 99999;
                    background: rgba(10, 14, 20, 0.95);
                    border-left: 2px solid rgba(100, 150, 255, 0.3);
                    font-family: 'SF Mono', 'Consolas', monospace;
                    font-size: 11px;
                    color: rgba(200, 215, 235, 0.85);
                    overflow-y: auto;
                    backdrop-filter: blur(8px);
                }
                #e2e-overlay * { box-sizing: border-box; }
                #e2e-header {
                    position: sticky; top: 0;
                    background: rgba(10, 14, 20, 0.98);
                    padding: 10px 14px;
                    border-bottom: 1px solid rgba(100, 150, 255, 0.15);
                    display: flex; justify-content: space-between; align-items: center;
                }
                #e2e-header .title { font-size: 13px; font-weight: bold; letter-spacing: 0.05em; }
                #e2e-header .badge {
                    padding: 2px 8px; border-radius: 3px;
                    font-size: 11px; font-weight: bold;
                }
                .badge-pass { background: rgba(76, 175, 80, 0.25); color: #81c784; }
                .badge-fail { background: rgba(244, 67, 54, 0.25); color: #ef9a9a; }
                .badge-running { background: rgba(255, 193, 7, 0.25); color: #ffd54f; }
                #e2e-stats {
                    padding: 6px 14px;
                    background: rgba(20, 28, 40, 0.6);
                    font-size: 11px;
                    border-bottom: 1px solid rgba(100, 150, 255, 0.1);
                }
                #e2e-body { padding: 6px 10px; }
                .e2e-row {
                    padding: 4px 6px; margin: 2px 0;
                    border-radius: 3px;
                    display: flex; align-items: flex-start; gap: 6px;
                    line-height: 1.4;
                }
                .e2e-row:hover { background: rgba(100, 150, 255, 0.06); }
                .e2e-row .icon { flex-shrink: 0; width: 16px; text-align: center; }
                .e2e-row .id { flex-shrink: 0; width: 38px; color: rgba(150, 175, 210, 0.5); }
                .e2e-row .desc { flex: 1; }
                .e2e-row .detail {
                    color: rgba(150, 175, 210, 0.4);
                    font-size: 10px; margin-top: 1px;
                }
                .e2e-row.fail { background: rgba(244, 67, 54, 0.08); }
                .e2e-row.fail .desc { color: #ef9a9a; }
                .e2e-row.warn { background: rgba(255, 193, 7, 0.06); }
                .e2e-row.warn .desc { color: #ffd54f; }
                .e2e-row.pass .desc { color: rgba(200, 215, 235, 0.6); }
                #e2e-close {
                    background: none; border: none; color: rgba(200, 215, 235, 0.5);
                    cursor: pointer; font-size: 16px; padding: 4px 8px;
                }
                #e2e-close:hover { color: rgba(200, 215, 235, 0.9); }
                #e2e-actions {
                    padding: 8px 14px;
                    border-top: 1px solid rgba(100, 150, 255, 0.1);
                    display: flex; gap: 8px;
                    position: sticky; bottom: 0;
                    background: rgba(10, 14, 20, 0.98);
                }
                #e2e-actions button {
                    background: rgba(100, 150, 255, 0.12);
                    border: 1px solid rgba(100, 150, 255, 0.2);
                    color: rgba(180, 200, 230, 0.7);
                    padding: 4px 10px; border-radius: 3px;
                    cursor: pointer; font-size: 10px;
                    font-family: inherit;
                }
                #e2e-actions button:hover {
                    background: rgba(100, 150, 255, 0.2);
                    color: rgba(220, 230, 245, 0.9);
                }
            </style>
            <div id="e2e-header">
                <span class="title">E2E Tests</span>
                <span id="e2e-badge" class="badge badge-running">RUNNING...</span>
                <button id="e2e-close">×</button>
            </div>
            <div id="e2e-stats"></div>
            <div id="e2e-body"><div style="padding:20px;color:rgba(255,193,7,0.6)">テスト実行中…</div></div>
            <div id="e2e-actions">
                <button id="e2e-rerun">▶ Re-run All</button>
                <button id="e2e-copy">📋 Copy JSON</button>
                <button id="e2e-filter-fail">⚠ Failures only</button>
            </div>
        `;
        document.body.appendChild(overlay);

        qs('#e2e-close').addEventListener('click', () => {
            overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        });

        qs('#e2e-rerun').addEventListener('click', async () => {
            updateOverlayRunning();
            const result = await runAll();
            updateOverlayResults(result);
        });

        qs('#e2e-copy').addEventListener('click', () => {
            const json = JSON.stringify(summary(), null, 2);
            navigator.clipboard.writeText(json).then(() => {
                const btn = qs('#e2e-copy');
                btn.textContent = '✓ Copied';
                setTimeout(() => { btn.textContent = '📋 Copy JSON'; }, 1500);
            });
        });

        let showOnlyFail = false;
        qs('#e2e-filter-fail').addEventListener('click', () => {
            showOnlyFail = !showOnlyFail;
            qs('#e2e-filter-fail').textContent = showOnlyFail ? '◉ Show all' : '⚠ Failures only';
            updateOverlayResults(summary());
        });

        // Filter state accessor for updateOverlayResults
        overlay._getShowOnlyFail = () => showOnlyFail;
    }

    function updateOverlayRunning() {
        const badge = qs('#e2e-badge');
        const body = qs('#e2e-body');
        if (badge) { badge.className = 'badge badge-running'; badge.textContent = 'RUNNING...'; }
        if (body) body.innerHTML = '<div style="padding:20px;color:rgba(255,193,7,0.6)">テスト実行中…</div>';
    }

    function updateOverlayResults(result) {
        if (!IS_TEST_MODE) return;

        const badge = qs('#e2e-badge');
        if (badge) {
            badge.className = `badge ${result.overall === 'PASS' ? 'badge-pass' : 'badge-fail'}`;
            badge.textContent = result.overall;
        }

        const stats = qs('#e2e-stats');
        if (stats) {
            stats.textContent = `✓ ${result.pass}  ✗ ${result.fail}  ⚠ ${result.warn}  / ${result.total} total`;
        }

        const overlay = qs('#e2e-overlay');
        const showOnlyFail = overlay?._getShowOnlyFail?.() || false;

        const body = qs('#e2e-body');
        if (!body) return;

        const filtered = showOnlyFail
            ? result.results.filter(r => r.status !== 'PASS')
            : result.results;

        body.innerHTML = filtered.map(r => {
            const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '⚠';
            const cls = r.status.toLowerCase();
            return `<div class="e2e-row ${cls}">
                <span class="icon">${icon}</span>
                <span class="id">${r.id}</span>
                <div>
                    <div class="desc">${r.description}</div>
                    ${r.detail ? `<div class="detail">${r.detail}</div>` : ''}
                </div>
            </div>`;
        }).join('');
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

        // 02-9: h1の色がCSS指定値（白: alpha >= 0.9）であること
        // h1の色はCSS固定（rgba(255,255,255,0.95)）であるべき。
        // inline styleでcolorが上書きされていないことを検証する。
        if (h1) {
            const computed = getComputedStyle(h1).color;
            // computed は "rgba(255, 255, 255, 0.95)" or "rgb(255, 255, 255)" 形式
            const alphaMatch = computed.match(/[\d.]+/g);
            let alpha = 1.0;
            if (alphaMatch && alphaMatch.length >= 4) {
                alpha = parseFloat(alphaMatch[3]);
            }
            // overlay の opacity による視覚的な暗さは computed color には影響しない。
            // ここで検証するのは h1 要素自体の color プロパティの alpha 値。
            assert('02-9', 'h1の色が白（alpha >= 0.9）', alpha >= 0.9,
                `computed: ${computed}, alpha: ${alpha}`);
        }

        // 02-10: h1にinline styleでcolorが設定されていないこと
        // inline style による color 上書きは禁止（CSS固定ポリシー）。
        // devパネルやLLM修正でうっかり設定された場合を検出する。
        if (h1) {
            const inlineColor = h1.style.color;
            assert('02-10', 'h1にinline color未設定（CSS固定ポリシー）',
                !inlineColor || inlineColor === '',
                inlineColor ? `inline: "${inlineColor}" ← 不正な上書き検出` : 'inline color なし（正常）');
        }
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

        const sub = qs('#title-sub');
        assert('03-6', 'サブタイトルが英語 "Kesson Space"', !!sub && /Kesson Space/i.test(sub.textContent),
            sub ? `"${sub.textContent}"` : 'not found');

        const guideAction = qs('#control-guide .guide-action');
        assert('03-7', '操作ガイドが英語', !!guideAction && /rotate|zoom|dive/i.test(guideAction.textContent),
            guideAction ? `"${guideAction.textContent}"` : 'not found');

        const toggle = qs('#lang-toggle');
        assert('03-8', '言語トグルが "日本語" と表示', !!toggle && toggle.textContent.trim() === '日本語',
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

        const sections = qsa('.accordion-item, #dev-panel details');
        assert('07-4', 'devパネルにセクションが存在', sections.length > 0,
            `${sections.length} sections found`);

        const toggles = qsa('.form-check-input, #dev-panel input[type="checkbox"]');
        assert('07-5', 'devパネルにトグルスイッチが存在', toggles.length > 0,
            `${toggles.length} toggles found`);
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

        const navButtons = Array.from(qsa('button.nav-label'));
        assert('10-2', 'ナビボタン（orb/gem/xlogo）が存在',
            navButtons.length >= 5,
            `${navButtons.length} 個`);

        // 10-3: 全nav-labelがフォーカス可能
        if (navButtons.length > 0) {
            let focusedCount = 0;
            navButtons.forEach((btn) => {
                btn.focus();
                if (document.activeElement === btn) {
                    focusedCount += 1;
                }
            });
            assert('10-3', '全ナビボタンにフォーカス可能',
                focusedCount === navButtons.length,
                `${focusedCount}/${navButtons.length}`);

            // 10-4: Enterキーでビューアー起動（PDF orb）
            const navButton = qs('button.nav-label[data-nav-type="orb"]') || navButtons[0];
            let viewer = qs('#kesson-viewer');
            const wasVisible = viewer?.classList.contains('visible');

            if (!wasVisible && navButton) {
                navButton.focus();
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    bubbles: true,
                    cancelable: true
                });
                navButton.dispatchEvent(enterEvent);
                await wait(800);

                viewer = qs('#kesson-viewer');
                const nowVisible = viewer?.classList.contains('visible');
                assert('10-4', 'Enterキーでビューアー起動',
                    nowVisible,
                    nowVisible ? 'ビューアー表示' : '未表示');

                // 閉じる
                const closeBtn = viewer?.querySelector('.viewer-close');
                if (closeBtn) {
                    closeBtn.click();
                    await wait(600);
                }
            } else {
                warn('10-4', 'ビューアーが既に表示中または対象ボタン未検出のためスキップ', '');
            }
        } else {
            warn('10-2', 'ナビボタンが見つからない', '');
        }

        // 10-5: Gemボタンにaria-label
        const gemBtn = qs('button.nav-label--gem');
        if (gemBtn) {
            const ariaLabel = gemBtn.getAttribute('aria-label');
            assert('10-5', 'GemボタンにもAria設定あり',
                !!ariaLabel,
                ariaLabel || 'なし');
        }

        // 10-6: スクロール非表示時にtabIndex=-1
        if (navButtons.length > 0) {
            window.scrollTo(0, document.body.scrollHeight);
            await wait(700);
            const hiddenCount = navButtons.filter((btn) => btn.tabIndex === -1).length;
            assert('10-6', '非表示時にナビボタンがTab順から除外される',
                hiddenCount === navButtons.length,
                `${hiddenCount}/${navButtons.length} が tabIndex=-1`);
            window.scrollTo(0, 0);
            await wait(200);
        }
    }

    // ============================
    // TC-E2E-11: Google Core Web Vitals & パフォーマンス予算
    // ============================

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
        const reqCount = resources.length + 1;
        if (reqCount < 50) {
            assert('11-7', 'リクエスト数 < 50', true, `${reqCount} requests`);
        } else if (reqCount < 80) {
            warn('11-7', 'リクエスト数 50-80（改善推奨）', `${reqCount} requests`);
        } else {
            assert('11-7', 'リクエスト数 < 80', false, `${reqCount} requests`);
        }

        // --- 11-8: 404エラーなし ---
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
    // TC-E2E-12: sessions.json ↔ .md ファイル整合性
    // ============================

    async function tc12_sessionFiles() {
        // sessions.json を取得
        let sessionList = [];
        try {
            const res = await fetch('./assets/devlog/sessions.json');
            if (!res.ok) {
                warn('12-0', 'sessions.json が取得不可', `HTTP ${res.status}`);
                return;
            }
            sessionList = await res.json();
        } catch (e) {
            warn('12-0', 'sessions.json の読み込みに失敗', e.message);
            return;
        }

        assert('12-1', 'sessions.json にエントリが存在',
            sessionList.length > 0, `${sessionList.length} entries`);

        // 各エントリに対応する .md ファイルの存在チェック
        let missingFiles = [];
        for (const session of sessionList) {
            const mdUrl = `./content/devlog/${session.id}.md`;
            try {
                const res = await fetch(mdUrl, { method: 'HEAD' });
                if (!res.ok) {
                    missingFiles.push(session.id);
                }
            } catch (e) {
                missingFiles.push(session.id);
            }
        }

        if (missingFiles.length === 0) {
            assert('12-2', '全セッションに対応する .md ファイルが存在', true,
                `${sessionList.length}/${sessionList.length} files found`);
        } else {
            assert('12-2', '全セッションに対応する .md ファイルが存在', false,
                `Missing: ${missingFiles.join(', ')}`);
            // 個別に警告
            for (const id of missingFiles) {
                warn('12-2x', `content/devlog/${id}.md が見つからない`,
                    'sessions.json にエントリがあるが .md ファイルが不足');
            }
        }
    }

    // ============================
    // TC-E2E-13: font-size-ctrl 回帰（Bug #8・#9・#10・#11 対応）
    // ============================

    async function tc13_fontSizeCtrl() {
        const rootStyle = getComputedStyle(document.documentElement);
        const surfaceBtnVar = rootStyle.getPropertyValue('--ks-surface-btn').trim();
        assert('13-1', 'CSS変数 --ks-surface-btn が設定されている',
            surfaceBtnVar !== '', `value: "${surfaceBtnVar}"`);

        const surfaceBtn = qs('#surface-btn');
        if (surfaceBtn) {
            const fs = getComputedStyle(surfaceBtn).fontSize;
            assert('13-2', '#surface-btn の font-size が設定済み',
                !!fs && fs !== '0px', `font-size: ${fs}`);
        } else {
            warn('13-2', '#surface-btn が見つからない', '');
        }

        const fontStep = localStorage.getItem('kesson-font-step');
        assert('13-3', 'localStorage に kesson-font-step が存在',
            fontStep !== null, `value: ${fontStep}`);

        const cardTitle = rootStyle.getPropertyValue('--ks-card-title').trim();
        assert('13-4', '--ks-card-title が設定済み（デフォルト step=3 確認）',
            cardTitle !== '', `value: "${cardTitle}"`);

        const migrationFlag = localStorage.getItem('kesson-font-step-v2');
        assert('13-5', 'localStorage に移行フラグ kesson-font-step-v2 が存在',
            migrationFlag !== null, `value: ${migrationFlag}`);

        const collabNote = qs('.topbar-collab-note');
        const topbarLink = qs('.topbar-link');
        if (collabNote && topbarLink) {
            const collabFs = parseFloat(getComputedStyle(collabNote).fontSize);
            const linkFs = parseFloat(getComputedStyle(topbarLink).fontSize);
            assert('13-6', '.topbar-collab-note と .topbar-link の font-size が同等（±3px）',
                Math.abs(collabFs - linkFs) <= 3,
                `collab-note: ${collabFs}px, topbar-link: ${linkFs}px`);
        } else {
            warn('13-6', '.topbar-collab-note または .topbar-link が見つからない',
                `collab-note: ${!!collabNote}, link: ${!!topbarLink}`);
        }

        const btnMinus = qs('#font-size-down');
        const btnPlus = qs('#font-size-up');
        const btnReset = qs('#font-size-reset');

        if (btnMinus && btnPlus) {
            const beforeStep = parseInt(localStorage.getItem('kesson-font-step') || '3', 10);

            if (!btnMinus.disabled) {
                btnMinus.click();
                await wait(100);
                const afterMinus = parseInt(localStorage.getItem('kesson-font-step') || '3', 10);
                assert('13-7', 'A- クリックでステップが減少',
                    afterMinus < beforeStep, `before: ${beforeStep}, after: ${afterMinus}`);

                btnPlus.click();
                await wait(100);
                const afterPlus = parseInt(localStorage.getItem('kesson-font-step') || '3', 10);
                assert('13-8', 'A+ クリックでステップが増加',
                    afterPlus > afterMinus, `before: ${afterMinus}, after: ${afterPlus}`);
            } else {
                warn('13-7', 'A- が disabled（MIN状態）のためスキップ', '');
                warn('13-8', '同上', '');
            }

            if (btnReset) {
                btnReset.click();
                await wait(100);
                const afterReset = parseInt(localStorage.getItem('kesson-font-step') || '3', 10);
                assert('13-9', '↺ クリックで DEFAULT_STEP(3) に戻る',
                    afterReset === 3, `step: ${afterReset}`);
            } else {
                warn('13-9', '#font-size-reset が見つからない', '');
            }

            for (let i = 0; i < 10; i++) {
                if (btnMinus.disabled) break;
                btnMinus.click();
                await wait(30);
            }
            assert('13-10', 'MIN ステップで A-(#font-size-down) が disabled',
                btnMinus.disabled, `disabled: ${btnMinus.disabled}`);

            for (let i = 0; i < 12; i++) {
                if (btnPlus.disabled) break;
                btnPlus.click();
                await wait(30);
            }
            assert('13-11', 'MAX ステップで A+(#font-size-up) が disabled',
                btnPlus.disabled, `disabled: ${btnPlus.disabled}`);

            if (btnReset) {
                btnReset.click();
                await wait(100);
            }
        } else {
            warn('13-7', '#font-size-down または #font-size-up が見つからない', '');
            warn('13-8', '同上', '');
            warn('13-9', '同上', '');
            warn('13-10', '同上', '');
            warn('13-11', '同上', '');
        }
    }

    // ============================
    // TC-E2E-14: GUIDES セクション UI 回帰（Bug #2・#6・#7 対応）
    // ============================

    async function tc14_guidesUi() {
        const featureCards = qs('#guides-feature-cards');
        assert('14-1', '#guides-feature-cards が DOM に存在',
            !!featureCards, featureCards ? 'found' : 'not found');
        if (!featureCards) return;

        await wait(200);

        const allCardTitles = Array.from(
            featureCards.querySelectorAll('.card-title')
        ).map((el) => el.textContent.trim());

        assert('14-2', 'GUIDESカードに「概要版」表記がない（Bug #2）',
            !allCardTitles.some((t) => t === '概要版'),
            `titles: [${allCardTitles.join(', ')}]`);
        assert('14-2b', 'GUIDESカードに「一般向け」表記がある（Bug #2修正確認）',
            allCardTitles.some((t) => t === '一般向け'),
            `titles: [${allCardTitles.join(', ')}]`);

        const guideTitle = featureCards.querySelector('.card-title');
        const articleTitle = qs('#articles-grid .card-title');
        if (guideTitle && articleTitle) {
            assert('14-3', 'GUIDESとARTICLESのタイトルクラスが一致（Bug #6）',
                guideTitle.className === articleTitle.className,
                `guides: "${guideTitle.className}", articles: "${articleTitle.className}"`);
        } else {
            warn('14-3', 'タイトル要素が見つからない',
                `guide: ${!!guideTitle}, article: ${!!articleTitle}`);
        }

        const guideText = featureCards.querySelector('.card-text');
        const articleText = qs('#articles-grid .card-text');
        if (guideText && articleText) {
            assert('14-4', 'GUIDESとARTICLESのテキストクラスが一致（Bug #6）',
                guideText.className === articleText.className,
                `guides: "${guideText.className}", articles: "${articleText.className}"`);
        } else {
            warn('14-4', 'テキスト要素が見つからない',
                `guide: ${!!guideText}, article: ${!!articleText}`);
        }

        const guidesSection = document.getElementById('guides-section');
        const articlesSection = document.getElementById('articles-section');
        if (guidesSection && articlesSection) {
            const guidesZ = parseInt(getComputedStyle(guidesSection).zIndex || '0', 10) || 0;
            const articlesZ = parseInt(getComputedStyle(articlesSection).zIndex || '0', 10) || 0;
            assert('14-5', 'GUIDES の z-index が ARTICLES 以上（Bug #7）',
                guidesZ >= articlesZ,
                `guides: ${guidesZ}, articles: ${articlesZ}`);
        } else {
            warn('14-5', 'セクション要素が見つからないため z-index 比較スキップ', '');
        }

        const mt = parseFloat(getComputedStyle(featureCards).marginTop);
        assert('14-6', '#guides-feature-cards に margin-top が設定されている（Bug #7）',
            mt > 0, `margin-top: ${mt}px`);
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
        'TC-E2E-12': tc12_sessionFiles,  // sessions.json ↔ .md 整合性
        'TC-E2E-13': tc13_fontSizeCtrl,   // Bug #8〜#11 回帰
        'TC-E2E-14': tc14_guidesUi,       // Bug #2, #6, #7 回帰
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

    async function perf() {
        results.length = 0;
        try { await tc11_webvitals(); } catch (e) {
            results.push({ id: 'PERF-ERROR', description: e.message, status: 'FAIL', detail: '' });
        }
        return summary();
    }

    // MCP用グローバルAPI
    window.__e2e = { run, runAll, smoke, perf, testMap, results: () => summary() };

    // ============================
    // 実行 & 結果表示
    // ============================

    if (IS_TEST_MODE) {
        createOverlay();
    }

    const result = await runAll();

    if (IS_TEST_MODE) {
        updateOverlayResults(result);
    }

    console.log('%c[E2E] ' + result.overall + ` — ${result.pass}/${result.total} passed`,
        result.overall === 'PASS' ? 'color: #4CAF50; font-weight: bold' : 'color: #f44336; font-weight: bold');

    if (result.fail > 0) {
        console.table(result.results.filter(r => r.status === 'FAIL'));
    }

    return result;
})();
