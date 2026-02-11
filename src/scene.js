// scene.js — 統合グラフィック
// v006f: デフォルト値更新 + カメラ位置パラメータ連携

import * as THREE from 'three';

const noiseGLSL = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
`;

let _waterMaterial;
let _kessonMeshes = [];
let _camera;
let _bgMat;
let _scene;

const BG_V002_CENTER = new THREE.Color(0x050508);
const BG_V002_EDGE = new THREE.Color(0x050508);
const FOG_V002_COLOR = new THREE.Color(0x050508);
const FOG_V002_DENSITY = 0.025;

const BG_V004_CENTER = new THREE.Color(0x2a3a4a);
const BG_V004_EDGE = new THREE.Color(0x0a1520);
const FOG_V004_COLOR = new THREE.Color(0x0a1520);
const FOG_V004_DENSITY = 0.02;

// --- devパネル連携パラメータ ---
export const sceneParams = {
    brightness: 1.65,
    glowCore: 0.05,
    glowSpread: 0.02,
    breathAmp: 0.15,
    warpAmount: 0.6,
    mixCycle: 2.0,
    styleCycle: 14.0,
    fogDensity: 0.0,
    camX: -14,
    camY: 0,
    camZ: 34,
    camTargetY: -1,
};

export function createScene(container) {
    const scene = new THREE.Scene();
    _scene = scene;

    scene.fog = new THREE.FogExp2(FOG_V004_COLOR.getHex(), FOG_V004_DENSITY);

    const bgGeo = new THREE.PlaneGeometry(2, 2);
    _bgMat = new THREE.ShaderMaterial({
        uniforms: {
            uColorCenterA: { value: BG_V002_CENTER },
            uColorEdgeA:   { value: BG_V002_EDGE },
            uColorCenterB: { value: BG_V004_CENTER },
            uColorEdgeB:   { value: BG_V004_EDGE },
            uMix: { value: 1.0 },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColorCenterA;
            uniform vec3 uColorEdgeA;
            uniform vec3 uColorCenterB;
            uniform vec3 uColorEdgeB;
            uniform float uMix;
            varying vec2 vUv;
            void main() {
                float dist = length(vUv - 0.5);
                float vignette = smoothstep(0.0, 1.2, dist);

                vec3 colorA = mix(uColorCenterA, uColorEdgeA, vignette);
                vec3 colorB = mix(uColorCenterB, uColorEdgeB, vignette);
                vec3 color = mix(colorA, colorB, uMix);

                float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
                color += (noise - 0.5) * 0.015;

                gl_FragColor = vec4(color, 1.0);
            }
        `,
        depthWrite: false,
        depthTest: false
    });
    const bgMesh = new THREE.Mesh(bgGeo, _bgMat);
    bgMesh.renderOrder = -999;
    scene.add(bgMesh);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(sceneParams.camX, sceneParams.camY, sceneParams.camZ);
    camera.lookAt(0, sceneParams.camTargetY, -10);
    _camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 水面シェーダー
    _waterMaterial = new THREE.ShaderMaterial({
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
    const waterGeo = new THREE.PlaneGeometry(300, 300, 60, 60);
    const water = new THREE.Mesh(waterGeo, _waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -20;
    scene.add(water);

    // 光（欠損）シェーダー
    const kessonMaterial = new THREE.ShaderMaterial({
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

    const warmColors = [0xff7744, 0xff9955, 0xff5522];
    const coolColors = [0x4477ff, 0x5599ff, 0x2255ee];
    const kessonMeshes = [];
    const kessonGeo = new THREE.PlaneGeometry(12, 12);

    for (let i = 0; i < 40; i++) {
        const isWarm = Math.random() > 0.5;
        const colorPalette = isWarm ? warmColors : coolColors;
        const colorStr = colorPalette[Math.floor(Math.random() * colorPalette.length)];

        const mat = kessonMaterial.clone();
        mat.uniforms.uColor.value = new THREE.Color(colorStr);
        mat.uniforms.uOffset.value = Math.random() * 1000.0;

        const mesh = new THREE.Mesh(kessonGeo, mat);
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
        kessonMeshes.push(mesh);
    }
    _kessonMeshes = kessonMeshes;

    return { scene, camera, renderer, kessonMeshes };
}

export function getCamera() {
    return _camera;
}

export function updateScene(time) {
    const mixCycle = sceneParams.mixCycle;
    const styleCycle = sceneParams.styleCycle;

    const m = (Math.sin(time * Math.PI / mixCycle) + 1.0) * 0.5;
    const s = (Math.sin(time * Math.PI / styleCycle) + 1.0) * 0.5;

    _bgMat.uniforms.uMix.value = m;

    const fogColor = new THREE.Color().lerpColors(FOG_V002_COLOR, FOG_V004_COLOR, m);
    _scene.fog.color.copy(fogColor);
    const baseFogV002 = FOG_V002_DENSITY;
    const baseFogV004 = sceneParams.fogDensity;
    _scene.fog.density = baseFogV002 + (baseFogV004 - baseFogV002) * m;

    _waterMaterial.uniforms.uTime.value = time;
    _waterMaterial.uniforms.uCameraPos.value.copy(_camera.position);

    _kessonMeshes.forEach(mesh => {
        const u = mesh.material.uniforms;
        u.uTime.value = time;
        u.uMix.value = m;
        u.uStyle.value = s;
        u.uBrightness.value = sceneParams.brightness;
        u.uGlowCore.value = sceneParams.glowCore;
        u.uGlowSpread.value = sceneParams.glowSpread;
        u.uBreathAmp.value = sceneParams.breathAmp;
        u.uWarpAmount.value = sceneParams.warpAmount;
        mesh.position.y = mesh.userData.baseY + Math.sin(time * mesh.userData.speed + mesh.userData.id) * 2;
        mesh.position.x = mesh.userData.baseX + Math.cos(time * mesh.userData.speed * 0.5 + mesh.userData.id) * 2;
        mesh.lookAt(_camera.position);
    });
}
