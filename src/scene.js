// scene.js — 統合グラフィック
// uMix: 0.0 = v002(deep dark / voidHole) ↔ 1.0 = v004(slate blue / soul core)

import * as THREE from 'three';

const noiseGLSL = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
`;

// --- 内部参照 ---
let _waterMaterial;
let _kessonMeshes = [];
let _particles;
let _camera;
let _bgMat;
let _scene;

// --- Mix制御 ---
let _mixTarget = 1.0;  // 目標値
let _mixCurrent = 1.0;  // 現在値
const MIX_SPEED = 1.5;  // 秒速

// v002: deep dark
const BG_V002_CENTER = new THREE.Color(0x050508);
const BG_V002_EDGE = new THREE.Color(0x050508);
const FOG_V002_COLOR = new THREE.Color(0x050508);
const FOG_V002_DENSITY = 0.025;

// v004: slate blue gradient
const BG_V004_CENTER = new THREE.Color(0x2a3a4a);
const BG_V004_EDGE = new THREE.Color(0x0a1520);
const FOG_V004_COLOR = new THREE.Color(0x0a1520);
const FOG_V004_DENSITY = 0.02;

/**
 * Mix値を設定（0.0=v002, 1.0=v004）
 * アニメーションで滑らかに遷移
 */
export function setMix(value) {
    _mixTarget = Math.max(0, Math.min(1, value));
}

export function getMix() {
    return _mixTarget;
}

export function createScene(container) {
    const scene = new THREE.Scene();
    _scene = scene;

    scene.fog = new THREE.FogExp2(FOG_V004_COLOR.getHex(), FOG_V004_DENSITY);

    // 背景シェーダー: uMixで単色↔グラデーションを補間
    const bgGeo = new THREE.PlaneGeometry(2, 2);
    _bgMat = new THREE.ShaderMaterial({
        uniforms: {
            uColorCenterA: { value: BG_V002_CENTER },
            uColorEdgeA:   { value: BG_V002_EDGE },
            uColorCenterB: { value: BG_V004_CENTER },
            uColorEdgeB:   { value: BG_V004_EDGE },
            uMix: { value: 1.0 },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColorCenterA;
            uniform vec3 uColorEdgeA;
            uniform vec3 uColorCenterB;
            uniform vec3 uColorEdgeB;
            uniform float uMix;
            varying vec2 vUv;
            void main() {
                float dist = length(vUv - 0.5);
                float vignette = smoothstep(0.0, 1.2, dist);

                vec3 colorA = mix(uColorCenterA, uColorEdgeA, vignette);
                vec3 colorB = mix(uColorCenterB, uColorEdgeB, vignette);
                vec3 color = mix(colorA, colorB, uMix);

                float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
                color += (noise - 0.5) * 0.015;

                gl_FragColor = vec4(color, 1.0);
            }
        `,
        depthWrite: false,
        depthTest: false
    });
    const bgMesh = new THREE.Mesh(bgGeo, _bgMat);
    bgMesh.renderOrder = -999;
    scene.add(bgMesh);

    // カメラ
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 35, 25);
    camera.lookAt(0, -5, -10);
    _camera = camera;

    // レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 水面
    _waterMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uColor: { value: new THREE.Color(0x1a1a2e) }
        },
        vertexShader: `
            uniform float uTime;
            varying vec2 vUv;
            ${noiseGLSL}
            void main() {
                vUv = uv;
                vec3 pos = position;
                float noise = snoise(vec2(pos.x * 0.03 + uTime * 0.05, pos.y * 0.03 - uTime * 0.05));
                pos.z += noise * 1.5;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
                float alpha = 0.2 * (1.0 - smoothstep(0.4, 0.6, abs(vUv.x - 0.5)));
                gl_FragColor = vec4(uColor, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });
    const waterGeo = new THREE.PlaneGeometry(300, 300, 60, 60);
    const water = new THREE.Mesh(waterGeo, _waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -20;
    scene.add(water);

    // 光（欠損）シェーダー: uMixで voidHole ↔ soul core を補間
    const kessonMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uColor: { value: new THREE.Color(0xffffff) },
            uOffset: { value: 0.0 },
            uMix: { value: 1.0 },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                mvPosition.xy += position.xy;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uTime;
            uniform float uOffset;
            uniform float uMix;
            varying vec2 vUv;
            ${noiseGLSL}

            mat2 rot(float a) {
                float s = sin(a), c = cos(a);
                return mat2(c, -s, s, c);
            }

            void main() {
                vec2 uv = (vUv - 0.5) * 2.0;
                float t = uTime * 0.15 + uOffset;

                vec2 p = uv;
                float amplitude = 0.6;

                for(int i = 0; i < 3; i++) {
                    p += vec2(snoise(p + t), snoise(p - t)) * amplitude;
                    p *= rot(t * 0.1);
                    amplitude *= 0.5;
                }

                float dist = length(p);

                // --- v002: voidHole ---
                float coreA = 0.08 / (dist + 0.01);
                float patternA = sin(p.x * 12.0 + t) * sin(p.y * 12.0 - t) * 0.1;
                float voidHole = smoothstep(0.0, 0.4, dist);
                float breathA = 0.7 + 0.3 * sin(uTime * 1.2 + uOffset * 10.0);
                float alphaA = (coreA + patternA) * voidHole * breathA;
                alphaA = smoothstep(0.01, 1.0, alphaA);
                vec3 colorA = mix(uColor, vec3(1.0), coreA * 0.5);

                // --- v004: soul core ---
                float glowIntensity = 0.12 / (dist * dist + 0.02);
                vec3 coreWhite = vec3(1.0, 1.0, 1.0);
                vec3 innerHalo = vec3(0.7, 0.85, 1.0);
                vec3 colorB = mix(uColor, innerHalo, smoothstep(0.5, 3.0, glowIntensity));
                colorB = mix(colorB, coreWhite, smoothstep(3.0, 8.0, glowIntensity));
                float edgePattern = snoise(p * 4.0 + t) * 0.5 + 0.5;
                float alphaB = smoothstep(0.0, 1.0, glowIntensity * 0.5);
                float noiseBlend = smoothstep(2.0, 0.5, glowIntensity);
                alphaB *= mix(1.0, edgePattern, noiseBlend);
                float breathB = 0.85 + 0.15 * sin(uTime * 1.5 + uOffset * 10.0);
                alphaB *= breathB;

                // --- mix ---
                float alpha = mix(alphaA, alphaB, uMix);
                vec3 finalColor = mix(colorA, colorB * 1.5, uMix);

                if(alpha < 0.01) discard;

                gl_FragColor = vec4(finalColor, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    // 配置
    const warmColors = [0xff7744, 0xff9955, 0xff5522];
    const coolColors = [0x4477ff, 0x5599ff, 0x2255ee];
    const kessonMeshes = [];
    const kessonGeo = new THREE.PlaneGeometry(12, 12);

    for (let i = 0; i < 40; i++) {
        const isWarm = Math.random() > 0.5;
        const colorPalette = isWarm ? warmColors : coolColors;
        const colorStr = colorPalette[Math.floor(Math.random() * colorPalette.length)];

        const mat = kessonMaterial.clone();
        mat.uniforms.uColor.value = new THREE.Color(colorStr);
        mat.uniforms.uOffset.value = Math.random() * 1000.0;

        const mesh = new THREE.Mesh(kessonGeo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 90,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 60 - 10
        );

        mesh.userData = {
            baseY: mesh.position.y,
            baseX: mesh.position.x,
            speed: 0.05 + Math.random() * 0.15,
            id: i
        };

        scene.add(mesh);
        kessonMeshes.push(mesh);
    }
    _kessonMeshes = kessonMeshes;

    // 粒子
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 1500;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 160;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xaaccff,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    _particles = new THREE.Points(particleGeo, particleMat);
    scene.add(_particles);

    return { scene, camera, renderer, kessonMeshes };
}

export function updateScene(time) {
    // --- Mixアニメーション ---
    const dt = 1 / 60; // 粗いが十分
    if (Math.abs(_mixCurrent - _mixTarget) > 0.001) {
        _mixCurrent += (_mixTarget - _mixCurrent) * MIX_SPEED * dt;
    } else {
        _mixCurrent = _mixTarget;
    }
    const m = _mixCurrent;

    // 背景
    _bgMat.uniforms.uMix.value = m;

    // Fog: 色と密度をlerp
    const fogColor = new THREE.Color().lerpColors(FOG_V002_COLOR, FOG_V004_COLOR, m);
    _scene.fog.color.copy(fogColor);
    _scene.fog.density = FOG_V002_DENSITY + (FOG_V004_DENSITY - FOG_V002_DENSITY) * m;

    // 水面
    _waterMaterial.uniforms.uTime.value = time;

    // 光
    _kessonMeshes.forEach(mesh => {
        mesh.material.uniforms.uTime.value = time;
        mesh.material.uniforms.uMix.value = m;
        mesh.position.y = mesh.userData.baseY + Math.sin(time * mesh.userData.speed + mesh.userData.id) * 2;
        mesh.position.x = mesh.userData.baseX + Math.cos(time * mesh.userData.speed * 0.5 + mesh.userData.id) * 2;
        mesh.lookAt(_camera.position);
    });

    _particles.rotation.y = time * 0.01;
}
