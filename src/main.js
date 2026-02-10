import * as THREE from 'three';

// === 初期化 ===
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.FogExp2(0x0a0a12, 0.02);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// === 光（欠損）のパーティクル ===
const particleCount = 50;
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);
const phases = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  // 位置（闇の中に散らばる）
  positions[i * 3] = (Math.random() - 0.5) * 30;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 15 + 2;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  
  // 色（F軸=暖色 / O軸=寒色）
  const isF = Math.random() > 0.5;
  if (isF) {
    colors[i * 3] = 0.9 + Math.random() * 0.1;     // R
    colors[i * 3 + 1] = 0.5 + Math.random() * 0.3; // G
    colors[i * 3 + 2] = 0.3 + Math.random() * 0.2; // B
  } else {
    colors[i * 3] = 0.3 + Math.random() * 0.2;     // R
    colors[i * 3 + 1] = 0.5 + Math.random() * 0.3; // G
    colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B
  }
  
  sizes[i] = 0.3 + Math.random() * 0.5;
  phases[i] = Math.random() * Math.PI * 2;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.5,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// === 水面（縁） ===
const waterGeometry = new THREE.PlaneGeometry(100, 100, 64, 64);
const waterMaterial = new THREE.MeshBasicMaterial({
  color: 0x1a1a2e,
  transparent: true,
  opacity: 0.3,
  side: THREE.DoubleSide,
  wireframe: false
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = -2;
scene.add(water);

// === 呼吸する空間（L0）の表現用変数 ===
let breathPhase = 0;
const breathSpeed = 0.5;

// === アニメーションループ ===
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const time = clock.getElapsedTime();
  
  // 呼吸（空間全体の収縮・拡張）
  breathPhase = Math.sin(time * breathSpeed) * 0.1 + 1;
  camera.fov = 60 + Math.sin(time * breathSpeed) * 2;
  camera.updateProjectionMatrix();
  
  // パーティクル（光）の動き
  const posArray = particlesGeometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // ゆっくり漂う
    posArray[i3 + 1] += Math.sin(time * 0.3 + phases[i]) * 0.002;
    posArray[i3] += Math.cos(time * 0.2 + phases[i]) * 0.001;
  }
  particlesGeometry.attributes.position.needsUpdate = true;
  
  // 水面の波紋
  const waterPosArray = waterGeometry.attributes.position.array;
  for (let i = 0; i < waterPosArray.length; i += 3) {
    const x = waterPosArray[i];
    const z = waterPosArray[i + 1];
    waterPosArray[i + 2] = Math.sin(x * 0.1 + time * 0.5) * 0.3 
                        + Math.sin(z * 0.1 + time * 0.3) * 0.3;
  }
  waterGeometry.attributes.position.needsUpdate = true;
  
  // カメラのゆっくりした回転
  camera.position.x = Math.sin(time * 0.1) * 2;
  camera.lookAt(0, 0, 0);
  
  renderer.render(scene, camera);
}

animate();

// === リサイズ対応 ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === クリックイベント（将来の詳細ページ遷移用） ===
renderer.domElement.addEventListener('click', (event) => {
  console.log('クリック:', event.clientX, event.clientY);
  // TODO: レイキャストで光を検出して詳細ページへ
});
