// nav-objects.js — 3Dナビゲーションオブジェクト（鬼火オーブ + HTMLラベル + Gemini星[GLTF]）

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { detectLang, t } from './i18n.js';
import { toggles, gemParams } from './config.js';
import { getScrollProgress } from './controls.js';

// --- 正三角形配置（XZ平面） ---
const TRI_R = 9;
const NAV_POSITIONS = [
    { position: [TRI_R * Math.sin(0),            -8, TRI_R * Math.cos(0)],            color: 0x6688cc },
    { position: [TRI_R * Math.sin(2*Math.PI/3),   -8, TRI_R * Math.cos(2*Math.PI/3)],  color: 0x7799dd },
    { position: [TRI_R * Math.sin(4*Math.PI/3),   -8, TRI_R * Math.cos(4*Math.PI/3)],  color: 0x5577bb },
];

const ORB_3D_RADIUS = 2.0;

let _labelElements = [];
let _gemLabelElement = null;
let _gemGroup = null;
let _gemMesh = null;
let _scene = null;
let _navMeshes = null;

// ========================================
// Gem オーブシェーダー（Gemini設計: Simplex Noise乱流 + Haloグロー）
// ========================================
const gemMeshVertexShader = /* glsl */ `
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
varying float vFresnel;

void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);

    vWorldNormal = worldNormal;
    vViewDir = viewDir;
    vWorldPos = worldPos.xyz;
    vFresnel = 1.0 - max(dot(worldNormal, viewDir), 0.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const gemMeshFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uGlowStrength;
uniform float uRimPower;
uniform float uInnerGlow;
uniform float uHover;
uniform float uTurbulence;
uniform float uHaloWidth;
uniform float uHaloIntensity;
uniform float uChromaticAberration;

varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
varying float vFresnel;

// --- Simplex Noise 3D ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
    // --- 呼吸 ---
    float breath = 1.0 + sin(uTime * 0.5) * 0.06;

    // --- 法線擾乱（Simplex Noise乱流） ---
    vec3 perturbedNormal = vWorldNormal;
    float noiseVal = snoise(vWorldPos * 3.0 + uTime * 0.4);
    float noiseVal2 = snoise(vWorldPos * 5.0 - uTime * 0.3 + 7.0);
    perturbedNormal += (noiseVal * 0.5 + noiseVal2 * 0.3) * uTurbulence * vWorldNormal;
    perturbedNormal = normalize(perturbedNormal);

    // --- 擾乱法線ベースのFresnel ---
    float fresnel = 1.0 - max(dot(perturbedNormal, vViewDir), 0.0);

    // --- Haloグロー（オーブ球のsmoothstep haloに対応） ---
    float halo = smoothstep(0.5 - uHaloWidth, 0.5 + uHaloWidth, fresnel);
    halo *= uHaloIntensity * breath;

    // --- フレネルリム ---
    float rim = pow(fresnel, uRimPower) * uGlowStrength * breath;

    // --- 内側グロー（正面向き = 暗め） ---
    float facing = max(dot(perturbedNormal, vViewDir), 0.0);
    float center = pow(facing, 3.0) * uInnerGlow;

    // --- カラーパレット（冷たい青紫） ---
    vec3 rimColor   = vec3(0.40, 0.55, 0.95);
    vec3 haloColor  = vec3(0.30, 0.42, 0.85);
    vec3 coreColor  = vec3(0.20, 0.28, 0.65);

    // --- 合成 ---
    vec3 color = vec3(0.0);
    color += coreColor * center;
    color += rimColor * rim;
    color += haloColor * halo;

    // --- 色収差（リムでR/Bシフト） ---
    float caBase = fresnel * uChromaticAberration;
    color.r += caBase * 0.8 * rimColor.r * uGlowStrength * breath;
    color.b += caBase * 1.2 * rimColor.b * uGlowStrength * breath;

    // --- ノイズシマー（乱流感） ---
    float shimmer = noiseVal * 0.04 * rim;
    color += shimmer * rimColor;

    // --- アルファ ---
    float alpha = rim * 0.9 + halo * 0.8 + center * 0.3;
    alpha = clamp(alpha, 0.0, 1.0);

    // --- ホバー ---
    color *= 1.0 + uHover * 0.5;
    alpha = min(alpha * (1.0 + uHover * 0.3), 1.0);

    if (alpha < 0.005) discard;

    gl_FragColor = vec4(color, alpha);
}
`;

// ========================================
// Gem Group 生成（hitSprite + GLTFメッシュ）
// ========================================
function createGemGroup() {
    const group = new THREE.Group();
    group.position.set(gemParams.posX, gemParams.posY, gemParams.posZ);

    // --- 不可視ヒットスプライト（レイキャスト用） ---
    const hitMat = new THREE.SpriteMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
    });
    const hitSprite = new THREE.Sprite(hitMat);
    const hitSize = gemParams.meshScale * 3.0;
    hitSprite.scale.set(hitSize, hitSize, 1);
    group.add(hitSprite);

    group.userData = {
        hitSprite,
        gemMesh: null,
    };

    // --- GLTFロード ---
    const loader = new GLTFLoader();
    loader.load(
        'assets/blender/gemini-logo.glb',
        (gltf) => {
            const loadedMesh = gltf.scene.children[0];
            if (!loadedMesh) return;

            // 法線を再計算
            if (loadedMesh.geometry) {
                loadedMesh.geometry.computeVertexNormals();
            }

            // ShaderMaterial（Gemini設計）
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:                 { value: 0.0 },
                    uGlowStrength:         { value: gemParams.glowStrength },
                    uRimPower:             { value: gemParams.rimPower },
                    uInnerGlow:            { value: gemParams.innerGlow },
                    uHover:                { value: 0.0 },
                    uTurbulence:           { value: gemParams.turbulence },
                    uHaloWidth:            { value: gemParams.haloWidth },
                    uHaloIntensity:        { value: gemParams.haloIntensity },
                    uChromaticAberration:  { value: gemParams.chromaticAberration },
                },
                vertexShader: gemMeshVertexShader,
                fragmentShader: gemMeshFragmentShader,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide,
            });

            loadedMesh.material = mat;
            loadedMesh.scale.setScalar(gemParams.meshScale);
            loadedMesh.renderOrder = 10;

            // Blenderモデルを起こす
            loadedMesh.rotation.x = Math.PI / 2;

            group.add(loadedMesh);
            group.userData.gemMesh = loadedMesh;
            _gemMesh = loadedMesh;

            console.log('[Gem] GLTF loaded:', loadedMesh.geometry.attributes.position.count, 'vertices');
        },
        undefined,
        (err) => {
            console.warn('[Gem] GLTF load failed, using fallback sphere:', err.message);
            const fallbackGeom = new THREE.IcosahedronGeometry(1.0, 2);
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime:                 { value: 0.0 },
                    uGlowStrength:         { value: gemParams.glowStrength },
                    uRimPower:             { value: gemParams.rimPower },
                    uInnerGlow:            { value: gemParams.innerGlow },
                    uHover:                { value: 0.0 },
                    uTurbulence:           { value: gemParams.turbulence },
                    uHaloWidth:            { value: gemParams.haloWidth },
                    uHaloIntensity:        { value: gemParams.haloIntensity },
                    uChromaticAberration:  { value: gemParams.chromaticAberration },
                },
                vertexShader: gemMeshVertexShader,
                fragmentShader: gemMeshFragmentShader,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide,
            });
            const fallback = new THREE.Mesh(fallbackGeom, mat);
            fallback.scale.setScalar(gemParams.meshScale);
            fallback.renderOrder = 10;
            group.add(fallback);
            group.userData.gemMesh = fallback;
            _gemMesh = fallback;
        }
    );

    return group;
}

// --- devPanelからのパラメータ更新 ---
export function rebuildGem() {
    if (!_gemMesh) return;
    _gemMesh.scale.setScalar(gemParams.meshScale);
    const u = _gemMesh.material.uniforms;
    if (u.uGlowStrength)        u.uGlowStrength.value = gemParams.glowStrength;
    if (u.uRimPower)            u.uRimPower.value = gemParams.rimPower;
    if (u.uInnerGlow)           u.uInnerGlow.value = gemParams.innerGlow;
    if (u.uTurbulence)          u.uTurbulence.value = gemParams.turbulence;
    if (u.uHaloWidth)           u.uHaloWidth.value = gemParams.haloWidth;
    if (u.uHaloIntensity)       u.uHaloIntensity.value = gemParams.haloIntensity;
    if (u.uChromaticAberration) u.uChromaticAberration.value = gemParams.chromaticAberration;
    if (_gemGroup) {
        const hit = _gemGroup.userData.hitSprite;
        if (hit) {
            const s = gemParams.meshScale * 3.0;
            hit.scale.set(s, s, 1);
        }
    }
}

// --- devPanelからの位置更新 ---
export function updateGemPosition() {
    if (!_gemGroup) return;
    _gemGroup.userData.baseY = gemParams.posY;
    _gemGroup.position.set(gemParams.posX, gemParams.posY, gemParams.posZ);
}

// ========================================
// HTMLラベル
// ========================================
function injectNavLabelStyles() {
    if (document.getElementById('nav-label-styles')) return;
    const style = document.createElement('style');
    style.id = 'nav-label-styles';
    style.textContent = `
        .nav-label {
            position: fixed;
            z-index: 15;
            pointer-events: none;
            color: rgba(255, 255, 255, 0.9);
            font-family: "Sawarabi Mincho", "Yu Mincho", "Hiragino Mincho ProN", serif;
            font-size: clamp(0.55rem, 2.8vw, 1.1rem);
            letter-spacing: clamp(0.05em, 0.4vw, 0.15em);
            text-shadow: 0 0 12px rgba(100, 150, 255, 0.5), 0 0 4px rgba(0, 0, 0, 0.8);
            transform: translate(-50%, -100%);
            white-space: nowrap;
            transition: filter 0.15s ease, opacity 0.3s ease;
            will-change: filter;
        }
        .nav-label--gem {
            color: rgba(180, 195, 240, 0.85);
            text-shadow: 0 0 12px rgba(123, 143, 232, 0.5), 0 0 4px rgba(0, 0, 0, 0.8);
        }
    `;
    document.head.appendChild(style);
}

function createHtmlLabel(text, extraClass) {
    const el = document.createElement('div');
    el.className = 'nav-label' + (extraClass ? ' ' + extraClass : '');
    el.textContent = text;
    document.body.appendChild(el);
    return el;
}

// ========================================
// 公開API
// ========================================
export function createNavObjects(scene) {
    _scene = scene;
    const navMeshes = [];
    const lang = detectLang();
    const strings = t(lang);

    injectNavLabelStyles();

    // --- PDFオーブ（既存） ---
    NAV_POSITIONS.forEach((pos, index) => {
        const navItem = strings.nav[index];
        const group = new THREE.Group();
        group.position.set(...pos.position);

        const hitMaterial = new THREE.SpriteMaterial({
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
        });
        const coreSprite = new THREE.Sprite(hitMaterial);
        coreSprite.scale.set(4.0, 4.0, 4.0);

        coreSprite.userData = {
            type: 'nav',
            url: navItem.url,
            label: navItem.label,
            baseY: pos.position[1],
            index,
            isHitTarget: true,
        };

        group.add(coreSprite);

        group.userData = {
            baseY: pos.position[1],
            index: index,
            core: coreSprite,
            baseScale: 4.0,
        };

        scene.add(group);
        navMeshes.push(group);

        _labelElements.push(createHtmlLabel(navItem.label));
    });

    // --- Gemini Gem（GLTF Group） ---
    const gemData = strings.gem;
    const gemGroup = createGemGroup();
    const gemIndex = navMeshes.length;

    gemGroup.userData.hitSprite.userData = {
        type: 'nav',
        url: gemData.url,
        label: gemData.label,
        isGem: true,
        external: true,
    };

    Object.assign(gemGroup.userData, {
        baseY: gemParams.posY,
        index: gemIndex,
        isGem: true,
    });

    scene.add(gemGroup);
    navMeshes.push(gemGroup);
    _gemGroup = gemGroup;
    _navMeshes = navMeshes;

    _gemLabelElement = createHtmlLabel(gemData.label, 'nav-label--gem');

    return navMeshes;
}

export function updateNavObjects(navMeshes, time, camera) {
    navMeshes.forEach((obj) => {
        const data = obj.userData;

        if (data.isGem) {
            // Y浮遊
            obj.position.y = data.baseY + Math.sin(time * 0.6 + 2.0) * 0.4;

            // GLTFメッシュ: ゆっくり自転
            const mesh = data.gemMesh;
            if (mesh) {
                mesh.rotation.x = Math.PI / 2 + Math.sin(time * 0.3) * 0.1;
                mesh.rotation.z = time * 0.25;

                const u = mesh.material.uniforms;
                if (u.uTime) u.uTime.value = time;
            }
        } else {
            const floatOffset = Math.sin(time * 0.8 + data.index) * 0.3;
            obj.position.y = data.baseY + floatOffset;
        }
    });
}

// --- Gemホバー制御 ---
export function setGemHover(isHovered) {
    if (_gemMesh && _gemMesh.material.uniforms.uHover) {
        _gemMesh.material.uniforms.uHover.value = isHovered ? 1.0 : 0.0;
    }
}

// --- HTMLラベルの位置更新 ---
const _labelWorldPos = new THREE.Vector3();
const LABEL_Y_OFFSET = 3.5;
const GEM_LABEL_Y_OFFSET = 3.5;

let _gazeX = 0.5;
let _gazeY = 0.5;

function initGazeTracking() {
    if (window._gazeTrackingInit) return;
    window._gazeTrackingInit = true;
    window.addEventListener('mousemove', (e) => {
        _gazeX = e.clientX / window.innerWidth;
        _gazeY = e.clientY / window.innerHeight;
    });
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            _gazeX = e.touches[0].clientX / window.innerWidth;
            _gazeY = e.touches[0].clientY / window.innerHeight;
        }
    });
}

function updateSingleLabel(el, worldPos, yOffset, camera, scrollFade) {
    worldPos.y += yOffset;
    worldPos.project(camera);

    if (worldPos.z > 1.0) {
        el.style.opacity = '0';
        return;
    }

    const x = ( worldPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;

    el.style.left = x + 'px';
    el.style.top = y + 'px';

    const labelNdcX = x / window.innerWidth;
    const labelNdcY = y / window.innerHeight;
    const dx = labelNdcX - _gazeX;
    const dy = labelNdcY - _gazeY;
    const gazeDist = Math.sqrt(dx * dx + dy * dy);
    const blurPx = Math.max(0, (gazeDist - 0.15) * 8.0);
    const clampedBlur = Math.min(blurPx, 4.0);
    el.style.filter = `blur(${clampedBlur.toFixed(1)}px)`;
    el.style.opacity = String(scrollFade);
}

export function updateNavLabels(navMeshes, camera) {
    initGazeTracking();

    const visible = toggles.navOrbs;
    const scrollFade = Math.max(0, 1 - getScrollProgress() * 5);

    navMeshes.forEach((group, i) => {
        if (group.userData.isGem) return;

        const el = _labelElements[i];
        if (!el) return;

        if (!visible || scrollFade <= 0) {
            el.style.opacity = '0';
            return;
        }

        group.getWorldPosition(_labelWorldPos);
        updateSingleLabel(el, _labelWorldPos, LABEL_Y_OFFSET, camera, scrollFade);
    });

    if (_gemLabelElement && _gemGroup) {
        if (!visible || scrollFade <= 0) {
            _gemLabelElement.style.opacity = '0';
            return;
        }

        _gemGroup.getWorldPosition(_labelWorldPos);
        updateSingleLabel(_gemLabelElement, _labelWorldPos, GEM_LABEL_Y_OFFSET, camera, scrollFade);
    }
}

// --- スクリーン座標 + 射影半径の計算 ---
const _orbCenter = new THREE.Vector3();
const _orbEdge = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _centerNDC = new THREE.Vector3();
const _edgeNDC = new THREE.Vector3();

export function getOrbScreenData(navMeshes, camera) {
    const data = [];
    navMeshes.forEach(group => {
        if (group.userData.isGem) return;

        if (group.userData.core) {
            group.userData.core.getWorldPosition(_orbCenter);
        } else {
            group.getWorldPosition(_orbCenter);
        }
        camera.getWorldDirection(_camRight);
        _camRight.cross(camera.up).normalize();
        _orbEdge.copy(_orbCenter).addScaledVector(_camRight, ORB_3D_RADIUS);

        _centerNDC.copy(_orbCenter).project(camera);
        _edgeNDC.copy(_orbEdge).project(camera);

        const cx = (_centerNDC.x * 0.5) + 0.5;
        const cy = (_centerNDC.y * 0.5) + 0.5;
        const ex = (_edgeNDC.x * 0.5) + 0.5;
        const ey = (_edgeNDC.y * 0.5) + 0.5;
        const dx = (ex - cx) * (window.innerWidth / window.innerHeight);
        const dy = ey - cy;
        const screenRadius = Math.sqrt(dx * dx + dy * dy);
        let strength = 1.0;
        if (_centerNDC.z > 1.0) strength = 0.0;
        data.push({ x: cx, y: cy, strength, radius: screenRadius });
    });
    return data;
}
