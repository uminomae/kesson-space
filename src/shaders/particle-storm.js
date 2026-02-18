// particle-storm.js — 波動パーティクル砂嵐シェーダー
import * as THREE from 'three';
import { particleStormParams } from '../config.js';
import { noiseGLSL } from './noise.glsl.js';

export function createParticleStormMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime:          { value: 0.0 },
            uSpeed:         { value: particleStormParams.speed },
            uIntensity:     { value: particleStormParams.intensity },
            uOpacity:       { value: particleStormParams.opacity },
            uBaseFreq:      { value: particleStormParams.baseFreq },
            uDispersion:    { value: particleStormParams.dispersion },
            uWaveCount:     { value: particleStormParams.waveCount },
            uNoiseAmp:      { value: particleStormParams.noiseAmp },
            uNoiseScale:    { value: particleStormParams.noiseScale },
            uGrainDensity:  { value: particleStormParams.grainDensity },
            uGrainSize:     { value: particleStormParams.grainSize },
            uAdvectStrength:{ value: particleStormParams.advectStrength },
            uColorR:        { value: particleStormParams.colorR },
            uColorG:        { value: particleStormParams.colorG },
            uColorB:        { value: particleStormParams.colorB },
            uBrightColorR:  { value: particleStormParams.brightColorR },
            uBrightColorG:  { value: particleStormParams.brightColorG },
            uBrightColorB:  { value: particleStormParams.brightColorB },
            uColorMix:      { value: particleStormParams.colorMix },
            uBrightness:    { value: particleStormParams.brightness },
            uContrast:      { value: particleStormParams.contrast },
            uSaturation:    { value: particleStormParams.saturation },
            uPSGlowAmount:  { value: particleStormParams.glowAmount },
            uPSGlowSpread:  { value: particleStormParams.glowSpread },
            uPSGlowColorR:  { value: particleStormParams.glowColorR },
            uPSGlowColorG:  { value: particleStormParams.glowColorG },
            uPSGlowColorB:  { value: particleStormParams.glowColorB },
            uSoftness:      { value: particleStormParams.softness },
            uBloomAmount:   { value: particleStormParams.bloomAmount },
            uEdgeFadeStart: { value: particleStormParams.edgeFadeStart },
            uEdgeFadeEnd:   { value: particleStormParams.edgeFadeEnd },
            uCenterDim:     { value: particleStormParams.centerDim },
            uDensityFloor:  { value: particleStormParams.densityFloor },
            uFlickerSpeed:  { value: particleStormParams.flickerSpeed },
            uFlickerAmount: { value: particleStormParams.flickerAmount },
            uDriftSpeed:    { value: particleStormParams.driftSpeed },
            uDriftAngle:    { value: particleStormParams.driftAngle },
            uResolution:    { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            precision highp float;

            uniform float uTime;
            uniform float uSpeed;
            uniform float uIntensity;
            uniform float uOpacity;
            uniform float uBaseFreq;
            uniform float uDispersion;
            uniform float uWaveCount;
            uniform float uNoiseAmp;
            uniform float uNoiseScale;
            uniform float uGrainDensity;
            uniform float uGrainSize;
            uniform float uAdvectStrength;
            uniform float uColorR;
            uniform float uColorG;
            uniform float uColorB;
            uniform float uBrightColorR;
            uniform float uBrightColorG;
            uniform float uBrightColorB;
            uniform float uColorMix;
            uniform float uBrightness;
            uniform float uContrast;
            uniform float uSaturation;
            uniform float uPSGlowAmount;
            uniform float uPSGlowSpread;
            uniform float uPSGlowColorR;
            uniform float uPSGlowColorG;
            uniform float uPSGlowColorB;
            uniform float uSoftness;
            uniform float uBloomAmount;
            uniform float uEdgeFadeStart;
            uniform float uEdgeFadeEnd;
            uniform float uCenterDim;
            uniform float uDensityFloor;
            uniform float uFlickerSpeed;
            uniform float uFlickerAmount;
            uniform float uDriftSpeed;
            uniform float uDriftAngle;
            uniform vec2 uResolution;
            varying vec2 vUv;

            ${noiseGLSL}

            // FBM (4 octaves)
            float fbm(vec2 p) {
                float value = 0.0;
                float amp = 0.5;
                float freq = 1.0;
                for (int i = 0; i < 4; i++) {
                    value += amp * snoise(p * freq);
                    amp *= 0.5;
                    freq *= 2.02;
                }
                return value;
            }

            // 高速ハッシュ（粒の配置用）
            float hash21(vec2 p) {
                vec3 p3 = fract(vec3(p.xyx) * 0.1031);
                p3 += dot(p3, p3.yzx + 33.33);
                return fract((p3.x + p3.y) * p3.z);
            }

            void main() {
                vec2 pos = vUv * 2.0 - 1.0;
                float safeH = max(uResolution.y, 1.0);
                pos.x *= uResolution.x / safeH;

                float t = uTime * uSpeed;

                // --- ドリフト ---
                if (uDriftSpeed > 0.001) {
                    vec2 drift = vec2(cos(uDriftAngle), sin(uDriftAngle)) * uDriftSpeed * uTime;
                    pos += drift;
                }

                // --- 波動関数 ψ ---
                float psiReal = 0.0;
                float psiImag = 0.0;
                float gradRealX = 0.0;
                float gradRealY = 0.0;

                int wCount = int(clamp(uWaveCount, 1.0, 8.0));

                float phaseNoise = fbm(pos * uNoiseScale + vec2(t * 0.05, t * 0.03)) * uNoiseAmp;

                for (int n = 0; n < 8; n++) {
                    if (n >= wCount) break;
                    float idx = float(n);
                    float angle = idx * 0.785 + 0.3 * sin(idx * 1.7);
                    float kMag = uBaseFreq * (1.0 + idx * 0.3);
                    float kx = kMag * cos(angle);
                    float ky = kMag * sin(angle);
                    float omega = uDispersion * kMag * kMag;
                    float phase = kx * pos.x + ky * pos.y - omega * t + idx * 1.618 + phaseNoise;
                    float amp = 1.0 / (1.0 + idx * 0.35);
                    psiReal += amp * cos(phase);
                    psiImag += amp * sin(phase);
                    gradRealX += amp * (-kx) * sin(phase);
                    gradRealY += amp * (-ky) * sin(phase);
                }

                float psiSq = (psiReal * psiReal + psiImag * psiImag);
                float maxPsiSq = uWaveCount * uWaveCount * 0.15;
                float density = clamp(psiSq / max(maxPsiSq, 0.01), 0.0, 1.0);

                // 密度フロア
                density = max(density, uDensityFloor);

                // --- 移流 ---
                vec2 advect = vec2(gradRealX, gradRealY) * uAdvectStrength;

                // --- 粒（grain）---
                vec2 grainPos = (pos + advect * t) * uGrainDensity;
                vec2 gridCell = floor(grainPos);
                vec2 gridFrac = fract(grainPos);

                float grain = 0.0;
                for (int gx = -1; gx <= 1; gx++) {
                    for (int gy = -1; gy <= 1; gy++) {
                        vec2 neighbor = vec2(float(gx), float(gy));
                        vec2 cellId = gridCell + neighbor;
                        float rnd = hash21(cellId);
                        vec2 particlePos = neighbor + vec2(
                            hash21(cellId + 0.1),
                            hash21(cellId + 0.2)
                        ) - gridFrac;
                        float dist = length(particlePos);

                        // ソフトネス適用
                        float particleSize = 0.3 + rnd * 0.4;
                        float edgeSharp = mix(particleSize * 0.3, particleSize, 1.0 - uSoftness);
                        float particleBright = smoothstep(particleSize, edgeSharp, dist);

                        // コントラスト
                        particleBright = pow(particleBright, uContrast);

                        // 明滅
                        float flicker = 1.0 - uFlickerAmount + uFlickerAmount * (0.5 + 0.5 * sin(uTime * uFlickerSpeed + rnd * 6.283));
                        particleBright *= flicker;

                        grain += particleBright;
                    }
                }
                grain = clamp(grain, 0.0, 1.0);

                // --- 合成 ---
                float visibility = grain * density;

                // エッジフェード（パラメータ化）
                float edgeFade = smoothstep(uEdgeFadeStart, uEdgeFadeEnd, length(vUv * 2.0 - 1.0));
                visibility *= edgeFade;

                // 中心減光
                if (uCenterDim > 0.001) {
                    float centerDist = length(vUv - 0.5) * 2.0;
                    float centerMask = smoothstep(0.0, 0.3, centerDist);
                    visibility *= mix(1.0, centerMask, uCenterDim);
                }

                // 色
                vec3 baseColor = vec3(uColorR, uColorG, uColorB);
                vec3 brightColor = vec3(uBrightColorR, uBrightColorG, uBrightColorB);
                vec3 color = mix(baseColor, brightColor, density * uColorMix);

                // 彩度
                if (abs(uSaturation - 1.0) > 0.01) {
                    float luma = dot(color, vec3(0.299, 0.587, 0.114));
                    color = mix(vec3(luma), color, uSaturation);
                }

                color *= visibility * uIntensity * uBrightness;

                // --- 発光 ---
                if (uPSGlowAmount > 0.001) {
                    vec3 glowColor = vec3(uPSGlowColorR, uPSGlowColorG, uPSGlowColorB);
                    float glowMask = pow(density, uPSGlowSpread) * grain * edgeFade * uPSGlowAmount;
                    color += glowColor * glowMask;
                }

                // --- ブルーム風にじみ ---
                if (uBloomAmount > 0.001) {
                    float bloomMask = density * grain * edgeFade * uBloomAmount;
                    color += color * bloomMask;
                }

                float alpha = visibility * uOpacity;
                if (alpha < 0.001) discard;
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
}

export function createParticleStormMesh(material) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(
        particleStormParams.posX,
        particleStormParams.posY,
        particleStormParams.posZ
    );
    mesh.scale.set(particleStormParams.size, particleStormParams.size, 1);
    return mesh;
}
