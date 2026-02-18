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
                // アスペクト比補正
                vec2 pos = vUv * 2.0 - 1.0;
                float safeH = max(uResolution.y, 1.0);
                pos.x *= uResolution.x / safeH;

                float t = uTime * uSpeed;

                // --- 波動関数 ψ の計算 ---
                // |ψ|² を粒の密度・明るさに使用
                // 勾配 (dψ/dx, dψ/dy) を移流ベクトルに使用
                float psiReal = 0.0;
                float psiImag = 0.0;
                float gradRealX = 0.0;
                float gradRealY = 0.0;

                int wCount = int(clamp(uWaveCount, 1.0, 8.0));

                // 位相ノイズ（リキッド揺らぎ）
                float phaseNoise = fbm(pos * uNoiseScale + vec2(t * 0.05, t * 0.03)) * uNoiseAmp;

                for (int n = 0; n < 8; n++) {
                    if (n >= wCount) break;
                    float idx = float(n);

                    // 波数ベクトル（放射状にばらつかせる）
                    float angle = idx * 0.785 + 0.3 * sin(idx * 1.7);
                    float kMag = uBaseFreq * (1.0 + idx * 0.3);
                    float kx = kMag * cos(angle);
                    float ky = kMag * sin(angle);

                    // 分散関係
                    float omega = uDispersion * kMag * kMag;

                    // 位相
                    float phase = kx * pos.x + ky * pos.y - omega * t + idx * 1.618 + phaseNoise;

                    // 振幅減衰
                    float amp = 1.0 / (1.0 + idx * 0.35);

                    // ψ = Σ A * exp(i * phase) → real = cos, imag = sin
                    psiReal += amp * cos(phase);
                    psiImag += amp * sin(phase);

                    // 勾配（移流用）
                    gradRealX += amp * (-kx) * sin(phase);
                    gradRealY += amp * (-ky) * sin(phase);
                }

                // |ψ|² 確率密度（0〜1に正規化）
                float psiSq = (psiReal * psiReal + psiImag * psiImag);
                float maxPsiSq = uWaveCount * uWaveCount * 0.15; // 大まかな正規化
                float density = clamp(psiSq / max(maxPsiSq, 0.01), 0.0, 1.0);

                // --- 移流（advection）---
                // 波動場の勾配で粒の位置をずらす
                vec2 advect = vec2(gradRealX, gradRealY) * uAdvectStrength;

                // --- 粒（grain）の生成 ---
                // ハッシュノイズグリッドで粒をランダム配置
                // 移流ベクトルで時間経過とともに粒が流れる
                vec2 grainPos = (pos + advect * t) * uGrainDensity;
                vec2 gridCell = floor(grainPos);
                vec2 gridFrac = fract(grainPos);

                float grain = 0.0;
                // 近傍3x3セルを走査（粒の表示を安定させる）
                for (int gx = -1; gx <= 1; gx++) {
                    for (int gy = -1; gy <= 1; gy++) {
                        vec2 neighbor = vec2(float(gx), float(gy));
                        vec2 cellId = gridCell + neighbor;

                        // セルごとのランダム位置
                        float rnd = hash21(cellId);
                        vec2 particlePos = neighbor + vec2(
                            hash21(cellId + 0.1),
                            hash21(cellId + 0.2)
                        ) - gridFrac;

                        // 粒までの距離
                        float dist = length(particlePos);

                        // 粒の明るさ（距離 + ランダムサイズ）
                        float particleSize = 0.3 + rnd * 0.4;
                        float particleBright = smoothstep(particleSize, particleSize * uGrainSize, dist);

                        // ランダムな明滅（時間変化）
                        float flicker = 0.5 + 0.5 * sin(t * 2.0 + rnd * 6.283);
                        particleBright *= flicker;

                        grain += particleBright;
                    }
                }
                grain = clamp(grain, 0.0, 1.0);

                // --- 合成 ---
                // density（|ψ|²）で粒の見え方を制御
                float visibility = grain * density;

                // エッジフェード
                float edgeFade = smoothstep(1.8, 0.3, length(pos));
                visibility *= edgeFade;

                // 色: 密度に応じてシアン〜白にシフト
                vec3 baseColor = vec3(uColorR, uColorG, uColorB);
                vec3 brightColor = vec3(0.7, 0.85, 1.0); // 高密度域は白寄り
                vec3 color = mix(baseColor, brightColor, density * 0.5);
                color *= visibility * uIntensity;

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
