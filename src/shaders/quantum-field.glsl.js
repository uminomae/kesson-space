// quantum-field.glsl.js — 量子場波動関数シェーダー

export const quantumFieldVertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const quantumFieldFragmentShader = `
    precision highp float;

    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uSpeed;
    uniform float uIntensity;
    uniform float uWaveCount;
    uniform float uBaseFreq;
    uniform float uDispersion;
    uniform float uNoiseAmp;
    uniform float uNoiseScale;
    uniform float uEnvelopeWidth;
    uniform float uTransitionCenter;
    uniform float uTransitionWidth;
    uniform float uColorR;
    uniform float uColorG;
    uniform float uColorB;
    uniform float uGlowR;
    uniform float uGlowG;
    uniform float uGlowB;
    uniform float uOpacity;

    varying vec2 vUv;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(
            0.211324865405187,
            0.366025403784439,
            -0.577350269189626,
            0.024390243902439
        );
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);

        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;

        i = mod289(i);
        vec3 p = permute(
            permute(i.y + vec3(0.0, i1.y, 1.0))
            + i.x + vec3(0.0, i1.x, 1.0)
        );

        vec3 m = max(
            0.5 - vec3(
                dot(x0, x0),
                dot(x12.xy, x12.xy),
                dot(x12.zw, x12.zw)
            ),
            0.0
        );
        m = m * m;
        m = m * m;

        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;

        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        for (int i = 0; i < 4; i++) {
            value += amp * snoise(p * freq);
            amp *= 0.5;
            freq *= 2.0;
        }
        return value;
    }

    void main() {
        vec2 pos = vUv * 2.0 - 1.0;
        float safeHeight = max(uResolution.y, 1.0);
        pos.x *= uResolution.x / safeHeight;

        float transHalf = max(uTransitionWidth, 0.001) * 0.5;
        float transition = smoothstep(
            uTransitionCenter - transHalf,
            uTransitionCenter + transHalf,
            pos.x
        );

        float packetWidth = max(uEnvelopeWidth, 0.2);
        float packetEnvelope = exp(-pow((pos.x + 0.72) / packetWidth, 2.0));
        float transitionFade = 1.0 - smoothstep(
            uTransitionCenter - transHalf * 0.4,
            uTransitionCenter + transHalf * 1.2,
            pos.x
        );
        float amplitudeEnvelope = packetEnvelope * transitionFade;

        int waveCount = int(clamp(uWaveCount, 1.0, 12.0));
        float waveY = 0.0;
        for (int n = 0; n < 12; n++) {
            if (n >= waveCount) break;
            float idx = float(n);
            float k = uBaseFreq * (1.0 + idx * 0.22);
            float omega = uDispersion * k * k;
            float phaseNoise = fbm(
                vec2(
                    pos.x * uNoiseScale * (1.0 + idx * 0.14) + idx * 3.7,
                    uTime * 0.08 - idx * 1.9
                )
            ) * uNoiseAmp;
            float phase = k * pos.x - omega * uTime * uSpeed + idx * 1.618 + phaseNoise;
            float compAmp = 0.95 / (1.0 + idx * 0.55);
            waveY += compAmp * sin(phase);
        }
        waveY *= 0.22 * amplitudeEnvelope;
        waveY += fbm(vec2(pos.x * uNoiseScale * 0.45 - uTime * 0.06, uTime * 0.11)) * 0.05 * uNoiseAmp * amplitudeEnvelope;

        float lineWidth = mix(0.055, 0.01, transition);
        float dist = abs(pos.y - waveY);
        float lineCore = 1.0 - smoothstep(lineWidth, lineWidth * 1.9, dist);
        float lineGlow = 1.0 / (dist * (34.0 + transition * 10.0) + 0.02);
        float lineStrength = (lineCore * 1.25 + lineGlow * 0.2) * amplitudeEnvelope;

        vec2 particleCenter = vec2(
            uTransitionCenter + transHalf * 1.45,
            0.06 * sin(uTime * uSpeed * 0.45)
            + 0.02 * fbm(vec2(uTime * 0.07, 11.0))
        );
        float particleDist = length(pos - particleCenter);
        float particleCore = 1.0 - smoothstep(0.03, 0.085, particleDist);
        float particleGlow = 1.0 / (particleDist * 28.0 + 0.03);
        float particleStrength = transition * (particleCore * 1.9 + particleGlow * 0.45);

        float edgeFade = smoothstep(1.85, 0.2, length(pos));
        float density = lineStrength + particleStrength;
        vec3 baseColor = vec3(uColorR, uColorG, uColorB);
        vec3 glowColor = vec3(uGlowR, uGlowG, uGlowB);
        vec3 lineColor = mix(baseColor, glowColor, 0.6 + 0.4 * lineCore);
        vec3 color = lineColor * lineStrength + glowColor * particleStrength;
        color *= uIntensity;
        float alpha = density * edgeFade * uOpacity;

        if (alpha < 0.001) discard;
        gl_FragColor = vec4(color, alpha);
    }
`;
