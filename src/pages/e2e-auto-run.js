// e2e-auto-run.js
// `?test` 付きアクセス時のみ E2E テストランナーを遅延ロードする。

if (!new URLSearchParams(window.location.search).has('test')) {
    // No-op
} else {
    // Three.js 初期化完了を待ってからテスト実行（3秒待機）
    window.addEventListener('load', () => {
        setTimeout(() => {
            import('../../tests/e2e-runner.js').catch((e) => {
                console.error('[E2E] Failed to load test runner:', e);
            });
        }, 3000);
    });
}
