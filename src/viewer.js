// viewer.js — フロートPDFビューアー（CSS + DOM）

let _viewer = null;
let _isOpen = false;

function createViewer() {
    const viewer = document.createElement('div');
    viewer.id = 'kesson-viewer';
    viewer.innerHTML = `
        <div class="viewer-glass">
            <button class="viewer-close" aria-label="閉じる">×</button>
            <div class="viewer-content"></div>
        </div>
    `;
    document.body.appendChild(viewer);

    viewer.querySelector('.viewer-close').addEventListener('click', closeViewer);
    viewer.addEventListener('click', (e) => {
        if (e.target === viewer) closeViewer();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _isOpen) closeViewer();
    });

    return viewer;
}

export function openViewer(content) {
    if (!_viewer) _viewer = createViewer();
    _viewer.querySelector('.viewer-content').innerHTML = content;

    requestAnimationFrame(() => {
        _viewer.classList.add('visible');
        requestAnimationFrame(() => {
            _viewer.classList.add('open');
        });
    });
    _isOpen = true;
}

export function closeViewer() {
    if (_viewer) {
        _viewer.classList.remove('open');
        setTimeout(() => {
            _viewer.classList.remove('visible');
            _viewer.querySelector('.viewer-content').innerHTML = '';
            _isOpen = false;
        }, 500);
    }
}

export function isViewerOpen() {
    return _isOpen;
}

export function openPdfViewer(url, label) {
    openViewer(`
        <iframe src="${url}" title="${label}"></iframe>
    `);
}

export function injectViewerStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #kesson-viewer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 200;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(5, 10, 20, 0.0);
            transition: background 0.5s ease;
            cursor: pointer;
        }
        #kesson-viewer.visible {
            display: flex;
        }
        #kesson-viewer.open {
            background: rgba(5, 10, 20, 0.5);
        }

        .viewer-glass {
            position: relative;
            width: 80vw;
            max-width: 900px;
            height: 85vh;
            cursor: default;

            background: rgba(15, 25, 40, 0.65);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(100, 150, 255, 0.08);
            border-radius: 3px;
            box-shadow:
                0 0 60px rgba(0, 0, 0, 0.4),
                0 0 120px rgba(30, 60, 120, 0.1),
                inset 0 0 60px rgba(20, 40, 80, 0.05);

            opacity: 0;
            transform: scale(0.92) translateY(20px);
            transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        #kesson-viewer.open .viewer-glass {
            opacity: 1;
            transform: scale(1) translateY(0);
        }

        .viewer-close {
            position: absolute;
            top: 12px;
            right: 14px;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.25);
            font-size: 1.4rem;
            cursor: pointer;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.3s;
            z-index: 1;
        }
        .viewer-close:hover {
            color: rgba(255, 255, 255, 0.6);
        }

        .viewer-content {
            width: 100%;
            height: 100%;
            padding: 0;
        }
        .viewer-content iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 3px;
        }

        .viewer-glass::-webkit-scrollbar {
            width: 4px;
        }
        .viewer-glass::-webkit-scrollbar-track {
            background: transparent;
        }
        .viewer-glass::-webkit-scrollbar-thumb {
            background: rgba(100, 150, 255, 0.15);
            border-radius: 2px;
        }
    `;
    document.head.appendChild(style);
}
