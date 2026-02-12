// controls.js — カメラ制御（スクロール潜水版）
// モバイルファースト: タッチ/ホイールはすべてページスクロールに渡す
// スクロール → カメラY下降（水面に潜る演出）

import { toggles, breathConfig, sceneParams } from './config.js';

let _camera;

// デスクトップ基準
const REF_ASPECT = 16 / 9;
const REF_HEIGHT = 900;

// スクロール潜水パラメータ
const DIVE_DEPTH = 30;           // カメラが潜る最大Y距離
const DIVE_SCROLL_VH = 1.5;     // 何vh分のスクロールで完全潜水
const LOOKAT_BASE_Y = -1;       // 初期lookAtのY

// 自動回転
let _autoRotateSpeed = 1.0;
let _baseCamY = 0;
let _baseCamX = -14;
let _baseCamZ = 34;

// スクロール進捗 (0 = 水面, 1 = 完全潜水)
let _scrollProgress = 0;

export function initControls(camera, container, renderer) {
    _camera = camera;
    _baseCamY = sceneParams.camY;
    _baseCamX = sceneParams.camX;
    _baseCamZ = sceneParams.camZ;
}

export function setAutoRotateSpeed(speed) {
    _autoRotateSpeed = speed;
}

export function setCameraPosition(x, y, z) {
    _baseCamX = x;
    _baseCamY = y;
    _baseCamZ = z;
}

export function setTarget(x, y, z) {
    // unused in scroll mode
}

/**
 * スクロール進捗を取得 (0~1)
 * 外部から参照可能
 */
export function getScrollProgress() {
    return _scrollProgress;
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

    // --- スクロール進捗 ---
    const diveScrollPx = window.innerHeight * DIVE_SCROLL_VH;
    _scrollProgress = Math.min(1, window.scrollY / diveScrollPx);

    // --- easeInOut for smooth dive ---
    const eased = _scrollProgress < 0.5
        ? 2 * _scrollProgress * _scrollProgress
        : 1 - Math.pow(-2 * _scrollProgress + 2, 2) / 2;

    // --- FOV呼吸 ---
    const fovBase = getAdjustedFovBase();
    if (toggles.fovBreath) {
        _camera.fov = fovBase + (breathVal * 2 - 1) * breathConfig.fovAmplitude;
    } else {
        _camera.fov = fovBase;
    }
    _camera.updateProjectionMatrix();

    // --- 自動回転（Y軸周り） ---
    const radius = Math.sqrt(_baseCamX * _baseCamX + _baseCamZ * _baseCamZ);
    let angle = Math.atan2(_baseCamX, _baseCamZ);

    if (toggles.autoRotate) {
        // ゆっくり回転を累積
        angle += time * _autoRotateSpeed * 0.002;
    }

    const rotX = radius * Math.sin(angle);
    const rotZ = radius * Math.cos(angle);

    // --- スクロールでカメラY下降 ---
    const diveY = _baseCamY - eased * DIVE_DEPTH;

    _camera.position.set(rotX, diveY, rotZ);
    _camera.lookAt(0, LOOKAT_BASE_Y - eased * DIVE_DEPTH * 0.5, -10);
}
