// vortex.js — 渦シェーダー（M2 段階4: 個の立ち上がり）
// twigl系フラクタルレイマーチング → Three.js ShaderMaterial
// 対数極座標変換による無限自己相似 + フラクタルノイズ蓄積

import * as THREE from 'three';
import { vortexParams } from '../config.js';

export function createVortexMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime:      { value: 0.0 },
            uSpeed:     { value: vortexParams.speed },
            uIntensity: { value: vortexParams.intensity },
            uScale:     { value: vortexParams.scale },
            uOpacity:   { value: vortexParams.opacity },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                // Billboard: always face camera (same technique as kesson lights)
                vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                mvPosition.xy += position.xy * vec2(
                    length(modelMatrix[0].xyz),
                    length(modelMatrix[1].xyz)
                );
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uSpeed;
            uniform float uIntensity;
            uniform float uScale;
            uniform float uOpacity;
            varying vec2 vUv;

            vec3 hsv2rgb(float h, float s, float v) {
                vec3 c = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
                return v * mix(vec3(1.0), c, s);
            }

            void main() {
                float t = uTime * uSpeed;

                // Centered UV + y+1 offset (original twigl ray direction)
                vec2 uv = (vUv - 0.5) * 2.0 * uScale;
                vec3 d = vec3(uv + vec2(0.0, 1.0), 1.0);

                vec3 col = vec3(0.0);
                vec3 q = vec3(0.0, -1.0, -1.0);
                float e = 0.0;
                float R = 0.0;

                for (float i = 0.0; i < 50.0; i += 1.0) {
                    e += i / 5000.0;

                    // Direction reversal after step 35 (reflection fold)
                    // Original: d/=-d → each component becomes -1
                    if (i > 35.0) d = -abs(d);

                    // HSV color accumulation — warm vortex tones
                    col += hsv2rgb(0.1, e - 0.4, e / 17.0);

                    // Ray advance through log-polar space
                    q += d * e * R * 0.18;
                    vec3 p = q;

                    // Log-polar transform → infinite self-similarity (渦の核心)
                    R = length(p);
                    float safeR = max(R, 0.0001);
                    p = vec3(
                        log(safeR) - t * 0.2,
                        -p.z / safeR,
                        p.y - p.x - t * 0.2
                    );

                    // Fractal noise accumulation (doubling frequency)
                    e = p.y - 1.0;
                    for (float freq = 1.0; freq < 500.0; freq *= 2.0) {
                        e += cos(dot(cos(p * freq), sin(p.zxy * freq))) / freq * 0.8;
                    }
                }

                col *= uIntensity * 0.02;

                // Circular edge fade
                float dist = length((vUv - 0.5) * 2.0);
                float edgeFade = smoothstep(1.0, 0.3, dist);

                float alpha = clamp(length(col) * 0.5, 0.0, 1.0) * edgeFade * uOpacity;

                if (alpha < 0.005) discard;
                gl_FragColor = vec4(col, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
}

export function createVortexMesh(material) {
    // PlaneGeometry; billboard vertex shader handles camera facing
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, material);
    // No rotation needed — billboard VS handles orientation
    mesh.position.set(vortexParams.posX, vortexParams.posY, vortexParams.posZ);
    mesh.scale.set(vortexParams.size, vortexParams.size, 1);
    return mesh;
}
