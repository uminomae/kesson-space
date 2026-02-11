// main.js — エントリポイント
// DEV_MODE: URLに ?dev を付けるとパラメータ調整パネルを表示
// 言語: ?lang=en で英語表示

import * as THREE from 'three';
import { createScene, updateScene, sceneParams, getCamera } from './scene.js';
import { initControls, updateControls, setAutoRotateSpeed, setCameraPosition, setTarget } from './controls.js';
import { initNavigation, updateNavigation } from './navigation.js';
import { initLangToggle } from './lang-toggle.js';
import { detectLang, t } from './i18n.js';

// ============================
// DEV_MODE: ?dev でパネル表示
// ============================
const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

// ============================
// 言語初期化
// ============================
const lang = detectLang();
const strings = t(lang);

// HTMLオーバーレイのテキストを言語に合わせて更新
const titleH1 = document.getElementById('title-h1');
const titleSub = document.getElementById('title-sub');
if (titleH1) titleH1.textContent = strings.title;
if (titleSub) titleSub.textContent = strings.subtitle;

// タグライン
const taglineContainer = document.getElementById('taglines');
if (taglineContainer && strings.taglines) {
    taglineContainer.innerHTML = '';
    const isEn = lang === 'en';
    strings.taglines.forEach(text => {
        const p = document.createElement('p');
        p.className = isEn ? 'tagline-en' : 'tagline';
        p.textContent = text;
        taglineContainer.appendChild(p);
    });
}

// html lang属性を更新
document.documentElement.lang = lang;

// 言語トグルボタン
initLangToggle();

const container = document.getElementById('canvas-container');
const { scene, camera, renderer } = createScene(container);

initControls(camera, container, renderer);
initNavigation({ scene, camera, renderer });

// --- HTMLオーバーレイの動的更新 ---
function updateOverlay(key, val) {
    const overlay = document.getElementById('overlay');
    const h1 = document.getElementById('title-h1');
    const sub = document.getElementById('title-sub');
    if (!overlay || !h1 || !sub) return;

    switch (key) {
        case 'titleBottom':
            overlay.style.bottom = val + 'px';
            break;
        case 'titleLeft':
            overlay.style.left = val + 'px';
            break;
        case 'titleSize':
            h1.style.fontSize = val + 'rem';
            break;
        case 'titleSpacing':
            h1.style.letterSpacing = val + 'em';
            break;
        case 'titleOpacity':
            h1.style.color = `rgba(255, 255, 255, ${val})`;
            break;
        case 'subSize':
            sub.style.fontSize = val + 'rem';
            break;
        case 'subOpacity':
            sub.style.color = `rgba(255, 255, 255, ${val})`;
            sub.style.opacity = val;
            sub.style.animation = 'none';
            break;
        case 'titleGlow':
            h1.style.textShadow = `0 0 ${val}px rgba(100, 150, 255, 0.3)`;
            break;
    }
}

// --- devパネル ---
if (DEV_MODE) {
    import('./dev-panel.js').then(({ initDevPanel }) => {
        initDevPanel((key, value) => {
            if (key in sceneParams) {
                sceneParams[key] = value;
            }

            if (key === 'camX' || key === 'camY' || key === 'camZ') {
                setCameraPosition(sceneParams.camX, sceneParams.camY, sceneParams.camZ);
            }
            if (key === 'camTargetY') {
                setTarget(0, value, -10);
            }

            if (key === 'autoRotateSpd') {
                setAutoRotateSpeed(value);
            }

            updateOverlay(key, value);
        });
    });
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    updateControls(time);
    updateScene(time);
    updateNavigation(time);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
