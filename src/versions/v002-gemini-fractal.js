// v002-gemini-fractal: Gemini Domain Warping版（2026-02-11 Session #2）
// 判定: ◎ ベース採用
// プロンプト: P001（初回・手動投入）
// 変更: 背景深化、光シェーダーDomain Warping化、配置・動き調整

import * as THREE from 'three';

// --- 初期設定 ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// 背景とFog: より深く青みのある闇
const darkColor = 0x050508;
const fogColor = 0x050508;
scene.background = new THREE.Color(darkColor);
scene.fog = new THREE.FogExp2(fogColor, 0.025);

// L0: 意識の視点
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 35, 25);
camera.lookAt(0, -5, -10);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// --- シェーダー共通 (Simplex Noise) ---
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

// --- 水面（縁）---
const waterMaterial = new THREE.ShaderMaterial({
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
const water = new THREE.Mesh(waterGeo, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = -20;
scene.add(water);

// --- 光（欠損）シェーダー: Domain Warping版 ---
const kessonMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0xffffff) },
        uOffset: { value: 0.0 }
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
        varying vec2 vUv;
        ${noiseGLSL}

        mat2 rot(float a) {
            float s = sin(a), c = cos(a);
            return mat2(c, -s, s, c);
        }

        void main() {
            vec2 uv = (vUv - 0.5) * 2.0;
            float t = uTime * 0.15 + uOffset;
            
            // Domain Warping
            vec2 p = uv;
            float amplitude = 0.6;
            float d = 0.0;
            
            for(int i = 0; i < 3; i++) {
                p += vec2(snoise(p + t), snoise(p - t)) * amplitude;
                p *= rot(t * 0.1);
                d += length(p) * amplitude * 0.5;
                amplitude *= 0.5;
            }

            float dist = length(p);

            // コアの光
            float core = 0.08 / (dist + 0.01);

            // エッジの干渉縞
            float pattern = sin(p.x * 12.0 + t) * sin(p.y * 12.0 - t) * 0.1;
            
            // 欠損: 中心の虚無
            float voidHole = smoothstep(0.0, 0.4, dist);

            // L3: 呼吸
            float breath = 0.7 + 0.3 * sin(uTime * 1.2 + uOffset * 10.0);

            float alpha = (core + pattern) * voidHole * breath;
            alpha = smoothstep(0.01, 1.0, alpha);
            
            vec3 finalColor = mix(uColor, vec3(1.0), core * 0.5);

            if(alpha < 0.01) discard;

            gl_FragColor = vec4(finalColor, alpha);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

// --- オブジェクト配置 ---
const warmColors = [0xff7744, 0xff9955, 0xff5522];
const coolColors = [0x4477ff, 0x5599ff, 0x2255ee];
const kessonMeshes = [];
const kessonGeo = new THREE.PlaneGeometry(12, 12);

for(let i = 0; i < 40; i++) {
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

// --- 粒子 ---
const particleGeo = new THREE.BufferGeometry();
const particleCount = 1500;
const posArray = new Float32Array(particleCount * 3);
for(let i = 0; i < particleCount * 3; i++) {
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
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// --- インタラクション ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let targetX = 0;
let targetY = 0;

window.addEventListener('mousemove', (event) => {
    targetX = (event.clientX / window.innerWidth - 0.5) * 3;
    targetY = (event.clientY / window.innerHeight - 0.5) * 3;
});

// --- アニメーション ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // L0: 呼吸（有機的な合成波）
    const breath = Math.sin(time * 0.3) + Math.sin(time * 0.1) * 0.5;
    camera.fov = 60 + breath * 1.0;
    camera.updateProjectionMatrix();

    // カメラの浮遊感
    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.z += (25 + targetY - camera.position.z) * 0.03;
    camera.lookAt(0, -5, -10);

    waterMaterial.uniforms.uTime.value = time;

    kessonMeshes.forEach(mesh => {
        mesh.material.uniforms.uTime.value = time;
        mesh.position.y = mesh.userData.baseY + Math.sin(time * mesh.userData.speed + mesh.userData.id) * 2;
        mesh.position.x = mesh.userData.baseX + Math.cos(time * mesh.userData.speed * 0.5 + mesh.userData.id) * 2;
        mesh.lookAt(camera.position);
    });

    particles.rotation.y = time * 0.01;

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
