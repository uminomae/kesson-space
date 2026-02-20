import * as THREE from 'three';

const OVERLAY_DISTANCE = 5.95;
const COVERAGE_SCALE = 1.08;

const DEFAULT_OVERLAY_PARAMS = Object.freeze({
    enabled: true,
    gateOffsetX: -0.78,
    gateOffsetY: 0.01,
    gateCoreStrength: 0.011,
    gateAuraStrength: 0.078,
    gateHeight: 0.95,
    gateStretch: 1.0,
    gatePulse: 0.18,
    rayBrightness: 1.32,
    rayDensity: 1.0,
    raySpeed: 8.8,
    raySpread: 0.96,
    rayTaper: 0.82,
    rayAngle: -0.26,
    fadeNear: 0.0,
    fadeFar: 3.35,
    globalOpacity: 0.84,
});

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _position = new THREE.Vector3();

const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uGateOffset;
uniform float uGateCoreStrength;
uniform float uGateAuraStrength;
uniform float uGateHeight;
uniform float uGateStretch;
uniform float uGatePulse;
uniform float uRayBrightness;
uniform float uRayDensity;
uniform float uRaySpeed;
uniform float uRaySpread;
uniform float uRayTaper;
uniform float uRayAngle;
uniform float uFadeNear;
uniform float uFadeFar;
uniform float uGlobalOpacity;

float hash1(float n) {
    return fract(sin(n) * 43758.5453123);
}

mat2 rot2(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float aspect = max(uResolution.x / max(uResolution.y, 1.0), 0.0001);
    uv.x *= aspect;

    vec2 p = uv - vec2(uGateOffset.x * aspect, uGateOffset.y);
    float gatePulse = 1.0 + sin(uTime * 0.47) * uGatePulse;

    float gateCore = uGateCoreStrength / (abs(p.x) + 0.0022);
    gateCore *= smoothstep(uGateHeight, 0.0, abs(p.y));
    gateCore *= gatePulse;

    vec2 auraP = vec2(p.x * uGateStretch, p.y * 0.52);
    float auraDist = length(auraP);
    float gateAura = uGateAuraStrength / (auraDist + 0.028);
    gateAura *= smoothstep(1.5, 0.0, auraDist);
    gateAura *= (0.88 + 0.12 * sin(uTime * 0.22 + p.y * 8.0));

    vec3 gateColor = vec3(0.75, 0.9, 1.0) * gateCore;
    gateColor += vec3(0.08, 0.31, 0.9) * gateAura;

    vec3 rayColor = vec3(0.0);
    vec2 rayP = p;
    rayP *= rot2(uRayAngle);

    if (rayP.x > 0.0) {
        float rays = 0.0;
        for (int i = 0; i < 12; i++) {
            float fi = float(i) + 1.0;
            float laneHash = hash1(fi * 13.71);
            float speedHash = hash1(fi * 41.23);
            float waveHash = hash1(fi * 7.19);

            float lane = (laneHash - 0.5) * uRaySpread;
            float y = rayP.y - lane;

            float width = mix(0.0045, 0.0017, waveHash) * mix(1.0, 0.62, uRayTaper);
            float line = width / (abs(y) + width);

            float speed = uTime * (uRaySpeed * (0.72 + speedHash * 0.84));
            float wave = fract(rayP.x * (1.15 + waveHash * 2.2) - speed);

            float arrowHead = smoothstep(0.0, 0.06, wave) * smoothstep(0.87, 0.45, wave);
            float arrowTail = smoothstep(0.2, 0.92, wave) * smoothstep(0.98, 0.5, wave) * 0.44;

            float nearFade = smoothstep(uFadeNear, uFadeNear + 0.26, rayP.x);
            float farFade = 1.0 - smoothstep(uFadeFar * 0.72, uFadeFar, rayP.x);
            float fade = nearFade * max(farFade, 0.0);

            float sparkle = 0.86 + 0.34 * sin(uTime * (4.8 + laneHash * 2.1) + fi * 1.41);
            rays += line * (arrowHead + arrowTail) * fade * sparkle;
        }

        rays *= uRayBrightness * uRayDensity;
        rayColor += vec3(1.0, 0.72, 0.12) * rays;
        rayColor += vec3(1.0, 0.92, 0.84) * (rays * rays * 0.42);
    }

    vec3 finalColor = gateColor + rayColor;
    float alpha = max(max(finalColor.r, finalColor.g), finalColor.b) * uGlobalOpacity;

    if (alpha < 0.008) discard;
    gl_FragColor = vec4(finalColor, min(alpha, 1.0));
}
`;

function cloneDefaults() {
    return { ...DEFAULT_OVERLAY_PARAMS };
}

function clampNumber(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function normalizeParams(source = {}) {
    const base = cloneDefaults();
    return {
        enabled: source.enabled === false ? false : base.enabled,
        gateOffsetX: clampNumber(source.gateOffsetX, base.gateOffsetX, -2.2, 1.2),
        gateOffsetY: clampNumber(source.gateOffsetY, base.gateOffsetY, -1.4, 1.4),
        gateCoreStrength: clampNumber(source.gateCoreStrength, base.gateCoreStrength, 0.001, 0.06),
        gateAuraStrength: clampNumber(source.gateAuraStrength, base.gateAuraStrength, 0.001, 0.3),
        gateHeight: clampNumber(source.gateHeight, base.gateHeight, 0.1, 1.8),
        gateStretch: clampNumber(source.gateStretch, base.gateStretch, 0.4, 3.0),
        gatePulse: clampNumber(source.gatePulse, base.gatePulse, 0.0, 1.2),
        rayBrightness: clampNumber(source.rayBrightness, base.rayBrightness, 0.1, 5.0),
        rayDensity: clampNumber(source.rayDensity, base.rayDensity, 0.05, 3.0),
        raySpeed: clampNumber(source.raySpeed, base.raySpeed, 0.2, 24.0),
        raySpread: clampNumber(source.raySpread, base.raySpread, 0.1, 2.8),
        rayTaper: clampNumber(source.rayTaper, base.rayTaper, 0.0, 1.0),
        rayAngle: clampNumber(source.rayAngle, base.rayAngle, -1.2, 1.2),
        fadeNear: clampNumber(source.fadeNear, base.fadeNear, -0.6, 1.2),
        fadeFar: clampNumber(source.fadeFar, base.fadeFar, 0.5, 6.0),
        globalOpacity: clampNumber(source.globalOpacity, base.globalOpacity, 0.05, 1.0),
    };
}

function updateUniforms(entity) {
    const { uniforms } = entity.material;
    const p = entity.params;

    uniforms.uGateOffset.value.set(p.gateOffsetX, p.gateOffsetY);
    uniforms.uGateCoreStrength.value = p.gateCoreStrength;
    uniforms.uGateAuraStrength.value = p.gateAuraStrength;
    uniforms.uGateHeight.value = p.gateHeight;
    uniforms.uGateStretch.value = p.gateStretch;
    uniforms.uGatePulse.value = p.gatePulse;
    uniforms.uRayBrightness.value = p.rayBrightness;
    uniforms.uRayDensity.value = p.rayDensity;
    uniforms.uRaySpeed.value = p.raySpeed;
    uniforms.uRaySpread.value = p.raySpread;
    uniforms.uRayTaper.value = p.rayTaper;
    uniforms.uRayAngle.value = p.rayAngle;
    uniforms.uFadeNear.value = p.fadeNear;
    uniforms.uFadeFar.value = p.fadeFar;
    uniforms.uGlobalOpacity.value = p.globalOpacity;
}

export function createConsciousGateRaysOverlay(scene, camera, options = {}) {
    const params = normalizeParams(options.params || {});
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uGateOffset: { value: new THREE.Vector2(params.gateOffsetX, params.gateOffsetY) },
            uGateCoreStrength: { value: params.gateCoreStrength },
            uGateAuraStrength: { value: params.gateAuraStrength },
            uGateHeight: { value: params.gateHeight },
            uGateStretch: { value: params.gateStretch },
            uGatePulse: { value: params.gatePulse },
            uRayBrightness: { value: params.rayBrightness },
            uRayDensity: { value: params.rayDensity },
            uRaySpeed: { value: params.raySpeed },
            uRaySpread: { value: params.raySpread },
            uRayTaper: { value: params.rayTaper },
            uRayAngle: { value: params.rayAngle },
            uFadeNear: { value: params.fadeNear },
            uFadeFar: { value: params.fadeFar },
            uGlobalOpacity: { value: params.globalOpacity },
        },
        vertexShader,
        fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'conscious-gate-rays-overlay';
    mesh.renderOrder = 1300;
    mesh.frustumCulled = false;
    mesh.visible = params.enabled;

    scene.add(mesh);

    return {
        mesh,
        material,
        geometry,
        camera,
        params,
    };
}

export function updateConsciousGateRaysOverlay(entity, { time = 0, camera = null } = {}) {
    if (!entity) return;
    const activeCamera = camera || entity.camera;
    if (!activeCamera || !activeCamera.isPerspectiveCamera) return;

    const p = entity.params;
    entity.mesh.visible = p.enabled !== false;
    if (!entity.mesh.visible) return;

    entity.material.uniforms.uTime.value = time;
    entity.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    updateUniforms(entity);

    const aspect = Math.max((window.innerWidth || 1) / Math.max(window.innerHeight || 1, 1), 0.0001);
    const fovRad = THREE.MathUtils.degToRad(activeCamera.fov || 50);
    const viewportHeight = 2 * Math.tan(fovRad * 0.5) * OVERLAY_DISTANCE;
    const viewportWidth = viewportHeight * aspect;

    _forward.set(0, 0, -1).applyQuaternion(activeCamera.quaternion).normalize();
    _right.set(1, 0, 0).applyQuaternion(activeCamera.quaternion).normalize();
    _up.set(0, 1, 0).applyQuaternion(activeCamera.quaternion).normalize();

    _position.copy(activeCamera.position).addScaledVector(_forward, OVERLAY_DISTANCE);
    entity.mesh.position.copy(_position);
    entity.mesh.quaternion.copy(activeCamera.quaternion);
    entity.mesh.scale.set(viewportWidth * COVERAGE_SCALE, viewportHeight * COVERAGE_SCALE, 1);
}

export function initConsciousGateRaysConsole(entity) {
    if (typeof window === 'undefined' || !entity) return;

    const api = {
        get() {
            return { ...entity.params };
        },
        set(partial = {}) {
            entity.params = normalizeParams({
                ...entity.params,
                ...partial,
            });
            updateUniforms(entity);
            return this.get();
        },
        reset() {
            entity.params = cloneDefaults();
            updateUniforms(entity);
            return this.get();
        },
        applyPreset(preset = {}) {
            return this.set(preset);
        },
        help() {
            return [
                'kessonConsciousOverlay.get()',
                'kessonConsciousOverlay.set({ raySpeed: 10.5, rayBrightness: 1.8, gateOffsetX: -0.7 })',
                'kessonConsciousOverlay.applyPreset({ globalOpacity: 0.95, rayDensity: 1.2 })',
                'kessonConsciousOverlay.reset()',
            ];
        },
    };

    window.kessonConsciousOverlay = api;
}

export function disposeConsciousGateRaysOverlay(scene, entity) {
    if (!entity) return;
    if (scene && entity.mesh) scene.remove(entity.mesh);
    entity.geometry?.dispose?.();
    entity.material?.dispose?.();
}

