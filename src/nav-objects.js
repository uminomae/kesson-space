// nav-objects.js — 3Dナビゲーションオブジェクト（重力レンズオーブ + 浮遊テキスト）

import * as THREE from 'three';
import { detectLang, t } from './i18n.js';

// --- ナビ配置定数 ---
const NAV_POSITIONS = [
    { position: [-12, -8, -5], color: 0x6688cc },
    { position: [0, -8, -5],   color: 0x7799dd },
    { position: [12, -8, -5],  color: 0x5577bb },
];

const SPHERE_RADIUS = 1.8;
const SPHERE_SEGMENTS = 64;

// --- ヘルパー: 重力レンズ球体（空間歪みエフェクト）---
function createGravityOrb(colorHex) {
    const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
    const color = new THREE.Color(colorHex);

    const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 1.0,
        thickness: 3.5,
        ior: 2.0,
        transparent: true,
        opacity: 1.0,
        attenuationColor: color,
        attenuationDistance: 5.0,
        envMapIntensity: 0.3,
        clearcoat: 0.1,
        clearcoatRoughness: 0.4,
        side: THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
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
    ctx.font = '36px "Yu Mincho", "YuMincho", "Hiragino Mincho ProN", serif';

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

    // transmission が機能するためのアンビエントライト（存在しなければ追加）
    const hasAmbient = scene.children.some(c => c.isAmbientLight);
    if (!hasAmbient) {
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    }

    NAV_POSITIONS.forEach((pos, index) => {
        const navItem = strings.nav[index];
        const group = new THREE.Group();
        group.position.set(...pos.position);

        // 重力レンズオーブ
        const orb = createGravityOrb(pos.color);

        orb.userData = {
            type: 'nav',
            url: navItem.url,
            label: navItem.label,
            baseY: pos.position[1],
            index,
            isHitTarget: true,
        };

        // ラベル
        const labelSprite = createFloatingTextSprite(navItem.label);
        labelSprite.position.set(0, SPHERE_RADIUS + 1.5, 0);

        group.add(orb);
        group.add(labelSprite);

        group.userData = {
            baseY: pos.position[1],
            index: index,
            core: orb,
            baseScale: 1.0,
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

        // 浮遊
        const floatOffset = Math.sin(time * 0.8 + data.index) * 0.3;
        group.position.y = data.baseY + floatOffset;

        if (data.core) {
            const mat = data.core.material;

            // 脈動: ior を微妙に揺らして歪み感を呼吸させる
            mat.ior = 1.8 + Math.sin(time * 1.2 + data.index * 2.0) * 0.3;
            mat.thickness = 3.0 + Math.sin(time * 0.9 + data.index * 1.5) * 0.8;

            // ゆっくり回転（球体の微妙な歪みが見える）
            data.core.rotation.y = time * 0.2 + data.index;
            data.core.rotation.x = Math.sin(time * 0.3 + data.index) * 0.15;
        }
    });
}
