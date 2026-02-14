/**
 * zoom.js — ズームコントローラー
 *
 * カード選択時: カメラがカードに寄り、他カードが暗くなる
 * 戻る時: カメラが元に戻り、全カードが復帰
 * GSAP不使用。手書きlerp + easing。
 */

import * as THREE from 'three';

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

export class ZoomController {
    constructor(camera, gridGroup) {
        this.camera = camera;
        this.gridGroup = gridGroup;
        this.isZoomed = false;
        this.isAnimating = false;
        this.selectedCard = null;
        this.restPosition = camera.position.clone();
        this.animProgress = 0;
        this.animDirection = 0;
        this.animDuration = 0.5;
        this.animStartTime = 0;
        this.targetCamPos = new THREE.Vector3();
        this.fromCamPos = new THREE.Vector3();
        this.otherCards = [];
    }

    zoomIn(card) {
        if (this.isAnimating || this.isZoomed) return;
        this.selectedCard = card;
        this.isAnimating = true;
        this.animDirection = 1;
        this.animStartTime = performance.now() * 0.001;
        const worldPos = new THREE.Vector3();
        card.getWorldPosition(worldPos);
        this.fromCamPos.copy(this.camera.position);
        this.targetCamPos.set(worldPos.x, worldPos.y, worldPos.z + 5.0);
        this.restPosition.copy(this.camera.position);
        this.otherCards = this.gridGroup.children.filter(c => c !== card);
    }

    zoomOut() {
        if (this.isAnimating || !this.isZoomed) return;
        this.isAnimating = true;
        this.animDirection = -1;
        this.animStartTime = performance.now() * 0.001;
        this.fromCamPos.copy(this.camera.position);
        this.targetCamPos.copy(this.restPosition);
    }

    update() {
        if (!this.isAnimating) return;
        const now = performance.now() * 0.001;
        const elapsed = now - this.animStartTime;
        let t = Math.min(1.0, elapsed / this.animDuration);
        t = easeOutCubic(t);

        if (this.animDirection === 1) {
            this.camera.position.lerpVectors(this.fromCamPos, this.targetCamPos, t);
            this.otherCards.forEach(card => {
                if (card.material && card.material.uniforms) {
                    const orig = card.userData.session ? card.userData.session.intensity : 0.5;
                    const target = orig * 0.15;
                    card.material.uniforms.uIntensity.value = orig + (target - orig) * t;
                }
            });
        } else {
            this.camera.position.lerpVectors(this.fromCamPos, this.targetCamPos, t);
            this.otherCards.forEach(card => {
                if (card.material && card.material.uniforms) {
                    const orig = card.userData.session ? card.userData.session.intensity : 0.5;
                    const current = card.material.uniforms.uIntensity.value;
                    card.material.uniforms.uIntensity.value = current + (orig - current) * t;
                }
            });
        }

        if (elapsed >= this.animDuration) {
            this.isAnimating = false;
            if (this.animDirection === 1) {
                this.isZoomed = true;
            } else {
                this.isZoomed = false;
                this.selectedCard = null;
                this.otherCards.forEach(card => {
                    if (card.material && card.material.uniforms && card.userData.session) {
                        card.material.uniforms.uIntensity.value = card.userData.session.intensity;
                    }
                });
            }
        }
    }
}
