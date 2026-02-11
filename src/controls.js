// controls.js — カメラ制御
// OrbitControls + 呼吸アニメーション

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let _camera;
let _controls;

/**
 * コントロールの初期化
 * @param {THREE.PerspectiveCamera} camera
 * @param {HTMLElement} container
 * @param {THREE.WebGLRenderer} renderer
 */
export function initControls(camera, container, renderer) {
    _camera = camera;

    // --- OrbitControls ---
    _controls = new OrbitControls(camera, renderer.domElement);

    // 注視点（シーンの中心やや下）
    _controls.target.set(0, -5, -10);

    // ダンピング（慣性）— 浮遊感を出す
    _controls.enableDamping = true;
    _controls.dampingFactor = 0.04;

    // ズーム制限
    _controls.minDistance = 10;
    _controls.maxDistance = 80;

    // 垂直角度制限（ひっくり返らない）
    _controls.minPolarAngle = Math.PI * 0.15;  // 上から見すぎない
    _controls.maxPolarAngle = Math.PI * 0.75;  // 下から見すぎない

    // 回転速度（ゆっくり）
    _controls.rotateSpeed = 0.4;
    _controls.zoomSpeed = 0.6;

    // パン（水平移動）を許可するが控えめに
    _controls.enablePan = true;
    _controls.panSpeed = 0.3;

    // 自動回転（ゆるく）
    _controls.autoRotate = true;
    _controls.autoRotateSpeed = 0.15;

    // ユーザー操作時は自動回転を止め、しばらくしたら再開
    let autoRotateTimeout;
    const resumeAutoRotate = () => {
        clearTimeout(autoRotateTimeout);
        _controls.autoRotate = false;
        autoRotateTimeout = setTimeout(() => {
            _controls.autoRotate = true;
        }, 8000); // 8秒操作なしで再開
    };

    renderer.domElement.addEventListener('pointerdown', resumeAutoRotate);
    renderer.domElement.addEventListener('wheel', resumeAutoRotate, { passive: true });
    renderer.domElement.addEventListener('touchstart', resumeAutoRotate, { passive: true });
}

/**
 * 自動回転速度をdevパネルから変更
 */
export function setAutoRotateSpeed(speed) {
    if (_controls) {
        _controls.autoRotateSpeed = speed;
    }
}

/**
 * 毎フレームのカメラ更新
 * @param {number} time - elapsed time in seconds
 */
export function updateControls(time) {
    if (!_camera || !_controls) return;

    // L0: 呼吸（有機的な合成波）
    const breath = Math.sin(time * 0.3) + Math.sin(time * 0.1) * 0.5;
    _camera.fov = 60 + breath * 1.0;
    _camera.updateProjectionMatrix();

    // OrbitControls更新（ダンピング処理）
    _controls.update();
}
