// controls.js — カメラ制御

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toggles, breathConfig } from './config.js';

let _camera;
let _controls;

// デスクトップ基準: 16:9, 高さ900px
const REF_ASPECT = 16 / 9;
const REF_HEIGHT = 900;

export function initControls(camera, container, renderer) {
    _camera = camera;

    _controls = new OrbitControls(camera, renderer.domElement);
    _controls.target.set(0, -1, -10);

    _controls.enableDamping = true;
    _controls.dampingFactor = 0.04;

    // --- ズーム無効（スクロールをページに渡す） --- // CHANGED
    _controls.enableZoom = false;

    _controls.minPolarAngle = Math.PI * 0.15;
    _controls.maxPolarAngle = Math.PI * 0.75;

    _controls.rotateSpeed = 0.4;

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
 * アスペクト比 + 画面高さに応じたFOV補正
 * - portrait時: デスクトップの水平画角を維持するようFOVを拡大
 * - landscape短時: 高さが低い場合もFOVを少し拡大（上下の切れ防止）
 */
function getAdjustedFovBase() {
    const base = breathConfig.fovBase;
    const aspect = _camera.aspect;
    const height = window.innerHeight;

    let adjusted = base;

    if (aspect < 1) {
        // Portrait: 水平画角を維持
        const baseRad = base * Math.PI / 180;
        const hFov = 2 * Math.atan(Math.tan(baseRad / 2) * REF_ASPECT);
        adjusted = 2 * Math.atan(Math.tan(hFov / 2) / aspect) * 180 / Math.PI;
    } else if (height < REF_HEIGHT) {
        // Landscape short (e.g. 844x390): 高さ比で補正
        const heightRatio = height / REF_HEIGHT;  // 390/900 ≈ 0.43
        const boost = 1.0 + (1.0 - heightRatio) * 0.35;  // max ~1.2x
        adjusted = base * boost;
    }

    return Math.min(adjusted, 120);
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
