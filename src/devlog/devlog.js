/**
 * devlog.js — Devlog Gallery エントリポイント
 *
 * コミットセッションをInstagram風3Dグリッドとして表示する。
 * kesson-spaceの闇の中に光のカードが浮かぶ。
 */

import * as THREE from 'three';
import { createGrid } from './grid.js';
import { createCard } from './card.js';
import { ZoomController } from './zoom.js';

const BG_COLOR = new THREE.Color(0x0a0e1a);
const FOG_COLOR = new THREE.Color(0x0a0e1a);
const FOG_NEAR = 15;
const FOG_FAR = 50;
const SESSIONS_URL = './assets/devlog/sessions.json';
const SCROLL_SPEED = 0.008;

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = BG_COLOR;
scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

const camera = new THREE.PerspectiveCamera(
    50, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 0, 12);

const ambient = new THREE.AmbientLight(0x1a2235, 0.5);
scene.add(ambient);
const point = new THREE.PointLight(0xf59e0b, 0.3, 30);
point.position.set(0, 5, 10);
scene.add(point);

let sessions = [];
let cards = [];
let scrollY = 0;
let targetScrollY = 0;
let gridGroup = new THREE.Group();
scene.add(gridGroup);

const zoom = new ZoomController(camera, gridGroup);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredCard = null;

async function loadSessions() {
    try {
        const res = await fetch(SESSIONS_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        sessions = await res.json();
        document.getElementById('session-count').textContent = `${sessions.length} sessions`;
        buildGallery();
    } catch (e) {
        console.warn('sessions.json not found, using demo data:', e.message);
        sessions = generateDemoData();
        document.getElementById('session-count').textContent = `${sessions.length} sessions (demo)`;
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
            texture_url: null
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
}

function onWheel(e) {
    if (zoom.isZoomed) return;
    targetScrollY += e.deltaY * SCROLL_SPEED;
    const maxScroll = Math.max(0, (Math.ceil(sessions.length / 3) - 2) * 2.3);
    targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll));
}

function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
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

function showDetail(session) {
    const panel = document.getElementById('devlog-detail');
    const start = new Date(session.start);
    const end = new Date(session.end);
    const dateStr = `${start.getMonth() + 1}/${start.getDate()} `
        + `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
        + ` – ${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    document.getElementById('detail-date').textContent = dateStr;
    document.getElementById('detail-meta').textContent = `${session.repo} · ${session.duration_min}min`;
    const badge = document.getElementById('detail-category');
    badge.textContent = session.dominant_category;
    badge.style.background = session.color + '33';
    badge.style.color = session.color;
    document.getElementById('detail-commits').textContent = session.commit_count;
    document.getElementById('detail-ins').textContent = `+${session.insertions}`;
    document.getElementById('detail-dels').textContent = `-${session.deletions}`;
    document.getElementById('detail-files').innerHTML = session.files_changed.slice(0, 20).map(f => `<li>${f}</li>`).join('');
    document.getElementById('detail-messages').innerHTML = session.messages.map(m => `<li>${m}</li>`).join('');
    panel.classList.add('visible');
}

function hideDetail() {
    document.getElementById('devlog-detail').classList.remove('visible');
}

document.getElementById('detail-close').addEventListener('click', () => {
    zoom.zoomOut(); hideDetail();
});

function updateHover() {
    if (zoom.isAnimating) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cards, false);
    const newHovered = intersects.length > 0 ? intersects[0].object : null;
    if (hoveredCard && hoveredCard !== newHovered) hoveredCard.userData.setHover(false);
    if (newHovered && newHovered !== hoveredCard) newHovered.userData.setHover(true);
    hoveredCard = newHovered;
    renderer.domElement.style.cursor = hoveredCard ? 'pointer' : 'default';
}

function animate() {
    requestAnimationFrame(animate);
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('wheel', onWheel, { passive: true });
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onClick);
window.addEventListener('keydown', onKeyDown);

let touchStartY = 0;
window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; });
window.addEventListener('touchmove', (e) => {
    if (zoom.isZoomed) return;
    const dy = touchStartY - e.touches[0].clientY;
    targetScrollY += dy * 0.005;
    const maxScroll = Math.max(0, (Math.ceil(sessions.length / 3) - 2) * 2.3);
    targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll));
    touchStartY = e.touches[0].clientY;
});

loadSessions();
animate();
