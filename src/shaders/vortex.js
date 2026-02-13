// vortex.js — 渦シェーダー（M2 段階4: 個の立ち上がり）
// Original: @YoheiNishitsuji (つぶやきGLSL)
// Faithful port from twigl → Three.js ShaderMaterial
// Shader modifications by Gemini MCP

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
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                // Billboard: always face camera
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
            uniform float uColorR;
            uniform float uColorG;
            uniform float uColorB;
            uniform float uIterations;
            uniform float uInnerIterLimit;
            varying vec2 vUv;

            // HSV to RGB — standard K-based conversion (matches twigl hsv())
            vec3 hsv(float h, float s, float v) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
                return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
            }

            void main() {
                float t = uTime * uSpeed;

                // CHANGED: Rotate UV 90° for horizontal spiral flow
                vec2 rotatedUv = vec2(vUv.y, 1.0 - vUv.x);

                vec3 d = vec3((rotatedUv - 0.5) * uScale + vec2(0.0, 1.0), 1.0);
                vec3 col = vec3(0.0);

                float e = 0.0;
                // CHANGED: R=0.5 (was 0.0) — ensures effect is always visible
                // R=0 caused first iterations to produce no movement (d*e*R*0.18=0)
                float R = 0.5;
                float s;
                vec3 q = vec3(0.0, -1.0, -1.0);  // q.yz -= 1.0
                vec3 p;

                // CHANGED: loop limit from uniform for performance control
                for (float i = 1.0; i <= 50.0; i += 1.0) {
                    if (i > uIterations) break;
                    e += i / 5000.0;

                    // d /= -d: each component becomes -1.0 (original twigl behavior)
                    if (i > 35.0) d /= -d;

                    col += hsv(0.1, e - 0.4, e / 17.0);

                    s = 1.0;
                    q += d * e * R * 0.18;
                    p = q;

                    R = length(p);
                    p = vec3(
                        log(R) - t * 0.2,
                        -p.z / R,
                        p.y - p.x - t * 0.2
                    );

                    // e = -p.y (negation, confirmed by Gemini review)
                    for (e = -p.y; s < uInnerIterLimit; s += s) {
                        e += cos(dot(cos(p * s), sin(p.zxy * s))) / s * 0.8;
                    }
                }

                col *= uIntensity * 0.02;

                // CHANGED: RGB color tinting
                col *= vec3(uColorR, uColorG, uColorB);

                // Circular edge fade for billboard mesh
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
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(vortexParams.posX, vortexParams.posY, vortexParams.posZ);
    mesh.scale.set(vortexParams.size, vortexParams.size, 1);
    return mesh;
}
