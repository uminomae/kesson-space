// vortex.js — 渦シェーダー（M2 段階4: 個の立ち上がり）
// Original: @YoheiNishitsuji (つぶやきGLSL)
// Faithful port from twigl → Three.js ShaderMaterial

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
            varying vec2 vUv;

            vec3 hsv2rgb(float h, float s, float v) {
                vec3 c = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
                return v * mix(vec3(1.0), c, s);
            }

            void main() {
                float t = uTime * uSpeed;

                // Original: d = vec3((FC.xy - 0.5*r)/r + vec2(0,1), 1)
                // (FC.xy - 0.5*r)/r gives range (-0.5, 0.5)
                // FIX: was *(2.0*uScale), now matches original normalization
                vec2 uv = (vUv - 0.5) * uScale;
                vec3 d = vec3(uv + vec2(0.0, 1.0), 1.0);

                vec3 col = vec3(0.0);

                // Original: float i,s,R,e; vec3 q,p — all init to 0
                // q.yz-- → q = (0, -1, -1)
                float e = 0.0;
                float R = 0.0;
                float s;
                vec3 q = vec3(0.0, -1.0, -1.0);
                vec3 p;

                // Original loop: for(q.yz--; i++ < 50.;)
                // i++ in condition → body sees i = 1..50
                for (float i = 1.0; i <= 50.0; i += 1.0) {
                    e += i / 5000.0;

                    // Original: i>35.?d/=-d  (each component → -1)
                    if (i > 35.0) d /= -d;

                    col += hsv2rgb(0.1, e - 0.4, e / 17.0);

                    s = 1.0;

                    // Original: p = q += d*e*R*.18
                    q += d * e * R * 0.18;
                    p = q;

                    // Original: p = vec3(log(R=length(p))-t*.2, -p.z/R, p.y-p.x-t*.2)
                    // R assigned inside expression
                    R = length(p);
                    p = vec3(
                        log(R) - t * 0.2,
                        -p.z / R,
                        p.y - p.x - t * 0.2
                    );

                    // Original: for(e=--p.y; s<5e2; s+=s)
                    // --p.y: pre-decrement, modifies p.y then assigns to e
                    p.y -= 1.0;
                    e = p.y;

                    for (; s < 500.0; s += s) {
                        e += cos(dot(cos(p * s), sin(p.zxy * s))) / s * 0.8;
                    }
                }

                col *= uIntensity * 0.02;

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
