// scene.js — 統合グラフィック
// uMix: 0.0 = v002(deep dark) ↔ 1.0 = v004(slate blue)
// timeで自動的に行き来する
// kesson light 無効版（比較用）

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

let _waterMaterial;
let _particles;
let _camera;
let _bgMat;
let _scene;

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

// 遷移周期（秒）
const MIX_CYCLE = 30.0;

export function createScene(container) {
    const scene = new THREE.Scene();
    _scene = scene;

    scene.fog = new THREE.FogExp2(FOG_V004_COLOR.getHex(), FOG_V004_DENSITY);

    // 背景シェーダー
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

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 35, 25);
    camera.lookAt(0, -5, -10);
    _camera = camera;

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

    // --- kesson light 無効化（比較用） ---
    // 復活させる場合はここにkesson meshesの生成コードを戻す

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

    return { scene, camera, renderer, kessonMeshes: [] };
}

export function updateScene(time) {
    const m = (Math.sin(time * Math.PI / MIX_CYCLE) + 1.0) * 0.5;

    // 背景
    _bgMat.uniforms.uMix.value = m;

    // Fog
    const fogColor = new THREE.Color().lerpColors(FOG_V002_COLOR, FOG_V004_COLOR, m);
    _scene.fog.color.copy(fogColor);
    _scene.fog.density = FOG_V002_DENSITY + (FOG_V004_DENSITY - FOG_V002_DENSITY) * m;

    // 水面
    _waterMaterial.uniforms.uTime.value = time;

    // 粒子
    _particles.rotation.y = time * 0.01;
}
