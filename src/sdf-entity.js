import * as THREE from 'three';
import { sdfEntityParams } from './config.js';
import { sdfEntityVert, sdfEntityFrag } from './shaders/sdf-entity.glsl.js';

export function createSdfEntity() {
    const geometry = new THREE.PlaneGeometry(sdfEntityParams.planeSize, sdfEntityParams.planeSize);
    const material = new THREE.ShaderMaterial({
        vertexShader: sdfEntityVert,
        fragmentShader: sdfEntityFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
            uTime: { value: 0 },
            uBreath: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uResolution: {
                value: new THREE.Vector2(
                    typeof window !== 'undefined' ? window.innerWidth : 512,
                    typeof window !== 'undefined' ? window.innerHeight : 512
                ),
            },
        },
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 5;
    mesh.position.set(sdfEntityParams.posX, sdfEntityParams.posY, sdfEntityParams.posZ);
    mesh.userData.isSdfEntity = true;

    return { mesh, material };
}

export function updateSdfEntity(material, time, breathVal, mouse) {
    if (!material || !material.uniforms) return;

    // Existing breathValue is 0..1, but shader expects -1..1 for symmetric pulsation.
    const normalizedBreath = breathVal >= 0 && breathVal <= 1
        ? breathVal * 2 - 1
        : Math.max(-1, Math.min(1, breathVal || 0));

    material.uniforms.uTime.value = time;
    material.uniforms.uBreath.value = normalizedBreath;
    material.uniforms.uMouse.value.set(mouse?.smoothX || 0, mouse?.smoothY || 0);
    if (typeof window !== 'undefined') {
        material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }
}
