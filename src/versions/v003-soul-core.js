import * as THREE from 'three';

// --- 初期設定 ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// 背景とFog (深い闇)
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

// --- 光（欠損→魂のコア）シェーダー ---
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
    // CHANGED: フラグメントシェーダー全体を刷新。「虚無(Void)」から「魂のコア(Core)」へ
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
            // 正規化座標 (-1.0 ~ 1.0)
            vec2 uv = (vUv - 0.5) * 2.0;
            float t = uTime * 0.15 + uOffset;
            
            // --- Domain Warping (輪郭の有機的な歪み) ---
            // 既存の「煙のようなエッジ」のロジックは維持
            vec2 p = uv;
            float amplitude = 0.6;
            
            for(int i = 0; i < 3; i++) {
                p += vec2(snoise(p + t), snoise(p - t)) * amplitude;
                p *= rot(t * 0.1); 
                amplitude *= 0.5;
            }

            // 歪んだ空間での距離
            float dist = length(p);

            // --- CHANGED: 光の合成ロジック (Soul Core) ---

            // 1. 強度計算 (Inverse Square Law的な減衰)
            // 中心(dist=0)に近づくほど急激に明るくなる
            float glowIntensity = 0.12 / (dist * dist + 0.02);
            
            // 2. 色の階層構造 (白 -> 青白 -> uColor)
            vec3 coreWhite = vec3(1.0, 1.0, 1.0);       // 中心: 純白
            vec3 innerHalo = vec3(0.7, 0.85, 1.0);      // 中間: 淡い青白 (氷のような青)
            
            // グロー強度に基づいて色をブレンド
            // intensityが高い(中心)ほど白、低くなるにつれてuColorへ
            vec3 finalColor = mix(uColor, innerHalo, smoothstep(0.5, 3.0, glowIntensity));
            finalColor = mix(finalColor, coreWhite, smoothstep(3.0, 8.0, glowIntensity));

            // 3. エッジ処理 (外側の揺らぎ)
            // 外縁部にはノイズパターンを適用して煙のように消滅させる
            float edgePattern = snoise(p * 4.0 + t) * 0.5 + 0.5;
            float alpha = smoothstep(0.0, 1.0, glowIntensity * 0.5); // 基本アルファ
            
            // 中心部は不透明、外側に行くほどノイズで削る
            float noiseBlend = smoothstep(2.0, 0.5, glowIntensity); // 中心ほど0、外側ほど1
            alpha *= mix(1.0, edgePattern, noiseBlend);

            // 4. L3: 呼吸 (Withhold) - 明滅
            float breath = 0.85 + 0.15 * sin(uTime * 1.5 + uOffset * 10.0);
            alpha *= breath;

            // 完全に透明な部分は描画しない
            if(alpha < 0.01) discard;

            // 光があふれ出すような加算発光
            gl_FragColor = vec4(finalColor * 1.5, alpha);
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

// --- 粒子 (Dust) ---
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

    const breath = Math.sin(time * 0.3) + Math.sin(time * 0.1) * 0.5;
    camera.fov = 60 + breath * 1.0; 
    camera.updateProjectionMatrix();

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