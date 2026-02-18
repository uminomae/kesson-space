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

    float quantumField(vec2 pos) {
        float totalRe = 0.0;
        float totalIm = 0.0;
        int waveCount = int(clamp(uWaveCount, 1.0, 12.0));

        for (int n = 0; n < 12; n++) {
            if (n >= waveCount) break;

            float idx = float(n);
            float theta = idx * 6.28318530718 / float(waveCount) + uTime * 0.05;
            float kMag = uBaseFreq * (1.0 + idx * 0.3);
            vec2 k = kMag * vec2(cos(theta), sin(theta));
            float omega = uDispersion * dot(k, k);
            float phi = fbm(pos * uNoiseScale + vec2(idx * 7.3, idx * 7.3 + 13.1)) * uNoiseAmp;

            float phase = dot(k, pos) - omega * uTime * uSpeed + phi;
            totalRe += cos(phase);
            totalIm += sin(phase);
        }

        float w = float(waveCount);
        return (totalRe * totalRe + totalIm * totalIm) / (w * w);
    }

    void main() {
        vec2 pos = vUv * 2.0 - 1.0;
        float safeHeight = max(uResolution.y, 1.0);
        pos.x *= uResolution.x / safeHeight;

        float width = max(uEnvelopeWidth, 0.001);
        float envelope = exp(-dot(pos, pos) / (width * width));
        float probability = quantumField(pos) * envelope;
        probability = 1.0 - exp(-probability * 2.2);

        float transHalf = max(uTransitionWidth, 0.001) * 0.5;
        float transition = smoothstep(
            uTransitionCenter - transHalf,
            uTransitionCenter + transHalf,
            pos.x
        );

        float focused = pow(max(probability, 0.0), mix(1.0, 3.2, transition));
        float density = mix(probability, focused, transition);

        vec3 baseColor = vec3(uColorR, uColorG, uColorB);
        vec3 glowColor = vec3(uGlowR, uGlowG, uGlowB);
        vec3 color = baseColor * density + glowColor * pow(density, 3.0);
        color *= uIntensity;

        float edgeFade = smoothstep(1.8, 0.25, length(pos));
        float alpha = density * edgeFade * uOpacity;

        if (alpha < 0.001) discard;
        gl_FragColor = vec4(color, alpha);
    }
`;
