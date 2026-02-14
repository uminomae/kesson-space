// gem-orb.glsl.js — Gemオーブシェーダー（Gemini設計: Simplex Noise乱流 + Haloグロー）
// nav-objects.jsから分離。noise.glsl.jsは2D版のため、3D Simplex Noiseは本ファイルに含む。

export const gemOrbVertexShader = /* glsl */ `
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

export const gemOrbFragmentShader = /* glsl */ `
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

    // --- 法線擉乱（Simplex Noise乱流） ---
    vec3 perturbedNormal = vWorldNormal;
    float noiseVal = snoise(vWorldPos * 3.0 + uTime * 0.4);
    float noiseVal2 = snoise(vWorldPos * 5.0 - uTime * 0.3 + 7.0);
    perturbedNormal += (noiseVal * 0.5 + noiseVal2 * 0.3) * uTurbulence * vWorldNormal;
    perturbedNormal = normalize(perturbedNormal);

    // --- 擉乱法線ベースのFresnel ---
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
