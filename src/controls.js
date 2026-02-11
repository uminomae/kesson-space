// controls.js — カメラ制御

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toggles, breathConfig } from './config.js';

let _camera;
let _controls;

export function initControls(camera, container, renderer) {
    _camera = camera;

    _controls = new OrbitControls(camera, renderer.domElement);
    _controls.target.set(0, -1, -10);

    _controls.enableDamping = true;
    _controls.dampingFactor = 0.04;

    _controls.minDistance = 10;
    _controls.maxDistance = 80;

    _controls.minPolarAngle = Math.PI * 0.15;
    _controls.maxPolarAngle = Math.PI * 0.75;

    _controls.rotateSpeed = 0.4;
    _controls.zoomSpeed = 0.6;

    _controls.enablePan = true;
    _controls.panSpeed = 0.3;

    _controls.autoRotate = true;
    _controls.autoRotateSpeed = 1.0;

    let autoRotateTimeout;
    const resumeAutoRotate = () => {
        clearTimeout(autoRotateTimeout);
        _controls.autoRotate = false;
        autoRotateTimeout = setTimeout(() => {
            if (toggles.autoRotate) {
                _controls.autoRotate = true;
            }
        }, 8000);
    };

    renderer.domElement.addEventListener('pointerdown', resumeAutoRotate);
    renderer.domElement.addEventListener('wheel', resumeAutoRotate, { passive: true });
    renderer.domElement.addEventListener('touchstart', resumeAutoRotate, { passive: true });
}

export function setAutoRotateSpeed(speed) {
    if (_controls) _controls.autoRotateSpeed = speed;
}

export function setCameraPosition(x, y, z) {
    if (_camera) _camera.position.set(x, y, z);
}

export function setTarget(x, y, z) {
    if (_controls) _controls.target.set(x, y, z);
}

export function updateControls(time, breathVal = 0.5) {
    if (!_camera || !_controls) return;

    // --- FOV呼吸（熱波）: breathValと同期 ---
    if (toggles.fovBreath) {
        _camera.fov = breathConfig.fovBase + (breathVal * 2 - 1) * breathConfig.fovAmplitude;
    } else {
        _camera.fov = breathConfig.fovBase;
    }
    _camera.updateProjectionMatrix();

    // --- 自動回転 ---
    if (!toggles.autoRotate) {
        _controls.autoRotate = false;
    }

    _controls.update();
}
