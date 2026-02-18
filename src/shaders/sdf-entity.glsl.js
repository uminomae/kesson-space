export const sdfEntityVert = /* glsl */ `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const sdfEntityFrag = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBreath;
uniform vec2 uMouse;
uniform vec2 uResolution;

varying vec2 vUv;

float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float valueNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
}

mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

float sceneSDF(vec3 p) {
    vec3 mouseOffset = vec3(uMouse * 0.2, 0.0);

    float mainRadius = 0.8 + 0.1 * uBreath;
    float surfaceNoise = (valueNoise3D(p * 2.6 + vec3(0.0, uTime * 0.35, 0.0)) - 0.5) * 0.24;
    float dMain = sdSphere(p, mainRadius + surfaceNoise);

    vec3 q = p;
    q.xz *= rot(uTime * 0.35);
    float dRing = sdTorus(q, vec2(0.85 + 0.05 * sin(uTime * 0.9), 0.15));
    float d = opSmoothUnion(dMain, dRing, 0.35);

    vec3 c1 = vec3(cos(uTime * 0.9), 0.25 * sin(uTime * 1.1), sin(uTime * 0.9)) * 0.9 + mouseOffset;
    vec3 c2 = vec3(cos(uTime * 0.6 + 2.1), 0.35 * sin(uTime * 0.7 + 1.2), sin(uTime * 0.6 + 2.1)) * 0.8 + mouseOffset * vec3(0.7, 1.0, 0.7);
    vec3 c3 = vec3(cos(uTime * 0.8 + 4.0), 0.28 * sin(uTime * 0.95 + 0.4), sin(uTime * 0.8 + 4.0)) * 0.85 + mouseOffset * vec3(1.0, 0.8, 0.8);
    vec3 c4 = vec3(cos(uTime * 1.2 + 1.3), 0.22 * sin(uTime * 1.3 + 3.0), sin(uTime * 1.2 + 1.3)) * 0.75 + mouseOffset * vec3(0.8, 0.7, 1.0);

    float d1 = sdSphere(p - c1, 0.45);
    float d2 = sdSphere(p - c2, 0.40);
    float d3 = sdSphere(p - c3, 0.36);
    float d4 = sdSphere(p - c4, 0.32);

    d = opSmoothUnion(d, d1, 0.5);
    d = opSmoothUnion(d, d2, 0.5);
    d = opSmoothUnion(d, d3, 0.5);
    d = opSmoothUnion(d, d4, 0.5);

    return d;
}

float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = sceneSDF(p);
        if (d < 0.001) break;
        t += d;
        if (t > 20.0) break;
    }
    return t;
}

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
        sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
        sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
    ));
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    uv.x *= aspect;

    vec3 ro = vec3(0.0, 0.0, 3.2);
    vec3 rd = normalize(vec3(uv, -1.8));
    float t = rayMarch(ro, rd);
    if (t > 20.0) discard;

    vec3 hitPos = ro + rd * t;
    if (sceneSDF(hitPos) > 0.005) discard;

    vec3 normal = calcNormal(hitPos);
    vec3 lightDir = normalize(vec3(0.3, 1.0, 0.5));
    float diffuse = max(dot(normal, lightDir), 0.0);
    float rim = pow(1.0 - max(dot(normal, -rd), 0.0), 3.0);
    float innerGlow = exp(-length(hitPos) * 2.0);

    vec3 baseColor = vec3(0.1, 0.3, 0.8);
    vec3 rimColor = vec3(0.4, 0.6, 1.0);

    vec3 color = baseColor * (0.35 + diffuse * 0.95);
    color += rimColor * rim * 1.1;
    color += baseColor * innerGlow * 1.2;

    float alpha = clamp(0.3 + diffuse * 0.4 + rim * 0.5 + innerGlow * 0.45, 0.0, 1.0);
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color, alpha);
}
`;
