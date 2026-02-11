// kesson.js — 光（欠損）シェーダー

import * as THREE from 'three';
import { noiseGLSL } from './noise.glsl.js';
import { sceneParams, WARM_COLORS, COOL_COLORS } from '../config.js';

export function createKessonMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uColor: { value: new THREE.Color(0xffffff) },
            uOffset: { value: 0.0 },
            uMix: { value: 1.0 },
            uStyle: { value: 0.0 },
            uBrightness: { value: sceneParams.brightness },
            uGlowCore: { value: sceneParams.glowCore },
            uGlowSpread: { value: sceneParams.glowSpread },
            uBreathAmp: { value: sceneParams.breathAmp },
            uWarpAmount: { value: sceneParams.warpAmount },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                mvPosition.xy += position.xy;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uTime;
            uniform float uOffset;
            uniform float uMix;
            uniform float uStyle;
            uniform float uBrightness;
            uniform float uGlowCore;
            uniform float uGlowSpread;
            uniform float uBreathAmp;
            uniform float uWarpAmount;
            varying vec2 vUv;
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

            mat2 rot(float a) {
                float s = sin(a), c = cos(a);
                return mat2(c, -s, s, c);
            }

            void main() {
                vec2 uv = (vUv - 0.5) * 2.0;
                float t = uTime * 0.15 + uOffset;

                float uvDist = length(vUv - 0.5) * 2.0;
                float uvFade = 1.0 - smoothstep(0.6, 1.0, uvDist);

                vec2 pA = uv;
                float ampA = uWarpAmount;
                for(int i = 0; i < 3; i++) {
                    pA += vec2(snoise(pA + t), snoise(pA - t)) * ampA;
                    pA *= rot(t * 0.1);
                    ampA *= 0.5;
                }

                vec2 pB = uv;
                pB += vec2(
                    fbm(pB + t * 0.7),
                    fbm(pB.yx + t * 0.9 + uOffset * 1.2)
                ) * uWarpAmount * 0.67;
                pB += vec2(
                    snoise(pB + t * 0.3) * uWarpAmount * 0.42,
                    snoise(pB - t * 0.2) * uWarpAmount * 0.42
                );
                pB *= rot(t * 0.05);

                vec2 p = mix(pA, pB, uStyle);
                float dist = length(p);

                float coreA = 0.08 / (dist + 0.01);
                float patternA_s = sin(p.x * 12.0 + t) * sin(p.y * 12.0 - t) * 0.1;
                float patternA_f = fbm(p * 6.0 + t * 0.5) * 0.12;
                float patternA = mix(patternA_s, patternA_f, uStyle);
                float voidHole = smoothstep(0.0, 0.4, dist);
                float breathA = (1.0 - uBreathAmp) + uBreathAmp * 2.0 * sin(uTime * 1.2 + uOffset * 10.0);
                float alphaA = (coreA + patternA) * voidHole * breathA;
                alphaA = smoothstep(0.01, 1.0, alphaA);
                vec3 colorA = mix(uColor, vec3(1.0), coreA * 0.5);

                float glowIntensity = uGlowCore / (dist * dist + uGlowSpread);

                vec3 coreWhite = vec3(1.0, 0.98, 0.95);
                vec3 innerHalo = vec3(0.7, 0.85, 1.0);
                vec3 colorB = uColor;
                colorB = mix(colorB, innerHalo, smoothstep(0.3, 2.0, glowIntensity));
                colorB = mix(colorB, coreWhite, smoothstep(2.0, 6.0, glowIntensity));

                float edgeSimple = snoise(p * 4.0 + t) * 0.5 + 0.5;
                float edgeFbm = fbm(p * 3.0 + t * 0.4) * 0.5 + 0.5;
                float edgePattern = mix(edgeSimple, edgeFbm, uStyle);

                float alphaB = smoothstep(0.0, 1.0, glowIntensity * 0.5);
                float noiseBlend = smoothstep(2.0, 0.3, glowIntensity);
                alphaB *= mix(1.0, edgePattern, noiseBlend);

                float breathB_simple = (1.0 - uBreathAmp) + uBreathAmp * sin(uTime * 1.5 + uOffset * 10.0);
                float breathB_complex = (1.0 - uBreathAmp) + uBreathAmp * sin(uTime * 0.8 + uOffset * 6.0)
                                       + uBreathAmp * 0.33 * sin(uTime * 2.1 + uOffset * 3.0);
                float breathB = mix(breathB_simple, breathB_complex, uStyle);
                alphaB *= breathB;

                float warpVignette = smoothstep(0.0, 1.0, 1.0 - dist * 0.7);

                float alpha = mix(alphaA, alphaB, uMix) * uvFade * warpVignette;
                alpha *= uBrightness;
                vec3 finalColor = mix(colorA, colorB * (1.0 + uBrightness), uMix);

                if(alpha < 0.01) discard;

                gl_FragColor = vec4(finalColor, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
}

export function createKessonMeshes(scene, baseMaterial) {
    const meshes = [];
    const geo = new THREE.PlaneGeometry(12, 12);

    for (let i = 0; i < 40; i++) {
        const isWarm = Math.random() > 0.5;
        const colorPalette = isWarm ? WARM_COLORS : COOL_COLORS;
        const colorStr = colorPalette[Math.floor(Math.random() * colorPalette.length)];

        const mat = baseMaterial.clone();
        mat.uniforms.uColor.value = new THREE.Color(colorStr);
        mat.uniforms.uOffset.value = Math.random() * 1000.0;

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 90,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 60 - 10
        );

        mesh.userData = {
            baseY: mesh.position.y,
            baseX: mesh.position.x,
            speed: 0.05 + Math.random() * 0.15,
            id: i
        };

        scene.add(mesh);
        meshes.push(mesh);
    }
    return meshes;
}
