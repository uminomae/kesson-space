import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gemOrbFragmentShader, gemOrbVertexShader } from '../shaders/gem-orb.glsl.js';

function createGemOrbMaterial(gemParams) {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime:                 { value: 0.0 },
            uGlowStrength:         { value: gemParams.glowStrength },
            uRimPower:             { value: gemParams.rimPower },
            uInnerGlow:            { value: gemParams.innerGlow },
            uHover:                { value: 0.0 },
            uTurbulence:           { value: gemParams.turbulence },
            uHaloWidth:            { value: gemParams.haloWidth },
            uHaloIntensity:        { value: gemParams.haloIntensity },
            uChromaticAberration:  { value: gemParams.chromaticAberration },
        },
        vertexShader: gemOrbVertexShader,
        fragmentShader: gemOrbFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
}

export function createGemGroupModel(gemParams, onGemMeshReady) {
    const group = new THREE.Group();
    group.position.set(gemParams.posX, gemParams.posY, gemParams.posZ);

    const hitMat = new THREE.SpriteMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
    });
    const hitSprite = new THREE.Sprite(hitMat);
    const hitSize = gemParams.meshScale * 3.0;
    hitSprite.scale.set(hitSize, hitSize, 1);
    group.add(hitSprite);

    group.userData = {
        hitSprite,
        gemMesh: null,
    };

    const loader = new GLTFLoader();
    loader.load(
        'assets/blender/gemini-logo.glb',
        (gltf) => {
            const loadedMesh = gltf.scene.children[0];
            if (!loadedMesh) return;

            if (loadedMesh.geometry) {
                loadedMesh.geometry.computeVertexNormals();
            }

            loadedMesh.material = createGemOrbMaterial(gemParams);
            loadedMesh.scale.setScalar(gemParams.meshScale);
            loadedMesh.renderOrder = 10;
            loadedMesh.rotation.x = Math.PI / 2;

            group.add(loadedMesh);
            group.userData.gemMesh = loadedMesh;
            if (onGemMeshReady) onGemMeshReady(loadedMesh);

            console.log('[Gem] GLTF loaded:', loadedMesh.geometry.attributes.position.count, 'vertices');
        },
        undefined,
        (err) => {
            console.warn('[Gem] GLTF load failed, using fallback sphere:', err.message);
            const fallbackGeom = new THREE.IcosahedronGeometry(1.0, 2);
            const fallback = new THREE.Mesh(fallbackGeom, createGemOrbMaterial(gemParams));
            fallback.scale.setScalar(gemParams.meshScale);
            fallback.renderOrder = 10;
            group.add(fallback);
            group.userData.gemMesh = fallback;
            if (onGemMeshReady) onGemMeshReady(fallback);
        }
    );

    return group;
}

export function rebuildGemState({ gemMesh, gemGroup, gemParams }) {
    if (!gemMesh) return;
    gemMesh.scale.setScalar(gemParams.meshScale);
    const u = gemMesh.material.uniforms;
    if (u.uGlowStrength)        u.uGlowStrength.value = gemParams.glowStrength;
    if (u.uRimPower)            u.uRimPower.value = gemParams.rimPower;
    if (u.uInnerGlow)           u.uInnerGlow.value = gemParams.innerGlow;
    if (u.uTurbulence)          u.uTurbulence.value = gemParams.turbulence;
    if (u.uHaloWidth)           u.uHaloWidth.value = gemParams.haloWidth;
    if (u.uHaloIntensity)       u.uHaloIntensity.value = gemParams.haloIntensity;
    if (u.uChromaticAberration) u.uChromaticAberration.value = gemParams.chromaticAberration;
    if (gemGroup) {
        const hit = gemGroup.userData.hitSprite;
        if (hit) {
            const s = gemParams.meshScale * 3.0;
            hit.scale.set(s, s, 1);
        }
    }
}

export function updateGemGroupPosition({ gemGroup, gemParams }) {
    if (!gemGroup) return;
    gemGroup.userData.baseY = gemParams.posY;
    gemGroup.position.set(gemParams.posX, gemParams.posY, gemParams.posZ);
}

export function updateGemGroupAnimation(group, time) {
    const data = group.userData;
    group.position.y = data.baseY + Math.sin(time * 0.6 + 2.0) * 0.4;

    const mesh = data.gemMesh;
    if (!mesh) return;

    mesh.rotation.x = Math.PI / 2 + Math.sin(time * 0.3) * 0.1;
    mesh.rotation.z = time * 0.25;

    const u = mesh.material.uniforms;
    if (u.uTime) u.uTime.value = time;
}
