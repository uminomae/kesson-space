import * as THREE from 'three';

// --- 初期設定 ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// 闇の表現 (FogExp2)
const bgColor = new THREE.Color(0x0a0a12);
scene.background = bgColor;
scene.fog = new THREE.FogExp2(0x0a0a12, 0.012);

// L0 (内受容感覚): 意識の視点 (上空から見下ろす)
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 40, 20);
camera.lookAt(0, -10, -20);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// --- シェーダー ---

// 共通のノイズ関数 (GLSL)
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

// 【水面（縁）のシェーダー】
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
            // フラクタル的なノイズで波紋を作成
            float noise = snoise(vec2(pos.x * 0.05 + uTime * 0.1, pos.y * 0.05 - uTime * 0.1));
            pos.z += noise * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying vec2 vUv;
        ${noiseGLSL}
        void main() {
            float noise = snoise(vUv * 10.0 + uTime * 0.2);
            float alpha = 0.4 + noise * 0.1; // 半透明で向こう側をうっすら見せる
            gl_FragColor = vec4(uColor, alpha);
        }
    `,
    transparent: true,
    wireframe: false,
    side: THREE.DoubleSide
});

const waterGeo = new THREE.PlaneGeometry(200, 200, 100, 100);
const water = new THREE.Mesh(waterGeo, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = -15;
scene.add(water);

// 【光（欠損）のシェーダー】
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
            // ビルボード処理（常にカメラを向く）
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
        void main() {
            vec2 uv = vUv - 0.5;
            float dist = length(uv);
            
            // L1: フラクタルで不完全な輪郭（欠損）
            float n = snoise(uv * 3.0 + uTime * 0.2 + uOffset);
            float radius = 0.25 + n * 0.15;
            
            // L3: 呼吸するように明滅
            float breath = 0.7 + 0.3 * sin(uTime * 1.5 + uOffset);
            
            // 曖昧なエッジ
            float alpha = smoothstep(radius + 0.1, radius - 0.05, dist);
            
            // 中心の空洞化（欠け）を少し表現
            alpha *= smoothstep(0.0, 0.1, dist + n*0.1);

            gl_FragColor = vec4(uColor, alpha * breath * 0.8);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

// --- オブジェクトの配置 ---

// L2 (F-O評価): 色の定義
const warmColors = [0xff5533, 0xff8833, 0xffaa55]; // F軸 (緊張)
const coolColors = [0x3366ff, 0x44aaff, 0x55ccff]; // O軸 (安らぎ)
const kessonMeshes = [];
const kessonGeo = new THREE.PlaneGeometry(15, 15);

for(let i = 0; i < 30; i++) {
    const isWarm = Math.random() > 0.5;
    const colorPalette = isWarm ? warmColors : coolColors;
    const colorStr = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    
    const mat = kessonMaterial.clone();
    mat.uniforms.uColor.value = new THREE.Color(colorStr);
    mat.uniforms.uOffset.value = Math.random() * 100.0;
    
    const mesh = new THREE.Mesh(kessonGeo, mat);
    // 空間にランダム配置
    mesh.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 30 - 5,
        (Math.random() - 0.5) * 80 - 20
    );
    
    // アニメーション用の独自データ
    mesh.userData = {
        baseY: mesh.position.y,
        speed: 0.1 + Math.random() * 0.3,
        id: i
    };
    
    scene.add(mesh);
    kessonMeshes.push(mesh);
}

// L0 (内受容感覚): 微細な粒子（埃、漂う気配）
const particleGeo = new THREE.BufferGeometry();
const particleCount = 2000;
const posArray = new Float32Array(particleCount * 3);
for(let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 150;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particleMat = new THREE.PointsMaterial({
    size: 0.15,
    color: 0x8888aa,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// --- インタラクション (Raycaster) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(kessonMeshes);
    if (intersects.length > 0) {
        // 将来の詳細ページ遷移用のフック
        console.log("Kesson clicked:", intersects[0].object.userData.id);
        // 仮のエフェクト: クリックされたら少し上に跳ねる
        intersects[0].object.userData.baseY += 5;
    }
});

// 視差効果（マウス移動による空間の揺らぎ）
let targetX = 0;
let targetY = 0;
window.addEventListener('mousemove', (event) => {
    targetX = (event.clientX / window.innerWidth - 0.5) * 5;
    targetY = (event.clientY / window.innerHeight - 0.5) * 5;
});

// --- アニメーションループ ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // L0: 空間全体のゆっくりとした呼吸 (FOVの伸縮とカメラの揺らぎ)
    camera.fov = 60 + Math.sin(time * 0.3) * 1.5;
    camera.updateProjectionMatrix();
    
    // マウス視差とゆっくりとした漂い
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.z += (20 + targetY - camera.position.z) * 0.02;

    // 水面アニメーション
    waterMaterial.uniforms.uTime.value = time;

    // 欠損(光)のアニメーション
    kessonMeshes.forEach(mesh => {
        mesh.material.uniforms.uTime.value = time;
        // ゆっくり漂う
        mesh.position.y = mesh.userData.baseY + Math.sin(time * mesh.userData.speed + mesh.userData.id) * 3;
    });

    // 粒子の回転
    particles.rotation.y = time * 0.02;
    particles.rotation.x = time * 0.01;

    renderer.render(scene, camera);
}

// リサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();