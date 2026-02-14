// liquid.js — Metaball風リキッドエフェクト
// ★ 初期値は config.js の liquidParams を参照

import * as THREE from 'three';
import { liquidParams } from '../config.js';
import { noiseGLSL } from './noise.glsl.js';

const LIQUID_SIZE = 128;

export function createLiquidSystem(renderer) {
    const opts = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
    };

    // ピンポンバッファ
    const velocityA = new THREE.WebGLRenderTarget(LIQUID_SIZE, LIQUID_SIZE, opts);
    const velocityB = new THREE.WebGLRenderTarget(LIQUID_SIZE, LIQUID_SIZE, opts);
    const densityA  = new THREE.WebGLRenderTarget(LIQUID_SIZE, LIQUID_SIZE, opts);
    const densityB  = new THREE.WebGLRenderTarget(LIQUID_SIZE, LIQUID_SIZE, opts);
    const pressure  = new THREE.WebGLRenderTarget(LIQUID_SIZE, LIQUID_SIZE, opts);
    const divergence = new THREE.WebGLRenderTarget(LIQUID_SIZE, LIQUID_SIZE, opts);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    // --- Advection シェーダー ---
    const advectionMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tVelocity:   { value: null },
            tSource:     { value: null },
            uTimestep:   { value: liquidParams.timestep },
            uDissipation: { value: liquidParams.dissipation },
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D tVelocity;
            uniform sampler2D tSource;
            uniform float uTimestep;
            uniform float uDissipation;
            varying vec2 vUv;

            void main() {
                vec2 vel = texture2D(tVelocity, vUv).xy;
                vec2 pos = vUv - uTimestep * vel;
                vec4 result = texture2D(tSource, clamp(pos, 0.0, 1.0));
                gl_FragColor = result * uDissipation;
            }
        `,
        depthTest: false,
        depthWrite: false,
    });

    // --- Divergence シェーダー ---
    const divergenceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tVelocity: { value: null },
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D tVelocity;
            varying vec2 vUv;

            void main() {
                float texel = 1.0 / ${LIQUID_SIZE}.0;
                float L = texture2D(tVelocity, vUv - vec2(texel, 0.0)).x;
                float R = texture2D(tVelocity, vUv + vec2(texel, 0.0)).x;
                float B = texture2D(tVelocity, vUv - vec2(0.0, texel)).y;
                float T = texture2D(tVelocity, vUv + vec2(0.0, texel)).y;
                float div = 0.5 * (R - L + T - B);
                gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
            }
        `,
        depthTest: false,
        depthWrite: false,
    });

    // --- Poisson Solve シェーダー ---
    const poissonMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tPressure:   { value: null },
            tDivergence: { value: null },
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D tPressure;
            uniform sampler2D tDivergence;
            varying vec2 vUv;

            void main() {
                float texel = 1.0 / ${LIQUID_SIZE}.0;
                float L = texture2D(tPressure, vUv - vec2(texel, 0.0)).x;
                float R = texture2D(tPressure, vUv + vec2(texel, 0.0)).x;
                float B = texture2D(tPressure, vUv - vec2(0.0, texel)).x;
                float T = texture2D(tPressure, vUv + vec2(0.0, texel)).x;
                float div = texture2D(tDivergence, vUv).x;
                float p = (L + R + B + T - div) * 0.25;
                gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
            }
        `,
        depthTest: false,
        depthWrite: false,
    });

    // --- Gradient Subtract シェーダー ---
    const gradientMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tPressure: { value: null },
            tVelocity: { value: null },
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D tPressure;
            uniform sampler2D tVelocity;
            varying vec2 vUv;

            void main() {
                float texel = 1.0 / ${LIQUID_SIZE}.0;
                float L = texture2D(tPressure, vUv - vec2(texel, 0.0)).x;
                float R = texture2D(tPressure, vUv + vec2(texel, 0.0)).x;
                float B = texture2D(tPressure, vUv - vec2(0.0, texel)).x;
                float T = texture2D(tPressure, vUv + vec2(0.0, texel)).x;
                vec2 grad = vec2(R - L, T - B) * 0.5;
                vec2 vel = texture2D(tVelocity, vUv).xy - grad;
                gl_FragColor = vec4(vel, 0.0, 1.0);
            }
        `,
        depthTest: false,
        depthWrite: false,
    });

    // --- External Force (Velocity) シェーダー ---
    const forceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tVelocity:  { value: null },
            uMouse:     { value: new THREE.Vector2(0.5, 0.5) },
            uMouseVel:  { value: new THREE.Vector2(0, 0) },
            uRadius:    { value: liquidParams.forceRadius },
            uStrength:  { value: liquidParams.forceStrength },
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D tVelocity;
            uniform vec2 uMouse;
            uniform vec2 uMouseVel;
            uniform float uRadius;
            uniform float uStrength;
            varying vec2 vUv;

            void main() {
                vec2 vel = texture2D(tVelocity, vUv).xy;
                vec2 diff = vUv - uMouse;
                float dist = length(diff);
                float influence = smoothstep(uRadius, 0.0, dist);
                float speed = length(uMouseVel);
                if (speed > 0.0001) {
                    vel += uMouseVel * influence * uStrength;
                }
                gl_FragColor = vec4(vel, 0.0, 1.0);
            }
        `,
        depthTest: false,
        depthWrite: false,
    });

    // --- Density Splat シェーダー ---
    const splatMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDensity:   { value: null },
            uMouse:     { value: new THREE.Vector2(0.5, 0.5) },
            uMouseVel:  { value: new THREE.Vector2(0, 0) },
            uRadius:    { value: liquidParams.forceRadius },
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D tDensity;
            uniform vec2 uMouse;
            uniform vec2 uMouseVel;
            uniform float uRadius;
            varying vec2 vUv;

            void main() {
                float density = texture2D(tDensity, vUv).r;
                vec2 diff = vUv - uMouse;
                float dist = length(diff);
                float influence = smoothstep(uRadius, 0.0, dist);
                float speed = length(uMouseVel);
                if (speed > 0.0001) {
                    density += influence * speed * 5.0;
                }
                gl_FragColor = vec4(density, 0.0, 0.0, 1.0);
            }
        `,
        depthTest: false,
        depthWrite: false,
    });

    // --- Liquid Render シェーダー ---
    const renderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDensity:    { value: null },
            uTime:       { value: 0 },
            uDensityMul: { value: liquidParams.densityMul },
            uNoiseScale: { value: liquidParams.noiseScale },
            uNoiseSpeed: { value: liquidParams.noiseSpeed },
            uSpecPow:    { value: liquidParams.specularPow },
            uSpecInt:    { value: liquidParams.specularInt },
            uBaseColor:  { value: new THREE.Vector3(liquidParams.baseColorR, liquidParams.baseColorG, liquidParams.baseColorB) },
            uHighlight:  { value: new THREE.Vector3(liquidParams.highlightR, liquidParams.highlightG, liquidParams.highlightB) },
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            ${noiseGLSL}

            uniform sampler2D tDensity;
            uniform float uTime;
            uniform float uDensityMul;
            uniform float uNoiseScale;
            uniform float uNoiseSpeed;
            uniform float uSpecPow;
            uniform float uSpecInt;
            uniform vec3 uBaseColor;
            uniform vec3 uHighlight;
            varying vec2 vUv;

            void main() {
                float texel = 1.0 / ${LIQUID_SIZE}.0;
                float density = texture2D(tDensity, vUv).r;

                // ノイズで有機的な動き
                float noise = snoise(vUv * uNoiseScale + vec2(uTime * uNoiseSpeed));
                density += noise * 0.1;
                density *= uDensityMul;

                // 法線計算（密度勾配から）
                float dL = texture2D(tDensity, vUv - vec2(texel, 0.0)).r;
                float dR = texture2D(tDensity, vUv + vec2(texel, 0.0)).r;
                float dB = texture2D(tDensity, vUv - vec2(0.0, texel)).r;
                float dT = texture2D(tDensity, vUv + vec2(0.0, texel)).r;
                vec3 normal = normalize(vec3(dL - dR, dB - dT, 0.3));

                // ライティング
                vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
                vec3 viewDir = vec3(0.0, 0.0, 1.0);

                // ディフューズ
                float diffuse = max(dot(normal, lightDir), 0.0);

                // スペキュラ（表面張力の光沢）
                vec3 reflectDir = reflect(-lightDir, normal);
                float spec = pow(max(dot(reflectDir, viewDir), 0.0), uSpecPow);

                // 色合成
                vec3 color = uBaseColor + diffuse * 0.3;
                color += uHighlight * spec * uSpecInt;
                color = mix(vec3(0.0), color, smoothstep(0.0, 0.5, density));

                float alpha = smoothstep(0.0, 0.3, density) * 0.9;
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        depthTest: false,
        depthWrite: false,
    });

    const quad = new THREE.Mesh(geometry, advectionMaterial);
    scene.add(quad);

    let velRead = velocityA, velWrite = velocityB;
    let denRead = densityA, denWrite = densityB;

    function swap(a, b) {
        return [b, a];
    }

    return {
        uniforms: {
            force: forceMaterial.uniforms,
            splat: splatMaterial.uniforms,
            render: renderMaterial.uniforms,
        },

        update(mousePos, mouseVel) {
            // マウス情報を更新
            forceMaterial.uniforms.uMouse.value.copy(mousePos);
            forceMaterial.uniforms.uMouseVel.value.copy(mouseVel);
            splatMaterial.uniforms.uMouse.value.copy(mousePos);
            splatMaterial.uniforms.uMouseVel.value.copy(mouseVel);

            // 1. External Force (Velocity)
            forceMaterial.uniforms.tVelocity.value = velRead.texture;
            quad.material = forceMaterial;
            renderer.setRenderTarget(velWrite);
            renderer.render(scene, camera);
            [velRead, velWrite] = swap(velRead, velWrite);

            // 1b. Density Splat
            splatMaterial.uniforms.tDensity.value = denRead.texture;
            quad.material = splatMaterial;
            renderer.setRenderTarget(denWrite);
            renderer.render(scene, camera);
            [denRead, denWrite] = swap(denRead, denWrite);

            // 2. Advect Velocity
            advectionMaterial.uniforms.tVelocity.value = velRead.texture;
            advectionMaterial.uniforms.tSource.value = velRead.texture;
            quad.material = advectionMaterial;
            renderer.setRenderTarget(velWrite);
            renderer.render(scene, camera);
            [velRead, velWrite] = swap(velRead, velWrite);

            // 3. Advect Density
            advectionMaterial.uniforms.tVelocity.value = velRead.texture;
            advectionMaterial.uniforms.tSource.value = denRead.texture;
            quad.material = advectionMaterial;
            renderer.setRenderTarget(denWrite);
            renderer.render(scene, camera);
            [denRead, denWrite] = swap(denRead, denWrite);

            // 4. Compute Divergence
            divergenceMaterial.uniforms.tVelocity.value = velRead.texture;
            quad.material = divergenceMaterial;
            renderer.setRenderTarget(divergence);
            renderer.render(scene, camera);

            // 5. Poisson Solve (圧力)
            for (let i = 0; i < liquidParams.iterations; i++) {
                poissonMaterial.uniforms.tPressure.value = pressure.texture;
                poissonMaterial.uniforms.tDivergence.value = divergence.texture;
                quad.material = poissonMaterial;
                renderer.setRenderTarget(pressure);
                renderer.render(scene, camera);
            }

            // 6. Gradient Subtract
            gradientMaterial.uniforms.tPressure.value = pressure.texture;
            gradientMaterial.uniforms.tVelocity.value = velRead.texture;
            quad.material = gradientMaterial;
            renderer.setRenderTarget(velWrite);
            renderer.render(scene, camera);
            [velRead, velWrite] = swap(velRead, velWrite);

            renderer.setRenderTarget(null);
        },

        render(target) {
            renderMaterial.uniforms.tDensity.value = denRead.texture;
            quad.material = renderMaterial;
            renderer.setRenderTarget(target);
            renderer.render(scene, camera);
            renderer.setRenderTarget(null);
        },

        setTime(t) {
            renderMaterial.uniforms.uTime.value = t;
        },

        getDensityTexture() {
            return denRead.texture;
        },

        getVelocityTexture() {
            return velRead.texture;
        },

        dispose() {
            velocityA.dispose();
            velocityB.dispose();
            densityA.dispose();
            densityB.dispose();
            pressure.dispose();
            divergence.dispose();
            geometry.dispose();
            advectionMaterial.dispose();
            divergenceMaterial.dispose();
            poissonMaterial.dispose();
            gradientMaterial.dispose();
            forceMaterial.dispose();
            splatMaterial.dispose();
            renderMaterial.dispose();
        }
    };
}
