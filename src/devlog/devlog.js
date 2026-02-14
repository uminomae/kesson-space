/**
 * devlog.js — Devlog Gallery (index.html統合版)
 *
 * コミットセッションをInstagram風3Dグリッドとして表示する。
 * kesson-spaceの闘の中に光のカードが浮かぶ。
 * 背景は透明でメインThree.jsシーンが透けて見える。
 *
 * Usage: import { initDevlogGallery } from './devlog/devlog.js';
 */

import * as THREE from 'three';
import { createGrid } from './grid.js';
import { createCard } from './card.js';
import { ZoomController } from './zoom.js';

// 背景透明（メインシーンが見える）
const FOG_COLOR = new THREE.Color(0x050508);
const FOG_NEAR = 20;
const FOG_FAR = 60;
const SESSIONS_URL = './assets/devlog/sessions.json';
const SCROLL_SPEED = 0.008;

let renderer, scene, camera;
let sessions = [];
let cards = [];
let scrollY = 0;
let targetScrollY = 0;
let gridGroup;
let zoom;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredCard = null;
let isInitialized = false;
let animationId = null;
let containerEl = null;
let devlogContent = null; // ログ本文キャッシュ

/**
 * 言語検出（i18n.jsに依存しない簡易版）
 */
function detectLangLocal() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('lang')) return params.get('lang');
    const saved = localStorage.getItem('kesson-lang');
    if (saved) return saved;
    return navigator.language.startsWith('ja') ? 'ja' : 'en';
}

/**
 * ギャラリーを初期化
 * @param {string} containerId - canvas container の ID
 * @param {string} counterId - session count 表示要素の ID
 */
export function initDevlogGallery(containerId = 'devlog-gallery-container', counterId = 'gallery-session-count') {
    if (isInitialized) return;

    containerEl = document.getElementById(containerId);
    if (!containerEl) {
        console.warn('[devlog] Container not found:', containerId);
        return;
    }

    const rect = containerEl.getBoundingClientRect();
    
    // alpha: true で背景透明
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0); // 完全透明
    containerEl.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = null; // 透明背景
    scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

    camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 100);
    camera.position.set(0, 0, 12);

    // ライティングを調整（背景透明でもカードが見えるように）
    const ambient = new THREE.AmbientLight(0x2a3550, 0.8);
    scene.add(ambient);
    const point = new THREE.PointLight(0xf59e0b, 0.4, 40);
    point.position.set(0, 5, 15);
    scene.add(point);

    gridGroup = new THREE.Group();
    scene.add(gridGroup);

    zoom = new ZoomController(camera, gridGroup);

    // Event listeners
    containerEl.addEventListener('wheel', onWheel, { passive: true });
    containerEl.addEventListener('mousemove', onMouseMove);
    containerEl.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    // Touch events
    let touchStartY = 0;
    containerEl.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; });
    containerEl.addEventListener('touchmove', (e) => {
        if (zoom.isZoomed) return;
        const dy = touchStartY - e.touches[0].clientY;
        targetScrollY += dy * 0.005;
        const maxScroll = Math.max(0, (Math.ceil(sessions.length / 3) - 2) * 2.3);
        targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll));
        touchStartY = e.touches[0].clientY;
    });

    // Detail panel close button
    const closeBtn = document.getElementById('detail-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            zoom.zoomOut();
            hideDetail();
        });
    }

    loadSessions(counterId);
    animate();
    isInitialized = true;
    console.log('[devlog] Gallery initialized');
}

/**
 * devlog-{lang}.mdからログ本文を読み込み
 */
async function loadDevlogContent() {
    const lang = detectLangLocal();
    try {
        const res = await fetch(`./content/devlog-${lang}.md`);
        if (!res.ok) return null;
        const raw = await res.text();
        // frontmatterを除去して本文のみ取得
        const match = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
        return match ? match[1].trim() : raw.trim();
    } catch (e) {
        console.warn('[devlog] Failed to load devlog content:', e);
        return null;
    }
}

async function loadSessions(counterId) {
    const countEl = document.getElementById(counterId);
    
    // ログ本文を先に読み込み
    devlogContent = await loadDevlogContent();
    
    try {
        const res = await fetch(SESSIONS_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        sessions = await res.json();
        
        // 最新セッション（配列の先頭）にログ本文を設定
        if (sessions.length > 0 && devlogContent) {
            sessions[0].log_content = devlogContent;
        }
        
        if (countEl) countEl.textContent = `${sessions.length} sessions`;
        buildGallery();
    } catch (e) {
        console.warn('sessions.json not found, using demo data:', e.message);
        sessions = generateDemoData();
        
        // デモデータでも最新セッションにログ本文を設定
        if (sessions.length > 0 && devlogContent) {
            sessions[0].log_content = devlogContent;
        }
        
        if (countEl) countEl.textContent = `${sessions.length} sessions (demo)`;
        buildGallery();
    }
}

function generateDemoData() {
    const cats = ['shader', 'document', 'config', 'code', 'asset', 'infra'];
    const colors = {
        shader: '#1a237e', document: '#f59e0b', config: '#94a3b8',
        code: '#22c55e', asset: '#a855f7', infra: '#ef4444'
    };
    const demo = [];
    for (let i = 0; i < 18; i++) {
        const cat = cats[i % cats.length];
        demo.push({
            id: `dm${String(i + 1).padStart(3, '0')}`,
            repo: 'kesson-space',
            start: new Date(2026, 1, 10 + Math.floor(i / 3), 3 + i, 0).toISOString(),
            end: new Date(2026, 1, 10 + Math.floor(i / 3), 5 + i, 42).toISOString(),
            duration_min: 90 + Math.floor(Math.random() * 120),
            commit_count: Math.floor(Math.random() * 30) + 3,
            files_changed: [`src/shaders/test${i}.js`, `docs/README.md`],
            insertions: Math.floor(Math.random() * 300) + 20,
            deletions: Math.floor(Math.random() * 100) + 5,
            dominant_category: cat,
            color: colors[cat],
            messages: [`commit ${i}`, `fix ${i}`, `update ${i}`],
            intensity: Math.random() * 0.8 + 0.2,
            texture_url: null,
            log_content: null
        });
    }
    return demo.reverse();
}

function buildGallery() {
    while (gridGroup.children.length) gridGroup.remove(gridGroup.children[0]);
    cards = [];
    const positions = createGrid(sessions.length, { columns: 3, cardSize: 2.0, gap: 0.3 });
    sessions.forEach((session, i) => {
        const card = createCard(session, positions[i]);
        card.userData.session = session;
        card.userData.gridPosition = positions[i].clone();
        gridGroup.add(card);
        cards.push(card);
    });
    console.log('[devlog] Gallery built with', cards.length, 'cards');
}

function onWheel(e) {
    if (zoom.isZoomed) return;
    targetScrollY += e.deltaY * SCROLL_SPEED;
    const maxScroll = Math.max(0, (Math.ceil(sessions.length / 3) - 2) * 2.3);
    targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll));
}

function onMouseMove(e) {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

function onClick() {
    if (zoom.isZoomed) {
        if (!hoveredCard) { zoom.zoomOut(); hideDetail(); }
        return;
    }
    if (hoveredCard) { zoom.zoomIn(hoveredCard); showDetail(hoveredCard.userData.session); }
}

function onKeyDown(e) {
    if (e.key === 'Escape' && zoom.isZoomed) { zoom.zoomOut(); hideDetail(); }
}

function onResize() {
    if (!containerEl || !renderer || !camera) return;
    const rect = containerEl.getBoundingClientRect();
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height);
}

/**
 * 安全なHTML描画（<a> と <hr> のみ許可）
 */
function safeHTML(text) {
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    // <a href="...">...</a> だけ復元（https:// のみ許可）
    escaped = escaped.replace(
        /&lt;a\s+href=&quot;(https:\/\/[^&]+)&quot;&gt;([^&]*?)&lt;\/a&gt;/g,
        '<a href="$1" target="_blank" rel="noopener">$2</a>'
    );

    // <hr> を復元
    escaped = escaped.replace(/&lt;hr&gt;/g, '<hr>');

    return escaped;
}

function showDetail(session) {
    const panel = document.getElementById('devlog-detail');
    if (!panel) return;
    
    const start = new Date(session.start);
    const end = new Date(session.end);
    
    // 日付と時刻を個別に生成
    const startDate = `${start.getMonth() + 1}/${start.getDate()}`;
    const endDate = `${end.getMonth() + 1}/${end.getDate()}`;
    const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    
    // 同日なら日付1回、異なれば両方表示
    const dateStr = startDate === endDate
        ? `${startDate} ${startTime} – ${endTime}`
        : `${startDate} ${startTime} – ${endDate} ${endTime}`;
    
    const dateEl = document.getElementById('detail-date');
    const metaEl = document.getElementById('detail-meta');
    const categoryEl = document.getElementById('detail-category');
    const commitsEl = document.getElementById('detail-commits');
    const insEl = document.getElementById('detail-ins');
    const delsEl = document.getElementById('detail-dels');
    const logContentEl = document.getElementById('detail-log-content');

    if (dateEl) dateEl.textContent = dateStr;
    if (metaEl) metaEl.textContent = `${session.repo} · ${session.duration_min}min`;
    if (categoryEl) {
        categoryEl.textContent = session.dominant_category;
        categoryEl.style.background = session.color + '33';
        categoryEl.style.color = session.color;
    }
    if (commitsEl) commitsEl.textContent = session.commit_count;
    if (insEl) insEl.textContent = `+${session.insertions}`;
    if (delsEl) delsEl.textContent = `-${session.deletions}`;
    
    // ログ本文（session.log_contentがあれば表示）
    if (logContentEl) {
        if (session.log_content) {
            const paragraphs = session.log_content.split(/\n\n+/).filter(p => p.trim());
            const html = paragraphs.map(p => {
                const trimmed = p.trim();
                if (trimmed === '<hr>') return '<hr class="log-separator">';
                return `<p>${safeHTML(trimmed)}</p>`;
            }).join('');
            logContentEl.innerHTML = `<h3>log</h3>${html}`;
            logContentEl.style.display = 'block';
        } else {
            logContentEl.style.display = 'none';
        }
    }
    
    panel.classList.add('visible');
}

function hideDetail() {
    const panel = document.getElementById('devlog-detail');
    if (panel) panel.classList.remove('visible');
}

function updateHover() {
    if (zoom.isAnimating) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cards, false);
    const newHovered = intersects.length > 0 ? intersects[0].object : null;
    if (hoveredCard && hoveredCard !== newHovered) hoveredCard.userData.setHover(false);
    if (newHovered && newHovered !== hoveredCard) newHovered.userData.setHover(true);
    hoveredCard = newHovered;
    if (renderer) renderer.domElement.style.cursor = hoveredCard ? 'pointer' : 'default';
}

function animate() {
    animationId = requestAnimationFrame(animate);
    scrollY += (targetScrollY - scrollY) * 0.08;
    gridGroup.position.y = scrollY;
    zoom.update();
    updateHover();
    const t = performance.now() * 0.001;
    cards.forEach((card, i) => {
        if (card.userData.updateBreath) card.userData.updateBreath(t + i * 0.3);
    });
    renderer.render(scene, camera);
}

/**
 * ギャラリーを破棄
 */
export function destroyDevlogGallery() {
    if (!isInitialized) return;
    
    if (animationId) cancelAnimationFrame(animationId);
    
    if (containerEl) {
        containerEl.removeEventListener('wheel', onWheel);
        containerEl.removeEventListener('mousemove', onMouseMove);
        containerEl.removeEventListener('click', onClick);
    }
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onResize);
    
    if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    }
    
    isInitialized = false;
}

// Auto-initialize when gallery section is visible (IntersectionObserver)
if (typeof window !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isInitialized) {
                console.log('[devlog] Section visible, initializing gallery');
                initDevlogGallery();
                observer.disconnect();
            }
        });
    }, { threshold: 0.1 });

    // Defer observation until DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const section = document.getElementById('devlog-gallery-section');
            if (section) {
                console.log('[devlog] Observing gallery section');
                observer.observe(section);
            } else {
                console.warn('[devlog] Gallery section not found');
            }
        });
    } else {
        const section = document.getElementById('devlog-gallery-section');
        if (section) {
            console.log('[devlog] Observing gallery section');
            observer.observe(section);
        } else {
            console.warn('[devlog] Gallery section not found');
        }
    }
}
