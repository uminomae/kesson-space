// quantum-field.js — 量子場リキッド Raymarching SDF シーン

import * as THREE from 'three';
import { quantumFieldParams } from '../config.js';
import { quantumFieldVertexShader, quantumFieldFragmentShader } from './quantum-field.glsl.js';

export function createQuantumFieldMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime:       { value: 0.0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uSpeed:      { value: quantumFieldParams.speed },
            uIntensity:  { value: quantumFieldParams.intensity },
            uNoiseScale: { value: quantumFieldParams.noiseScale },
            uNoiseAmp:   { value: quantumFieldParams.noiseAmp },
            uBlobCount:  { value: quantumFieldParams.blobCount },
            uSmoothK:    { value: quantumFieldParams.smoothK },
            uSubsurface: { value: quantumFieldParams.subsurface },
            uColorR:     { value: quantumFieldParams.colorR },
            uColorG:     { value: quantumFieldParams.colorG },
            uColorB:     { value: quantumFieldParams.colorB },
            uGlowR:      { value: quantumFieldParams.glowR },
            uGlowG:      { value: quantumFieldParams.glowG },
            uGlowB:      { value: quantumFieldParams.glowB },
            uOpacity:    { value: quantumFieldParams.opacity },
        },
        vertexShader: quantumFieldVertexShader,
        fragmentShader: quantumFieldFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
}

export function createQuantumFieldMesh(material) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(
        quantumFieldParams.posX,
        quantumFieldParams.posY,
        quantumFieldParams.posZ
    );
    mesh.scale.set(quantumFieldParams.size, quantumFieldParams.size, 1);
    return mesh;
}
