import * as THREE from 'three';

const VERTEX_SHADER = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

float sdSphere(vec3 p, float s) {
  return length(p) - s;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float mapBackground(vec3 p) {
  vec3 q = p;
  q.xz *= rot(u_time * 0.2 + q.y * 0.2);
  float torus = sdTorus(q - vec3(0.0, 0.0, 2.0), vec2(3.0, 0.5 + sin(u_time) * 0.1));
  torus += sin(q.x * 3.0 + u_time) * cos(q.y * 3.0) * 0.2;
  return torus;
}

float mapGate(vec3 p) {
  return sdCapsule(p, vec3(0.0, -1.5, 0.0), vec3(0.0, 1.5, 0.0), 0.1);
}

float mapRays(vec3 p) {
  vec3 q = p;
  q.xz *= rot(-0.3);

  float rays = sdCapsule(q - vec3(0.5, 0.0, 0.0), vec3(0.0), vec3(4.0, 0.5, 0.5), 0.05);
  rays = smin(
    rays,
    sdCapsule(q - vec3(0.5, -0.2, 0.1), vec3(0.0), vec3(3.5, -0.3, 0.8), 0.04),
    0.3
  );
  rays = smin(
    rays,
    sdCapsule(q - vec3(0.5, 0.3, -0.1), vec3(0.0), vec3(3.8, 0.8, -0.4), 0.06),
    0.3
  );

  return rays;
}

float mapScene(vec3 p) {
  float bg = mapBackground(p);
  float gate = mapGate(p);
  float rays = mapRays(p);
  return smin(smin(bg, gate, 0.5), rays, 0.2);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

  vec3 ro = vec3(0.0, 0.0, -5.0);
  vec3 rd = normalize(vec3(uv, 1.5));

  float t = 0.0;
  float glowBg = 0.0;
  float glowGate = 0.0;
  float glowRays = 0.0;

  for (int i = 0; i < 100; i++) {
    vec3 p = ro + rd * t;
    float bg = mapBackground(p);
    float gate = mapGate(p);
    float rays = mapRays(p);
    float d = smin(smin(bg, gate, 0.5), rays, 0.2);

    glowBg += 0.01 / (0.01 + bg * bg * 20.0);
    glowGate += 0.02 / (0.01 + gate * gate * 80.0);
    glowRays += 0.02 / (0.01 + rays * rays * 150.0);

    if (d < 0.001 || t > 20.0) {
      break;
    }
    t += d * 0.8;
  }

  glowBg = clamp(glowBg, 0.0, 2.5);
  glowGate = clamp(glowGate, 0.0, 2.5);
  glowRays = clamp(glowRays, 0.0, 3.0);

  vec3 col = vec3(0.0);
  col += vec3(0.05, 0.1, 0.3) * (uv.y + 1.0) * 0.5;

  vec3 colorBg = vec3(0.1, 0.4, 1.0);
  vec3 colorGate = vec3(1.0, 1.0, 1.0);
  vec3 colorRays = vec3(1.0, 0.8, 0.3);

  col += glowBg * colorBg * 0.8;
  col += glowGate * colorGate * 1.5;
  col += glowRays * colorRays * 2.0;

  col = pow(col, vec3(1.2));
  gl_FragColor = vec4(col, 1.0);
}
`;

export function initConsciousnessStructureRaymarch({ container = document.body } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const uniforms = {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry, material);
  scene.add(quad);

  const clock = new THREE.Clock();
  let rafId = 0;

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
  };

  const animate = () => {
    uniforms.u_time.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(animate);
  };

  window.addEventListener('resize', onResize);
  animate();

  return {
    dispose() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
