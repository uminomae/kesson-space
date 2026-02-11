// nav-objects.js — 3Dナビゲーションオブジェクト（鬼火オーブ + 浮遊テキスト）

import * as THREE from 'three';
import { detectLang, t } from './i18n.js';

// --- ナビ配置定数 ---
const NAV_POSITIONS = [
    { position: [-12, -8, -5], color: 0x6688cc },
    { position: [0, -8, -5],   color: 0x7799dd },
    { position: [12, -8, -5],  color: 0x5577bb },
];

// --- ヘルパー: 光のオーブ（鬼火）テクスチャ生成 ---
function createGlowTexture(colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    const color = new THREE.Color(colorHex);

    gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
    gradient.addColorStop(0.3, `rgba(${color.r*255|0}, ${color.g*255|0}, ${color.b*255|0}, 0.8)`);
    gradient.addColorStop(1, `rgba(${color.r*255|0}, ${color.g*255|0}, ${color.b*255|0}, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// --- ヘルパー: 浮遊テキスト生成 ---
function createFloatingTextSprite(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(200, 220, 255, 0.8)';
    ctx.shadowBlur = 15;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '48px "Yu Mincho", "YuMincho", "Hiragino Mincho ProN", serif';

    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(12, 3, 1);

    return sprite;
}

// --- ナビオブジェクト作成 ---
export function createNavObjects(scene) {
    const navMeshes = [];
    const lang = detectLang();
    const strings = t(lang);

    NAV_POSITIONS.forEach((pos, index) => {
        const navItem = strings.nav[index];
        const group = new THREE.Group();
        group.position.set(...pos.position);

        const glowMaterial = new THREE.SpriteMaterial({
            map: createGlowTexture(pos.color),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const coreSprite = new THREE.Sprite(glowMaterial);
        coreSprite.scale.set(4.0, 4.0, 4.0);

        coreSprite.userData = {
            type: 'nav',
            url: navItem.url,
            label: navItem.label,
            baseY: pos.position[1],
            index,
            isHitTarget: true,
        };

        const labelSprite = createFloatingTextSprite(navItem.label);
        labelSprite.position.set(0, 2.0, 0);

        group.add(coreSprite);
        group.add(labelSprite);

        group.userData = {
            baseY: pos.position[1],
            index: index,
            core: coreSprite,
            baseScale: 4.0,
        };

        scene.add(group);
        navMeshes.push(group);
    });

    return navMeshes;
}

// --- アニメーション更新 ---
export function updateNavObjects(navMeshes, time) {
    navMeshes.forEach((group) => {
        const data = group.userData;

        const floatOffset = Math.sin(time * 0.8 + data.index) * 0.3;
        group.position.y = data.baseY + floatOffset;

        if (data.core) {
            const pulse = 1.0 + Math.sin(time * 1.5 + data.index * 2.0) * 0.1;
            const base = data.baseScale || 4.0;
            data.core.scale.set(base * pulse, base * pulse, base * pulse);
            data.core.material.opacity = 0.7 + Math.sin(time * 1.5 + data.index * 2.0) * 0.3;
        }
    });
}
