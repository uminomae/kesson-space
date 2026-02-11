// controls.js — カメラ・マウス・インタラクション

let _camera;
let _targetX = 0;
let _targetY = 0;

/**
 * コントロールの初期化
 * @param {THREE.PerspectiveCamera} camera
 * @param {HTMLElement} container
 */
export function initControls(camera, container) {
    _camera = camera;

    // マウス視差
    window.addEventListener('mousemove', (event) => {
        _targetX = (event.clientX / window.innerWidth - 0.5) * 3;
        _targetY = (event.clientY / window.innerHeight - 0.5) * 3;
    });

    // モバイルタッチ視差
    window.addEventListener('touchmove', (event) => {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            _targetX = (touch.clientX / window.innerWidth - 0.5) * 3;
            _targetY = (touch.clientY / window.innerHeight - 0.5) * 3;
        }
    }, { passive: true });
}

/**
 * 毎フレームのカメラ更新
 * @param {number} time - elapsed time in seconds
 */
export function updateControls(time) {
    if (!_camera) return;

    // L0: 呼吸（有機的な合成波）
    const breath = Math.sin(time * 0.3) + Math.sin(time * 0.1) * 0.5;
    _camera.fov = 60 + breath * 1.0;
    _camera.updateProjectionMatrix();

    // カメラの浮遊感
    _camera.position.x += (_targetX - _camera.position.x) * 0.03;
    _camera.position.z += (25 + _targetY - _camera.position.z) * 0.03;
    _camera.lookAt(0, -5, -10);
}
