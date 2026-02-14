// vortex.js — 渦シェーダー（M2 段階4: 個の立ち上がり）
// FBM-based stable spiral vortex — replaces twigl raymarching
// Shader concept by Gemini MCP, integration by Claude

import * as THREE from 'three';
import { vortexParams } from '../config.js';
import { noiseGLSL } from './noise.glsl.js';

export function createVortexMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime:      { value: 0.0 },
            uSpeed:     { value: vortexParams.speed },
            uIntensity: { value: vortexParams.intensity },
            uScale:     { value: vortexParams.scale },
            uOpacity:   { value: vortexParams.opacity },
            uColorR:    { value: vortexParams.colorR },
            uColorG:    { value: vortexParams.colorG },
            uColorB:    { value: vortexParams.colorB },
            uArmCount:  { value: vortexParams.armCount },
        },
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
            uniform float uArmCount;
            varying vec2 vUv;

            ${noiseGLSL}

            // FBM with 4 octaves
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

            void main() {
                // Center UV: PlaneGeometry UV is 0-1, shift to -0.5..0.5
                vec2 centered = (vUv - 0.5) * uScale;

                // Polar coordinates
                float radius = length(centered);
                float theta = atan(centered.y, centered.x);

                // Rotating time
                float t = uTime * uSpeed;

                // FBM distortion for organic feel
                float distortion = fbm(centered * 1.5 + t * 0.1) * 0.8;

                // Spiral arms: cos(armCount * theta - radius * twist + time)
                float twist = 3.0 + fbm(centered * 0.8) * 1.5;
                float spiral = cos(uArmCount * (theta + distortion) - radius * twist + t);
                // Soften to 0..1 range
                spiral = spiral * 0.5 + 0.5;
                // Sharpen arms slightly
                spiral = smoothstep(0.3, 0.7, spiral);

                // Secondary fine detail layer
                float detail = fbm(centered * 3.0 - t * 0.15) * 0.3 + 0.7;
                spiral *= detail;

                // Radial fade: strong in center, fades at edges
                // Using scaled radius relative to half the UV scale
                float halfScale = uScale * 0.5;
                float normR = radius / halfScale;
                float edgeFade = smoothstep(1.0, 0.2, normR);

                // Center dimming: slight hole in the very center for realism
                float centerDim = smoothstep(0.0, 0.15, normR);

                float mask = spiral * edgeFade * centerDim;

                // Color: water-matched dark navy palette
                vec3 baseColor = vec3(0.04, 0.06, 0.14);  // deep water
                vec3 armColor  = vec3(0.08, 0.12, 0.22);  // lighter swirl
                vec3 color = mix(baseColor, armColor, mask);

                // Apply tint multiplier
                color *= vec3(uColorR, uColorG, uColorB);

                // Subtle luminance along arms
                float glow = mask * 0.15;
                color += glow;

                // Overall intensity
                color *= uIntensity;

                // Alpha: based on mask + minimum base for subtle presence
                float alpha = (mask * 0.6 + 0.05) * edgeFade * uOpacity;

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

export function createVortexMesh(material) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(vortexParams.posX, vortexParams.posY, vortexParams.posZ);
    mesh.scale.set(vortexParams.size, vortexParams.size, 1);
    // Lay flat on XZ plane (horizontal, like water surface)
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
}
