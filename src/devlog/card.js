/**
 * card.js — セッションカード
 *
 * PlaneGeometry + ShaderMaterial。
 * カテゴリ色のグラデーション背景、intensityに応じた枠線の輝度。
 */

import * as THREE from 'three';

const CARD_SIZE = 2.0;

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uHover;
    uniform float uSelected;
    uniform float uBreath;
    uniform float uCommitCount;
    varying vec2 vUv;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
        vec2 uv = vUv;
        vec3 dark = vec3(0.04, 0.06, 0.1);
        float grad = uv.y * 0.4 + noise(uv * 4.0) * 0.1;
        vec3 bg = mix(dark, uColor * 0.3, grad * uIntensity);
        float breath = sin(uBreath) * 0.5 + 0.5;
        bg += uColor * 0.05 * breath * uIntensity;

        float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
        float edgeWidth = 0.02 + uHover * 0.01;
        float border = smoothstep(edgeWidth, edgeWidth - 0.008, edgeDist);
        vec3 borderColor = uColor * (0.3 + uIntensity * 0.7);
        borderColor += vec3(1.0, 0.9, 0.7) * uHover * 0.3;

        float centerDist = length(uv - 0.5);
        float centerGlow = exp(-centerDist * centerDist * 8.0) * uIntensity * 0.4;
        vec3 glowColor = uColor * 0.8 + vec3(0.2);

        vec3 color = bg;
        color = mix(color, borderColor, border * (0.4 + breath * 0.2));
        color += glowColor * centerGlow;
        color += vec3(0.03) * uHover;
        color += noise(uv * 50.0) * 0.02;

        gl_FragColor = vec4(color, 1.0);
    }
`;

export function createCard(session, position) {
    const geometry = new THREE.PlaneGeometry(CARD_SIZE, CARD_SIZE);
    const color = new THREE.Color(session.color || '#94a3b8');
    const material = new THREE.ShaderMaterial({
        vertexShader, fragmentShader,
        uniforms: {
            uColor: { value: color },
            uIntensity: { value: session.intensity || 0.5 },
            uHover: { value: 0.0 },
            uSelected: { value: 0.0 },
            uBreath: { value: 0.0 },
            uCommitCount: { value: session.commit_count || 0 },
        },
        transparent: true,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    let hoverTarget = 0;
    mesh.userData.setHover = (val) => { hoverTarget = val ? 1.0 : 0.0; };
    mesh.userData.updateBreath = (t) => {
        material.uniforms.uBreath.value = t * 1.5;
        const current = material.uniforms.uHover.value;
        material.uniforms.uHover.value += (hoverTarget - current) * 0.12;
    };
    mesh.userData.setSelected = (val) => { material.uniforms.uSelected.value = val; };
    return mesh;
}
