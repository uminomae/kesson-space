import * as THREE from 'three';
import { quantumFieldParams } from '../config.js';

export function createQuantumFieldMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uOpacity: { value: quantumFieldParams.opacity },
            uSlitPosition: { value: quantumFieldParams.slitPosition },
            uWaveCount: { value: quantumFieldParams.waveCount },
            uParticleIntensity: { value: quantumFieldParams.particleIntensity },
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
            uniform float uOpacity;
            uniform float uSlitPosition;
            uniform float uWaveCount;
            uniform float uParticleIntensity;
            varying vec2 vUv;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            void main() {
                vec2 uv = vUv;
                vec3 deepColor = vec3(0.01, 0.05, 0.08);
                vec3 cyanColor = vec3(0.2, 0.8, 1.0);

                float t = uTime;
                float leftMask = 1.0 - smoothstep(uSlitPosition - 0.02, uSlitPosition + 0.02, uv.x);

                float interference = 0.0;
                for (int i = 0; i < 7; i++) {
                    float fi = float(i);
                    float enabled = step(fi + 0.5, uWaveCount);
                    float yOffset = (fi - 3.0) * 0.04;
                    float phase = fi * 1.2;
                    float wave = sin((uv.x * (10.0 + fi * 1.6)) - t * 2.2 + phase);
                    float envelope = exp(-abs(uv.y - (0.5 + yOffset)) * 13.0);
                    interference += enabled * wave * envelope;
                }
                float waveGlow = smoothstep(0.18, 0.85, abs(interference) * 0.7) * leftMask;

                float slitBand = 1.0 - smoothstep(0.006, 0.02, abs(uv.x - uSlitPosition));
                float slit1 = 1.0 - smoothstep(0.07, 0.10, abs(uv.y - 0.34));
                float slit2 = 1.0 - smoothstep(0.07, 0.10, abs(uv.y - 0.66));
                float slitOpen = max(slit1, slit2);
                float wallSolid = slitBand * (1.0 - slitOpen);
                float wallGlow = slitBand * (0.25 + slitOpen * 0.75);

                float rightMask = smoothstep(uSlitPosition + 0.01, uSlitPosition + 0.08, uv.x);
                float distFromSlit = max(uv.x - uSlitPosition, 0.0);

                vec2 slitPos1 = vec2(uSlitPosition, 0.34);
                vec2 slitPos2 = vec2(uSlitPosition, 0.66);
                float d1 = length(uv - slitPos1);
                float d2 = length(uv - slitPos2);
                float diffraction = (0.5 + 0.5 * cos((d1 - d2) * 72.0 - t * 3.5));
                diffraction *= exp(-distFromSlit * 1.8) * rightMask;

                float beam = exp(-pow(uv.y - 0.5, 2.0) * 190.0);
                beam *= exp(-distFromSlit * 3.8) * rightMask;

                vec2 particleGrid = vec2(34.0, 18.0);
                vec2 cellId = floor(uv * particleGrid);
                vec2 cellUv = fract(uv * particleGrid) - 0.5;
                float seeded = hash(cellId + floor(t * 6.0));
                float particleGate = step(0.86, seeded);
                float particleShape = 1.0 - smoothstep(0.02, 0.11, length(cellUv));
                float particlePulse = 0.5 + 0.5 * sin(t * 10.0 + seeded * 20.0);
                float particles = particleGate * particleShape * particlePulse;
                particles *= rightMask * uParticleIntensity * smoothstep(0.03, 0.20, distFromSlit);

                float pattern = waveGlow + wallGlow * 0.7 + wallSolid * 0.4;
                pattern += diffraction * 1.1 + beam * 0.65 + particles * 1.5;

                vec3 color = deepColor + cyanColor * pattern;
                color += vec3(1.0) * (particles * 0.8 + beam * 0.35 + wallGlow * 0.15);

                float alpha = clamp(
                    (waveGlow * 0.7 + wallGlow * 0.8 + wallSolid * 0.6 + diffraction + beam * 0.7 + particles * 1.2) * uOpacity,
                    0.0,
                    1.0
                );

                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
}

export function createQuantumFieldMesh(material) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(quantumFieldParams.posX, quantumFieldParams.posY, quantumFieldParams.posZ);
    mesh.scale.set(quantumFieldParams.size, quantumFieldParams.size, 1);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
}
