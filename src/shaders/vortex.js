// vortex.js — 渦シェーダー（M2 段階4: 個の立ち上がり）
// Original: @YoheiNishitsuji (つぶやきGLSL)
// Faithful port from twigl → Three.js ShaderMaterial
// Shader modifications by Gemini MCP, reviewed by Codex (GPT-4o)

import * as THREE from 'three';
import { vortexParams } from '../config.js';

export function createVortexMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime:           { value: 0.0 },
            uSpeed:          { value: vortexParams.speed },
            uIntensity:      { value: vortexParams.intensity },
            uScale:          { value: vortexParams.scale },
            uOpacity:        { value: vortexParams.opacity },
            uColorR:         { value: vortexParams.colorR },
            uColorG:         { value: vortexParams.colorG },
            uColorB:         { value: vortexParams.colorB },
            uIterations:     { value: vortexParams.iterations },
            uInnerIterLimit: { value: vortexParams.innerIterLimit },
        },
        // CHANGED: Standard VS (no billboard) — orientation controlled by mesh.rotation
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uSpeed;
            uniform float uIntensity;
            uniform float uScale;
            uniform float uOpacity;
            uniform float uColorR;
            uniform float uColorG;
            uniform float uColorB;
            uniform float uIterations;
            uniform float uInnerIterLimit;
            varying vec2 vUv;

            vec3 hsv(float h, float s, float v) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
                return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
            }

            void main() {
                // FIX: mod() wrap prevents tScaled from growing unbounded
                // This was the root cause of intermittent disappearance
                float tScaled = mod(uTime * uSpeed * 0.2, 6.28318530718);

                // Rotate UV 90° for horizontal spiral flow
                vec2 rotatedUv = vec2(vUv.y, 1.0 - vUv.x);

                vec3 d = vec3((rotatedUv - 0.5) * uScale + vec2(0.0, 1.0), 1.0);
                vec3 col = vec3(0.0);

                float e = 0.0;
                float R = 0.5;
                float s;
                vec3 q = vec3(0.0, -1.0, -1.0);
                vec3 p;

                for (float i = 1.0; i <= 50.0; i += 1.0) {
                    if (i > uIterations) break;
                    e += i / 5000.0;

                    // d /= -d: each component becomes -1.0
                    // Safe: d initialized to non-zero values
                    if (i > 35.0) d /= -d;

                    col += hsv(0.1, e - 0.4, e / 17.0);

                    s = 1.0;
                    q += d * e * R * 0.18;
                    p = q;

                    R = max(length(p), 0.001);
                    p = vec3(
                        log(R) - tScaled,
                        -p.z / R,
                        p.y - p.x - tScaled
                    );

                    for (e = -p.y; s < uInnerIterLimit; s += s) {
                        e += cos(dot(cos(p * s), sin(p.zxy * s))) / s * 0.8;
                    }
                }

                col *= uIntensity * 0.02;
                col *= vec3(uColorR, uColorG, uColorB);

                float dist = length((vUv - 0.5) * 2.0);
                float edgeFade = smoothstep(1.0, 0.3, dist);

                float alpha = clamp(length(col) * 0.5, 0.0, 1.0) * edgeFade * uOpacity;

                if (alpha < 0.001) discard;
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
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(vortexParams.posX, vortexParams.posY, vortexParams.posZ);
    mesh.scale.set(vortexParams.size, vortexParams.size, 1);
    // CHANGED: Lay flat on XZ plane (horizontal, perpendicular to Y axis)
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
}
