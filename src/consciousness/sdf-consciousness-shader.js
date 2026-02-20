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

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

mat2 rot2(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

float gyroid(vec3 p) {
    return dot(sin(p), cos(p.yzx));
}

float getDensity(vec3 p, float progress, float breath, float detail01) {
    vec3 q = p;

    q.xy *= rot2(p.z * 0.24 + uTime * 0.12);
    q.x -= uTime * uCsFlowSpeed;

    vec2 axisCurve = vec2(
        0.24 * sin(p.x * 0.66 + uTime * 0.31),
        0.18 * cos(p.x * 0.53 - uTime * 0.28)
    );
    q.yz -= axisCurve;

    float frequency = mix(uCsFreqLow, uCsFreqHigh, progress) + detail01 * 0.45;
    float g0 = gyroid(q * frequency);
    float g1 = gyroid((q + vec3(1.2, -0.8, 0.5)) * (frequency * 1.35));
    float field = g0 * 0.74 + g1 * 0.26;

    float thickness = mix(uCsThicknessLow, uCsThicknessHigh, progress) * (1.0 + breath * 0.38);
    float membrane = 1.0 - smoothstep(0.0, thickness, abs(field));

    float radial = length(q.yz);
    float shell = exp(-3.6 * radial * radial) * (0.22 + 0.46 * progress);

    return membrane * 0.82 + shell * 0.18;
}

void main() {
    vec2 uv = (vUv * 2.0 - 1.0);
    float aspect = max(uResolution.x / max(uResolution.y, 1.0), 0.0001);
    uv.x *= aspect;

    vec2 mouseN = (uMouse * 2.0 - 1.0) * vec2(aspect, 1.0);
    float breath = clamp(uBreath, 0.0, 1.0);
    float detail01 = clamp(uDetail * 60.0, 0.0, 1.0);

    vec3 ro = vec3(0.0, 0.0, 3.5);
    vec3 rd = normalize(vec3(uv, -1.8));
    rd.xy += mouseN * uCsMouseParallax;
    rd = normalize(rd);

    vec3 col = vec3(0.0);
    float transmittance = 1.0;
    float t = hash21(gl_FragCoord.xy + vec2(uTime * 17.0, uTime * 11.0)) * 0.08;

    for (int i = 0; i < 96; i++) {
        if (float(i) >= uMaxSteps) break;

        vec3 p = ro + rd * t;
        float progress = smoothstep(-2.5, 2.5, p.x);
        float radial = length(p.yz);

        float envelope = smoothstep(uCsEnvelopeRadius, 0.08, radial);
        envelope *= smoothstep(-3.0, -1.75, p.x);
        envelope *= 1.0 - smoothstep(4.35, 5.75, p.x);

        if (envelope > 0.0005) {
            float dens = getDensity(p, progress, breath, detail01) * envelope;
            if (dens > 0.0004) {
                vec3 colorA = vec3(uCsCoolR, uCsCoolG, uCsCoolB);
                vec3 colorB = vec3(uCsWarmR, uCsWarmG, uCsWarmB);
                vec3 gateColor = vec3(uCsGateR, uCsGateG, uCsGateB);
                vec3 tint = mix(colorA, colorB, pow(progress, 1.05));

                float gate = 1.0 - abs(progress - 0.5) * 2.0;
                gate = max(gate, 0.0);
                tint += gateColor * gate * gate * uCsGateTint;

                float focus = smoothstep(0.78, 0.06, length(p.xy - mouseN * 0.5));
                tint += vec3(0.1, 0.14, 0.2) * focus * 0.35;

                float breathLight = 0.86 + 0.3 * breath;
                float weight = dens * breathLight * uCsDensityGain * uCsLightBoost;
                float stepAlpha = clamp(weight, 0.0, 0.34);

                col += tint * stepAlpha * transmittance;
                transmittance *= (1.0 - stepAlpha);
                if (transmittance < 0.024) break;
            }
        }

        float stepNear = min(uCsStepNear, uCsStepFar);
        float stepFar = max(uCsStepNear, uCsStepFar);
        float stepLen = mix(stepNear, stepFar, 1.0 - envelope);
        stepLen = mix(stepLen, 0.06, detail01 * 0.5);
        t += stepLen;
        if (t > uFar) break;
    }

    float alpha = 1.0 - transmittance;
    alpha = smoothstep(0.0, 0.85, alpha);
    if (alpha < 0.01) discard;

    col = pow(col, vec3(uCsPreGamma));
    col = 1.0 - exp(-col * uCsExposure);
    float vignette = 1.0 - dot(uv, uv) * uCsVignette;
    col *= vignette;
    alpha *= vignette;

    if (alpha < 0.012) discard;
    gl_FragColor = vec4(col, min(alpha, 0.96));
}
`;
