// x-logo.glsl.js — Xロゴ用シェーダー（Plane + SDF）

export const xLogoVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

    vWorldPos = worldPos.xyz;
    vNormal = worldNormal;
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const xLogoFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uGlowStrength;
uniform float uRimPower;
uniform float uInnerGlow;
uniform float uHover;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
varying vec2 vUv;

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float xShape(vec2 uv) {
    vec2 centered = uv - 0.5;
    float angle = 0.785398; // PI/4
    // bar 1 (/)
    vec2 r1 = vec2(
        centered.x * cos(angle) - centered.y * sin(angle),
        centered.x * sin(angle) + centered.y * cos(angle)
    );
    float d1 = sdBox(r1, vec2(0.35, 0.08));
    // bar 2 (\)
    vec2 r2 = vec2(
        centered.x * cos(-angle) - centered.y * sin(-angle),
        centered.x * sin(-angle) + centered.y * cos(-angle)
    );
    float d2 = sdBox(r2, vec2(0.35, 0.08));
    return min(d1, d2);
}

void main() {
    float d = xShape(vUv);

    float pulse = 1.0 + sin(uTime * 0.6) * 0.06;

    float fill = smoothstep(0.02, -0.02, d);
    float edge = smoothstep(0.10, 0.0, abs(d));
    float inner = fill * uInnerGlow;
    float glow = edge * uGlowStrength;

    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uRimPower);
    float rim = fresnel * uGlowStrength;

    vec3 baseColor = vec3(0.85, 0.9, 1.0);
    vec3 rimColor = vec3(0.95, 0.97, 1.0);

    vec3 color = vec3(0.0);
    color += baseColor * (fill * 0.85 + glow * 0.6 + inner * 0.2);
    color += rimColor * rim;

    color *= pulse * (1.0 + uHover * 0.25);

    float alpha = (fill * 0.8 + glow * 0.6 + rim * 0.5) * pulse;
    alpha = clamp(alpha * (1.0 + uHover * 0.3), 0.0, 1.0);

    if (alpha < 0.005) discard;

    gl_FragColor = vec4(color, alpha);
}
`;
