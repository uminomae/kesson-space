import * as THREE from 'three';

const ORB_3D_RADIUS = 2.0;
const FOCUSED_ORB_STRENGTH_BOOST = 0.35;
const FOCUSED_ORB_STRENGTH_MAX = 1.35;

const _orbCenter = new THREE.Vector3();
const _orbEdge = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _centerNDC = new THREE.Vector3();
const _edgeNDC = new THREE.Vector3();

export function computeOrbScreenData(navMeshes, camera, focusedOrbIndex) {
    const data = [];
    navMeshes.forEach((group) => {
        if (group.userData.isGem || group.userData.isXLogo) return;

        if (group.userData.core) {
            group.userData.core.getWorldPosition(_orbCenter);
        } else {
            group.getWorldPosition(_orbCenter);
        }
        camera.getWorldDirection(_camRight);
        _camRight.cross(camera.up).normalize();
        _orbEdge.copy(_orbCenter).addScaledVector(_camRight, ORB_3D_RADIUS);

        _centerNDC.copy(_orbCenter).project(camera);
        _edgeNDC.copy(_orbEdge).project(camera);

        const cx = (_centerNDC.x * 0.5) + 0.5;
        const cy = (_centerNDC.y * 0.5) + 0.5;
        const ex = (_edgeNDC.x * 0.5) + 0.5;
        const ey = (_edgeNDC.y * 0.5) + 0.5;
        const dx = (ex - cx) * (window.innerWidth / window.innerHeight);
        const dy = ey - cy;
        const screenRadius = Math.sqrt(dx * dx + dy * dy);
        let strength = 1.0;
        if (_centerNDC.z > 1.0) strength = 0.0;
        if (strength > 0 && group.userData.index === focusedOrbIndex) {
            strength = Math.min(FOCUSED_ORB_STRENGTH_MAX, strength + FOCUSED_ORB_STRENGTH_BOOST);
        }
        data.push({ x: cx, y: cy, strength, radius: screenRadius });
    });
    return data;
}
