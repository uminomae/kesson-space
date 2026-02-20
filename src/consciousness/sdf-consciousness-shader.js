export const consciousnessSdfVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const consciousnessSdfFragmentShader = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uBreath;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uMaxSteps;
uniform float uFar;
uniform float uDetail;
uniform float uCsFlowSpeed;
uniform float uCsFreqLow;
uniform float uCsFreqHigh;
uniform float uCsThicknessLow;
uniform float uCsThicknessHigh;
uniform float uCsEnvelopeRadius;
uniform float uCsDensityGain;
uniform float uCsStepNear;
uniform float uCsStepFar;
uniform float uCsGateTint;
uniform float uCsVignette;
uniform float uCsMouseParallax;
uniform float uCsLightBoost;
uniform float uCsPreGamma;
uniform float uCsExposure;
uniform float uCsCoolR;
uniform float uCsCoolG;
uniform float uCsCoolB;
uniform float uCsWarmR;
uniform float uCsWarmG;
uniform float uCsWarmB;
uniform float uCsGateR;
uniform float uCsGateG;
uniform float uCsGateB;

mat2 rot2(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
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

float sdConeApprox(vec3 p, float h, float r0, float r1) {
    float k = clamp((p.y + h * 0.5) / h, 0.0, 1.0);
    float r = mix(r0, r1, k);
    return length(p.xz) - r;
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float mapBackground(vec3 p, float breath) {
    vec3 q = p;
    float flow = 0.13 + uCsFlowSpeed * 0.35;
    q.xz *= rot2(uTime * flow + q.y * 0.22);
    q.xy *= rot2(uTime * 0.05 - q.z * 0.08);

    float torusA = sdTorus(q - vec3(0.0, 0.15, 2.35), vec2(2.95 + sin(uTime * 0.45) * 0.22, 0.48 + breath * 0.05));
    float torusB = sdTorus(q - vec3(-0.35, -0.15, 1.8), vec2(2.4, 0.42));
    float swirl = sin(q.x * (2.8 + uCsFreqLow * 0.22) + uTime * 0.9)
        * cos(q.y * (3.1 + uCsFreqHigh * 0.2) - uTime * 0.34) * 0.14;

    return smin(torusA + swirl, torusB + swirl * 0.7, 0.5);
}

float mapGate(vec3 p) {
    float gateCore = sdCapsule(p, vec3(0.0, -1.6, 0.0), vec3(0.0, 1.55, 0.0), 0.1);
    vec3 tailP = p - vec3(0.48, -2.8, 0.55);
    tailP.xz *= rot2(-0.5);
    float gateTail = sdConeApprox(tailP, 6.2, 0.08, 1.45);
    return smin(gateCore, gateTail, 0.42);
}

float mapRays(vec3 p) {
    vec3 q = p;
    q.xz *= rot2(-0.32);

    float rays = sdCapsule(q - vec3(0.52, 0.02, 0.04), vec3(0.0), vec3(4.9, 0.48, 0.58), 0.045);
    rays = smin(rays, sdCapsule(q - vec3(0.56, -0.26, 0.16), vec3(0.0), vec3(4.2, -0.28, 0.95), 0.04), 0.28);
    rays = smin(rays, sdCapsule(q - vec3(0.52, 0.32, -0.2), vec3(0.0), vec3(4.35, 0.9, -0.35), 0.05), 0.28);
    rays = smin(rays, sdCapsule(q - vec3(0.66, 0.1, -0.1), vec3(0.0), vec3(5.8, 0.38, -0.2), 0.03), 0.24);

    vec3 spikes = q - vec3(4.55, 0.3, 0.25);
    spikes.xy *= rot2(0.24);
    float tip = sdConeApprox(spikes, 1.2, 0.02, 0.25);
    return smin(rays, tip, 0.18);
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float aspect = max(uResolution.x / max(uResolution.y, 1.0), 0.001);
    uv.x *= aspect;

    vec2 mouseN = (uMouse * 2.0 - 1.0);
    float breath = clamp(uBreath, 0.0, 1.0);
    float detail01 = clamp(uDetail * 120.0, 0.0, 1.0);
    float densityBoost = max(0.35, uCsDensityGain * (1.4 + detail01 * 2.0));

    vec3 ro = vec3(0.0, 0.0, -5.35);
    vec3 rd = normalize(vec3(uv, 1.5));
    rd.xy += mouseN * vec2(aspect, 1.0) * (uCsMouseParallax * 0.25);
    rd = normalize(rd);

    float t = 0.0;
    float glowBg = 0.0;
    float glowGate = 0.0;
    float glowRays = 0.0;
    float farLimit = max(uFar + 9.5, 18.0);
    float maxSteps = clamp(uMaxSteps, 40.0, 112.0);

    for (int i = 0; i < 120; i++) {
        if (float(i) >= maxSteps) break;

        vec3 p = ro + rd * t;
        float bg = mapBackground(p, breath);
        float gate = mapGate(p);
        float rays = mapRays(p);
        float d = smin(smin(bg, gate, 0.46), rays, 0.24);

        glowBg += (0.010 + detail01 * 0.004) / (0.01 + bg * bg * 20.0);
        glowGate += (0.02 + breath * 0.008) / (0.01 + gate * gate * 86.0);
        glowRays += (0.021 + uCsGateTint * 0.01) / (0.01 + rays * rays * 150.0);

        if (d < 0.001 || t > farLimit) break;
        float adaptiveStep = mix(max(0.016, uCsStepNear), max(0.048, uCsStepFar), smoothstep(0.0, 7.0, t));
        t += max(d * 0.78, adaptiveStep * 0.46);
    }

    glowBg = clamp(glowBg * densityBoost, 0.0, 2.7);
    glowGate = clamp(glowGate * densityBoost * (1.0 + uCsLightBoost * 0.22), 0.0, 3.0);
    glowRays = clamp(glowRays * densityBoost * (1.0 + uCsGateTint * 0.5), 0.0, 3.2);

    vec3 cool = vec3(uCsCoolR, uCsCoolG, uCsCoolB);
    vec3 warm = vec3(uCsWarmR, uCsWarmG, uCsWarmB);
    vec3 gateTone = vec3(uCsGateR, uCsGateG, uCsGateB);

    vec3 col = vec3(0.0);
    col += cool * (0.14 + 0.3 * (uv.y + 1.0) * 0.5);
    col += glowBg * cool * 0.95;
    col += glowGate * mix(vec3(1.0), gateTone, 0.45) * 1.42;
    col += glowRays * warm * 1.65;
    col += gateTone * glowGate * glowRays * 0.08;

    col = pow(max(col, 0.0), vec3(max(0.75, uCsPreGamma)));
    col = 1.0 - exp(-col * max(0.5, uCsExposure));

    float vignette = 1.0 - dot(uv, uv) * (0.18 + uCsVignette * 0.65);
    col *= clamp(vignette, 0.0, 1.0);

    float alpha = clamp(0.78 + glowGate * 0.12 + glowRays * 0.1, 0.0, 0.98);
    gl_FragColor = vec4(col, alpha);
}
`;
