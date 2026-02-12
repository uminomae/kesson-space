// controls.js — カメラ制御

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toggles, breathConfig } from './config.js';

let _camera;
let _controls;

// デスクトップ基準アスペクト比（16:9）
const REF_ASPECT = 16 / 9;

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

/**
 * アスペクト比に応じたFOV補正
 * portrait（縦持ち）時: デスクトップの水平画角を維持するようFOVを拡大
 */
function getAdjustedFovBase() {
    const base = breathConfig.fovBase;
    const aspect = _camera.aspect;
    if (aspect >= 1) return base; // landscape: そのまま

    // デスクトップ基準の水平FOVを算出
    const baseRad = base * Math.PI / 180;
    const hFov = 2 * Math.atan(Math.tan(baseRad / 2) * REF_ASPECT);
    // 現在のアスペクト比で水平FOVを維持する垂直FOV
    const adjusted = 2 * Math.atan(Math.tan(hFov / 2) / aspect) * 180 / Math.PI;
    return Math.min(adjusted, 120); // 歪み防止の上限
}

export function updateControls(time, breathVal = 0.5) {
    if (!_camera || !_controls) return;

    const fovBase = getAdjustedFovBase();

    // --- FOV呼吸（熱波）: breathValと同期 ---
    if (toggles.fovBreath) {
        _camera.fov = fovBase + (breathVal * 2 - 1) * breathConfig.fovAmplitude;
    } else {
        _camera.fov = fovBase;
    }
    _camera.updateProjectionMatrix();

    // --- 自動回転 ---
    if (!toggles.autoRotate) {
        _controls.autoRotate = false;
    }

    _controls.update();
}
