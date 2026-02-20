import * as THREE from 'three';
import { consciousnessSdfFragmentShader, consciousnessSdfVertexShader } from './sdf-consciousness-shader.js';
import { consciousnessParams } from '../config.js';

const OVERLAY_DISTANCE = 6.0;
const COVERAGE_SCALE = 1.06;
const MOBILE_STEP_LIMIT = 48;
const DESKTOP_STEP_LIMIT = 74;

function detectStepLimit() {
    const shortEdge = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    return shortEdge > 0 && shortEdge < 900 ? MOBILE_STEP_LIMIT : DESKTOP_STEP_LIMIT;
}

export function createSdfConsciousnessEntity(scene, camera, { enabled = true } = {}) {
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const uniforms = {
        uTime: { value: 0 },
        uBreath: { value: 0.5 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMaxSteps: { value: detectStepLimit() },
        uFar: { value: 12.0 },
        uDetail: { value: 0.0045 },
        uCsFlowSpeed: { value: consciousnessParams.csFlowSpeed },
        uCsFreqLow: { value: consciousnessParams.csFreqLow },
        uCsFreqHigh: { value: consciousnessParams.csFreqHigh },
        uCsThicknessLow: { value: consciousnessParams.csThicknessLow },
        uCsThicknessHigh: { value: consciousnessParams.csThicknessHigh },
        uCsEnvelopeRadius: { value: consciousnessParams.csEnvelopeRadius },
        uCsDensityGain: { value: consciousnessParams.csDensityGain },
        uCsStepNear: { value: consciousnessParams.csStepNear },
        uCsStepFar: { value: consciousnessParams.csStepFar },
        uCsGateTint: { value: consciousnessParams.csGateTint },
        uCsVignette: { value: consciousnessParams.csVignette },
        uCsMouseParallax: { value: consciousnessParams.csMouseParallax },
        uCsLightBoost: { value: consciousnessParams.csLightBoost },
        uCsPreGamma: { value: consciousnessParams.csPreGamma },
        uCsExposure: { value: consciousnessParams.csExposure },
        uCsCoolR: { value: consciousnessParams.csCoolR },
        uCsCoolG: { value: consciousnessParams.csCoolG },
        uCsCoolB: { value: consciousnessParams.csCoolB },
        uCsWarmR: { value: consciousnessParams.csWarmR },
        uCsWarmG: { value: consciousnessParams.csWarmG },
        uCsWarmB: { value: consciousnessParams.csWarmB },
        uCsGateR: { value: consciousnessParams.csGateR },
        uCsGateG: { value: consciousnessParams.csGateG },
        uCsGateB: { value: consciousnessParams.csGateB },
    };

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: consciousnessSdfVertexShader,
        fragmentShader: consciousnessSdfFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,
        side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.renderOrder = 1000;
    mesh.frustumCulled = false;
    mesh.visible = enabled;

    scene.add(mesh);

    return {
        mesh,
        uniforms,
        material,
        camera,
        _forward: new THREE.Vector3(),
        _right: new THREE.Vector3(),
        _up: new THREE.Vector3(),
        _position: new THREE.Vector3(),
    };
}

export function updateSdfConsciousnessEntity(entity, {
    time,
    breath,
    mouse,
    camera,
    enabled,
}) {
    if (!entity) return;

    const nextVisible = enabled !== false;
    entity.mesh.visible = nextVisible;
    if (!nextVisible) return;

    const viewCamera = camera || entity.camera;
    if (viewCamera) {
        entity.mesh.quaternion.copy(viewCamera.quaternion);
    }

    const clampedMouseX = THREE.MathUtils.clamp(mouse?.x ?? 0.5, 0, 1);
    const clampedMouseY = THREE.MathUtils.clamp(mouse?.y ?? 0.5, 0, 1);

    entity.uniforms.uTime.value = time;
    entity.uniforms.uBreath.value = THREE.MathUtils.clamp(breath, 0, 1);
    entity.uniforms.uMouse.value.set(clampedMouseX, clampedMouseY);
    entity.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    entity.uniforms.uMaxSteps.value = detectStepLimit();
    entity.uniforms.uCsFlowSpeed.value = consciousnessParams.csFlowSpeed;
    entity.uniforms.uCsFreqLow.value = consciousnessParams.csFreqLow;
    entity.uniforms.uCsFreqHigh.value = consciousnessParams.csFreqHigh;
    entity.uniforms.uCsThicknessLow.value = consciousnessParams.csThicknessLow;
    entity.uniforms.uCsThicknessHigh.value = consciousnessParams.csThicknessHigh;
    entity.uniforms.uCsEnvelopeRadius.value = consciousnessParams.csEnvelopeRadius;
    entity.uniforms.uCsDensityGain.value = consciousnessParams.csDensityGain;
    entity.uniforms.uCsStepNear.value = consciousnessParams.csStepNear;
    entity.uniforms.uCsStepFar.value = consciousnessParams.csStepFar;
    entity.uniforms.uCsGateTint.value = consciousnessParams.csGateTint;
    entity.uniforms.uCsVignette.value = consciousnessParams.csVignette;
    entity.uniforms.uCsMouseParallax.value = consciousnessParams.csMouseParallax;
    entity.uniforms.uCsLightBoost.value = consciousnessParams.csLightBoost;
    entity.uniforms.uCsPreGamma.value = consciousnessParams.csPreGamma;
    entity.uniforms.uCsExposure.value = consciousnessParams.csExposure;
    entity.uniforms.uCsCoolR.value = consciousnessParams.csCoolR;
    entity.uniforms.uCsCoolG.value = consciousnessParams.csCoolG;
    entity.uniforms.uCsCoolB.value = consciousnessParams.csCoolB;
    entity.uniforms.uCsWarmR.value = consciousnessParams.csWarmR;
    entity.uniforms.uCsWarmG.value = consciousnessParams.csWarmG;
    entity.uniforms.uCsWarmB.value = consciousnessParams.csWarmB;
    entity.uniforms.uCsGateR.value = consciousnessParams.csGateR;
    entity.uniforms.uCsGateG.value = consciousnessParams.csGateG;
    entity.uniforms.uCsGateB.value = consciousnessParams.csGateB;

    const activeCamera = viewCamera && viewCamera.isPerspectiveCamera ? viewCamera : null;
    if (!activeCamera) return;

    const aspect = Math.max((window.innerWidth || 1) / Math.max(window.innerHeight || 1, 1), 0.0001);
    const fovRad = THREE.MathUtils.degToRad(activeCamera.fov || 50);
    const viewportHeight = 2 * Math.tan(fovRad * 0.5) * OVERLAY_DISTANCE;
    const viewportWidth = viewportHeight * aspect;
    const breathScale = 0.995 + THREE.MathUtils.clamp(breath, 0, 1) * 0.02;

    entity._forward.set(0, 0, -1).applyQuaternion(activeCamera.quaternion).normalize();
    entity._right.set(1, 0, 0).applyQuaternion(activeCamera.quaternion).normalize();
    entity._up.set(0, 1, 0).applyQuaternion(activeCamera.quaternion).normalize();

    const cursorOffsetX = (clampedMouseX - 0.5) * viewportWidth * 0.06;
    const cursorOffsetY = (clampedMouseY - 0.5) * viewportHeight * 0.06;

    entity._position.copy(activeCamera.position).addScaledVector(entity._forward, OVERLAY_DISTANCE);
    entity._position.addScaledVector(entity._right, cursorOffsetX);
    entity._position.addScaledVector(entity._up, -cursorOffsetY);

    entity.mesh.position.copy(entity._position);
    entity.mesh.scale.set(
        viewportWidth * COVERAGE_SCALE * breathScale,
        viewportHeight * COVERAGE_SCALE * breathScale,
        1
    );
}

export function disposeSdfConsciousnessEntity(scene, entity) {
    if (!entity) return;
    if (scene && entity.mesh) scene.remove(entity.mesh);
    entity.mesh?.geometry?.dispose();
    entity.material?.dispose();
}
