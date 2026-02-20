import * as THREE from 'three';

const ARROW_COUNT = 24;
const BUNDLE_RADIUS = 0.85;
const BUNDLE_DEPTH = 1.8;
const SHAFT_LENGTH = 0.95;
const SHAFT_RADIUS = 0.014;
const HEAD_LENGTH = 0.24;
const HEAD_RADIUS = 0.05;

const BASE_POS_X = -8.5;
const BASE_POS_Y = 4.3;
const BASE_POS_Z = -7.2;
const BASE_ROT_X = -0.08;
const BASE_ROT_Y = 0.38;
const BASE_SCALE = 1.0;
const BASE_OPACITY = 0.52;

const _dummy = new THREE.Object3D();
const _euler = new THREE.Euler();

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

    const material = new THREE.MeshBasicMaterial({
        color: 0x88dcff,
        transparent: true,
        opacity: BASE_OPACITY,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });

    const shafts = new THREE.InstancedMesh(shaftGeometry, material, ARROW_COUNT);
    const heads = new THREE.InstancedMesh(headGeometry, material, ARROW_COUNT);
    shafts.name = 'conscious-arrow-bundle-shafts';
    heads.name = 'conscious-arrow-bundle-heads';
    shafts.renderOrder = 1;
    heads.renderOrder = 1;

    const rand = mulberry32(103);
    for (let i = 0; i < ARROW_COUNT; i++) {
        const r = Math.sqrt(rand()) * BUNDLE_RADIUS;
        const theta = rand() * Math.PI * 2;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r * 0.45;
        const z = (rand() - 0.5) * BUNDLE_DEPTH;

        const pitch = (rand() - 0.5) * 0.46;
        const yaw = (rand() - 0.5) * 0.44;
        const roll = (rand() - 0.5) * 0.12;
        _euler.set(pitch, yaw, roll, 'YXZ');

        _dummy.position.set(x, y, z);
        _dummy.quaternion.setFromEuler(_euler);
        _dummy.scale.setScalar(0.85 + (rand() * 0.3));
        _dummy.updateMatrix();

        shafts.setMatrixAt(i, _dummy.matrix);
        heads.setMatrixAt(i, _dummy.matrix);
    }
    shafts.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;

    group.add(shafts, heads);
    group.position.set(BASE_POS_X, BASE_POS_Y, BASE_POS_Z);
    group.rotation.set(BASE_ROT_X, BASE_ROT_Y, 0);
    group.scale.setScalar(BASE_SCALE);
    group.userData.material = material;
    group.userData.baseOpacity = BASE_OPACITY;
    group.userData.baseRotX = BASE_ROT_X;
    group.userData.baseRotY = BASE_ROT_Y;
    group.userData.baseScale = BASE_SCALE;

    return group;
}

export function updateConsciousArrowBundle(group, time) {
    if (!group) return;
    const data = group.userData || {};
    const baseRotX = Number.isFinite(data.baseRotX) ? data.baseRotX : BASE_ROT_X;
    const baseRotY = Number.isFinite(data.baseRotY) ? data.baseRotY : BASE_ROT_Y;
    const baseScale = Number.isFinite(data.baseScale) ? data.baseScale : BASE_SCALE;

    group.rotation.x = baseRotX + Math.cos(time * 0.11) * 0.05;
    group.rotation.y = baseRotY + Math.sin(time * 0.13) * 0.18;
    group.rotation.z = Math.sin(time * 0.09) * 0.03;

    const pulse = 1.0 + Math.sin(time * 0.39) * 0.045;
    group.scale.setScalar(baseScale * pulse);

    const material = data.material;
    if (material) {
        const baseOpacity = Number.isFinite(data.baseOpacity) ? data.baseOpacity : BASE_OPACITY;
        material.opacity = baseOpacity + Math.sin(time * 0.77) * 0.06;
    }
}
