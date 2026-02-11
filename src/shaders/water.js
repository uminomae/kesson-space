// water.js — 水面シェーダー

import * as THREE from 'three';
import { noiseGLSL } from './noise.glsl.js';

export function createWaterMaterial(camera) {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uColor: { value: new THREE.Color(0x1a1a2e) },
            uCameraPos: { value: camera.position },
        },
        vertexShader: `
            uniform float uTime;
            varying vec2 vUv;
            varying float vWaveHeight;
            varying vec3 vWorldPos;
            varying vec3 vWorldNormal;
            ${noiseGLSL}

            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                for (int i = 0; i < 4; i++) {
                    value += amplitude * snoise(p * frequency);
                    amplitude *= 0.5;
                    frequency *= 2.02;
                }
                return value;
            }

            void main() {
                vUv = uv;
                vec3 pos = position;

                float wave = fbm(vec2(
                    pos.x * 0.02 + uTime * 0.04,
                    pos.y * 0.02 - uTime * 0.03
                ));
                pos.z += wave * 2.0;
                vWaveHeight = wave;

                vec4 worldPos = modelMatrix * vec4(pos, 1.0);
                vWorldPos = worldPos.xyz;

                float eps = 0.5;
                float hL = fbm(vec2((position.x - eps) * 0.02 + uTime * 0.04, position.y * 0.02 - uTime * 0.03));
                float hR = fbm(vec2((position.x + eps) * 0.02 + uTime * 0.04, position.y * 0.02 - uTime * 0.03));
                float hD = fbm(vec2(position.x * 0.02 + uTime * 0.04, (position.y - eps) * 0.02 - uTime * 0.03));
                float hU = fbm(vec2(position.x * 0.02 + uTime * 0.04, (position.y + eps) * 0.02 - uTime * 0.03));
                vec3 localNormal = normalize(vec3(hL - hR, hD - hU, eps * 2.0));
                vWorldNormal = normalize((modelMatrix * vec4(localNormal, 0.0)).xyz);

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uTime;
            uniform vec3 uCameraPos;
            varying vec2 vUv;
            varying float vWaveHeight;
            varying vec3 vWorldPos;
            varying vec3 vWorldNormal;

            void main() {
                vec3 deepColor = vec3(0.04, 0.06, 0.14);
                float depthFactor = clamp(vWaveHeight * 0.3 + 0.5, 0.0, 1.0);
                vec3 waterColor = mix(uColor, deepColor, depthFactor);

                vec3 viewDir = normalize(uCameraPos - vWorldPos);
                float fresnel = pow(1.0 - max(dot(viewDir, vWorldNormal), 0.0), 3.0);
                fresnel = 0.05 + 0.15 * fresnel;
                waterColor = mix(waterColor, vec3(0.6, 0.7, 0.9), fresnel);

                float highlight = smoothstep(0.3, 0.8, vWaveHeight) * 0.15;
                waterColor += vec3(highlight);

                float edgeFade = smoothstep(0.0, 0.3, vUv.x)
                               * smoothstep(0.0, 0.3, 1.0 - vUv.x)
                               * smoothstep(0.0, 0.3, vUv.y)
                               * smoothstep(0.0, 0.3, 1.0 - vUv.y);

                float alpha = 0.25 + clamp(vWaveHeight * 0.15, -0.1, 0.15);
                alpha *= edgeFade;

                gl_FragColor = vec4(waterColor, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });
}

export function createWaterMesh(material) {
    const geo = new THREE.PlaneGeometry(300, 300, 60, 60);
    const mesh = new THREE.Mesh(geo, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -20;
    return mesh;
}
