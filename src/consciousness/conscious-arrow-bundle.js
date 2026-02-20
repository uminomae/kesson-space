import * as THREE from 'three';

const ARROW_COUNT = 24;
const BUNDLE_RADIUS_MIN = 0.22;
const BUNDLE_RADIUS_MAX = 1.06;
const BUNDLE_DEPTH = 1.55;
const SHAFT_LENGTH = 1.62;
const SHAFT_RADIUS = 0.013;
const HEAD_LENGTH = 0.34;
const HEAD_RADIUS = 0.056;

const BASE_POS_X = -2.8;
const BASE_POS_Y = 3.35;
const BASE_POS_Z = -9.4;
const BASE_ROT_X = 0.06;
const BASE_ROT_Y = 0.23;
const BASE_SCALE = 1.0;
const SHAFT_BASE_OPACITY = 0.34;
const HEAD_BASE_OPACITY = 0.66;
const FOCAL_Z = 4.8;

const _dummy = new THREE.Object3D();
const _euler = new THREE.Euler();
const _baseQuat = new THREE.Quaternion();
const _wobbleQuat = new THREE.Quaternion();
const _finalQuat = new THREE.Quaternion();

function mulberry32(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function createConsciousArrowBundle() {
    const group = new THREE.Group();
    group.name = 'conscious-arrow-bundle';

    const shaftGeometry = new THREE.CylinderGeometry(SHAFT_RADIUS, SHAFT_RADIUS, SHAFT_LENGTH, 8, 1, true);
    shaftGeometry.rotateX(Math.PI / 2);
    shaftGeometry.translate(0, 0, SHAFT_LENGTH * 0.5);

    const headGeometry = new THREE.ConeGeometry(HEAD_RADIUS, HEAD_LENGTH, 8, 1, true);
    headGeometry.rotateX(Math.PI / 2);
    headGeometry.translate(0, 0, SHAFT_LENGTH + (HEAD_LENGTH * 0.5));

    const shaftMaterial = new THREE.MeshBasicMaterial({
        color: 0x7ec8ff,
        transparent: true,
        opacity: SHAFT_BASE_OPACITY,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
    const headMaterial = new THREE.MeshBasicMaterial({
        color: 0xd8f3ff,
        transparent: true,
        opacity: HEAD_BASE_OPACITY,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });

    const shafts = new THREE.InstancedMesh(shaftGeometry, shaftMaterial, ARROW_COUNT);
    const heads = new THREE.InstancedMesh(headGeometry, headMaterial, ARROW_COUNT);
    shafts.name = 'conscious-arrow-bundle-shafts';
    heads.name = 'conscious-arrow-bundle-heads';
    shafts.renderOrder = 1;
    heads.renderOrder = 1;

    const basePos = new Float32Array(ARROW_COUNT * 3);
    const baseQuat = new Float32Array(ARROW_COUNT * 4);
    const instanceScale = new Float32Array(ARROW_COUNT);
    const phase = new Float32Array(ARROW_COUNT);
    const swayAmp = new Float32Array(ARROW_COUNT);
    const yawAmp = new Float32Array(ARROW_COUNT);
    const pitchAmp = new Float32Array(ARROW_COUNT);

    const rand = mulberry32(103);
    for (let i = 0; i < ARROW_COUNT; i++) {
        const rNorm = Math.sqrt(rand());
        const r = BUNDLE_RADIUS_MIN + rNorm * (BUNDLE_RADIUS_MAX - BUNDLE_RADIUS_MIN);
        const theta = rand() * Math.PI * 2;
        const x = Math.cos(theta) * r;
        const y = (rand() - 0.5) * 0.85 + Math.sin(theta) * r * 0.18;
        const z = (rand() - 0.5) * BUNDLE_DEPTH;

        _dummy.position.set(x, y, z);
        _dummy.lookAt(
            (rand() - 0.5) * 0.12,
            (rand() - 0.5) * 0.1,
            FOCAL_Z + (rand() - 0.5) * 0.5
        );

        const roll = (rand() - 0.5) * 0.24;
        _euler.set(0, 0, roll, 'YXZ');
        _wobbleQuat.setFromEuler(_euler);
        _dummy.quaternion.multiply(_wobbleQuat);

        const scale = 0.84 + (rand() * 0.34);
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();

        shafts.setMatrixAt(i, _dummy.matrix);
        heads.setMatrixAt(i, _dummy.matrix);

        const p3 = i * 3;
        const p4 = i * 4;
        basePos[p3] = x;
        basePos[p3 + 1] = y;
        basePos[p3 + 2] = z;
        baseQuat[p4] = _dummy.quaternion.x;
        baseQuat[p4 + 1] = _dummy.quaternion.y;
        baseQuat[p4 + 2] = _dummy.quaternion.z;
        baseQuat[p4 + 3] = _dummy.quaternion.w;
        instanceScale[i] = scale;
        phase[i] = rand() * Math.PI * 2;
        swayAmp[i] = 0.024 + rand() * 0.05;
        yawAmp[i] = 0.055 + rand() * 0.06;
        pitchAmp[i] = 0.038 + rand() * 0.045;
    }

    shafts.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;

    group.add(shafts, heads);
    group.position.set(BASE_POS_X, BASE_POS_Y, BASE_POS_Z);
    group.rotation.set(BASE_ROT_X, BASE_ROT_Y, 0);
    group.scale.setScalar(BASE_SCALE);

    group.userData.shafts = shafts;
    group.userData.heads = heads;
    group.userData.shaftMaterial = shaftMaterial;
    group.userData.headMaterial = headMaterial;
    group.userData.basePos = basePos;
    group.userData.baseQuat = baseQuat;
    group.userData.instanceScale = instanceScale;
    group.userData.phase = phase;
    group.userData.swayAmp = swayAmp;
    group.userData.yawAmp = yawAmp;
    group.userData.pitchAmp = pitchAmp;
    group.userData.shaftBaseOpacity = SHAFT_BASE_OPACITY;
    group.userData.headBaseOpacity = HEAD_BASE_OPACITY;
    group.userData.baseRotX = BASE_ROT_X;
    group.userData.baseRotY = BASE_ROT_Y;
    group.userData.basePosY = BASE_POS_Y;
    group.userData.bundleScale = BASE_SCALE;

    return group;
}

export function updateConsciousArrowBundle(group, time) {
    if (!group) return;
    const data = group.userData;
    if (!data || !data.shafts || !data.heads) return;

    group.rotation.x = data.baseRotX + Math.cos(time * 0.09) * 0.04;
    group.rotation.y = data.baseRotY + Math.sin(time * 0.11) * 0.14;
    group.rotation.z = Math.sin(time * 0.08) * 0.02;
    group.position.y = data.basePosY + Math.sin(time * 0.12) * 0.2;

    const groupPulse = 1.0 + Math.sin(time * 0.37) * 0.055;
    group.scale.setScalar(data.bundleScale * groupPulse);

    const shafts = data.shafts;
    const heads = data.heads;
    const basePos = data.basePos;
    const baseQuat = data.baseQuat;
    const instanceScale = data.instanceScale;
    const phase = data.phase;
    const swayAmp = data.swayAmp;
    const yawAmp = data.yawAmp;
    const pitchAmp = data.pitchAmp;

    for (let i = 0; i < ARROW_COUNT; i++) {
        const p3 = i * 3;
        const p4 = i * 4;
        const phaseNow = phase[i];
        const sway = Math.sin((time * 0.43) + phaseNow) * swayAmp[i];

        _dummy.position.set(
            basePos[p3] + (Math.cos((time * 0.21) + phaseNow) * sway),
            basePos[p3 + 1] + (Math.sin((time * 0.31) + phaseNow) * sway * 0.55),
            basePos[p3 + 2] + (Math.sin((time * 0.19) + phaseNow) * sway * 1.5)
        );

        _baseQuat.set(baseQuat[p4], baseQuat[p4 + 1], baseQuat[p4 + 2], baseQuat[p4 + 3]);
        _euler.set(
            Math.cos((time * 0.25) + phaseNow) * pitchAmp[i],
            Math.sin((time * 0.22) + phaseNow) * yawAmp[i],
            0,
            'YXZ'
        );
        _wobbleQuat.setFromEuler(_euler);
        _finalQuat.copy(_baseQuat).multiply(_wobbleQuat);

        const scalePulse = 1.0 + Math.sin((time * 0.61) + phaseNow) * 0.08;
        _dummy.quaternion.copy(_finalQuat);
        _dummy.scale.setScalar(instanceScale[i] * scalePulse);
        _dummy.updateMatrix();

        shafts.setMatrixAt(i, _dummy.matrix);
        heads.setMatrixAt(i, _dummy.matrix);
    }
    shafts.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;

    const shaftMaterial = data.shaftMaterial;
    const headMaterial = data.headMaterial;
    if (shaftMaterial) {
        shaftMaterial.opacity = data.shaftBaseOpacity + Math.sin(time * 0.73) * 0.05;
    }
    if (headMaterial) {
        headMaterial.opacity = data.headBaseOpacity + Math.sin(time * 0.79) * 0.06;
    }
}
