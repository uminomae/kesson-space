// controls.js — カメラ制御（スクロールレイアウト版）
// OrbitControls無効、自動回転 + FOV呼吸のみ
// モバイルファースト: タッチ操作はすべてページスクロールに渡す

import { toggles, breathConfig } from './config.js';

let _camera;

// デスクトップ基準: 16:9, 高さ900px
const REF_ASPECT = 16 / 9;
const REF_HEIGHT = 900;

// 自動回転
let _autoRotateSpeed = 1.0; // deg/sec
let _targetY = -1;

export function initControls(camera, container, renderer) {
    _camera = camera;
    // OrbitControls不使用 — タッチ/ホイールをページスクロールに渡す
}

export function setAutoRotateSpeed(speed) {
    _autoRotateSpeed = speed;
}

export function setCameraPosition(x, y, z) {
    if (_camera) _camera.position.set(x, y, z);
}

export function setTarget(x, y, z) {
    _targetY = y;
}

/**
 * アスペクト比 + 画面高さに応じたFOV補正
 */
function getAdjustedFovBase() {
    const base = breathConfig.fovBase;
    const aspect = _camera.aspect;
    const height = window.innerHeight;

    let adjusted = base;

    if (aspect < 1) {
        const baseRad = base * Math.PI / 180;
        const hFov = 2 * Math.atan(Math.tan(baseRad / 2) * REF_ASPECT);
        adjusted = 2 * Math.atan(Math.tan(hFov / 2) / aspect) * 180 / Math.PI;
    } else if (height < REF_HEIGHT) {
        const heightRatio = height / REF_HEIGHT;
        const boost = 1.0 + (1.0 - heightRatio) * 0.35;
        adjusted = base * boost;
    }

    return Math.min(adjusted, 120);
}

export function updateControls(time, breathVal = 0.5) {
    if (!_camera) return;

    const fovBase = getAdjustedFovBase();

    // --- FOV呼吸 ---
    if (toggles.fovBreath) {
        _camera.fov = fovBase + (breathVal * 2 - 1) * breathConfig.fovAmplitude;
    } else {
        _camera.fov = fovBase;
    }
    _camera.updateProjectionMatrix();

    // --- 自動回転（Y軸周り） ---
    if (toggles.autoRotate) {
        const radius = Math.sqrt(
            _camera.position.x * _camera.position.x +
            _camera.position.z * _camera.position.z
        );
        const angle = Math.atan2(_camera.position.x, _camera.position.z);
        const speed = _autoRotateSpeed * 0.002; // ゆっくり
        const newAngle = angle + speed;

        _camera.position.x = radius * Math.sin(newAngle);
        _camera.position.z = radius * Math.cos(newAngle);
        _camera.lookAt(0, _targetY, -10);
    }
}
