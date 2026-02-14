/**
 * card.js — セッションカード
 *
 * PlaneGeometry + ShaderMaterial。
 * カテゴリ色のグラデーション背景、intensityに応じた枠線の輝度。
 * サンプル画像はCanvasで動的生成。
 */

import * as THREE from 'three';

const CARD_WIDTH = 2.0;
const CARD_HEIGHT = CARD_WIDTH * (9 / 16);  // = 1.125 (16:9)

/**
 * サンプル画像をCanvasで生成
 */
function generatePlaceholderTexture(session) {
    const canvas = document.createElement('canvas');
    const W = 512;   // 16:9 アスペクト比
    const H = 288;   // 512 * 9/16 = 288
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 背景グラデーション
    const color = session.color || '#94a3b8';
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#0a0e1a');
    gradient.addColorStop(0.5, color + '40');
    gradient.addColorStop(1, '#0a0e1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // ノイズパターン
    const imageData = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15;
        imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + noise));
        imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + noise));
        imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    // グリッドパターン（コミット数に応じた密度）
    const gridSize = Math.max(8, 32 - Math.floor((session.commit_count || 5) / 2));
    ctx.strokeStyle = color + '30';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }

    // 中央にカテゴリアイコン風の形状
    ctx.save();
    ctx.translate(W / 2, H / 2);
    const intensity = session.intensity || 0.5;
    ctx.globalAlpha = 0.3 + intensity * 0.4;
    
    const category = session.dominant_category || 'code';
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    switch (category) {
        case 'shader':
            // 波形パターン
            ctx.beginPath();
            for (let i = -60; i <= 60; i += 2) {
                const y = Math.sin(i * 0.1) * 20 * intensity;
                if (i === -60) ctx.moveTo(i, y);
                else ctx.lineTo(i, y);
            }
            ctx.stroke();
            break;
        case 'document':
            // ドキュメントアイコン
            ctx.fillRect(-30, -40, 60, 80);
            ctx.fillStyle = '#0a0e1a';
            ctx.fillRect(-20, -30, 40, 8);
            ctx.fillRect(-20, -15, 40, 8);
            ctx.fillRect(-20, 0, 30, 8);
            break;
        case 'config':
            // 歯車風
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = i % 2 === 0 ? 35 : 25;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            break;
        case 'asset':
            // 画像アイコン
            ctx.strokeRect(-35, -25, 70, 50);
            ctx.beginPath();
            ctx.arc(-15, -5, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-30, 20);
            ctx.lineTo(-5, 0);
            ctx.lineTo(10, 10);
            ctx.lineTo(30, -10);
            ctx.stroke();
            break;
        case 'infra':
            // サーバーラック風
            ctx.strokeRect(-30, -35, 60, 70);
            ctx.fillRect(-25, -30, 50, 15);
            ctx.fillRect(-25, -10, 50, 15);
            ctx.fillRect(-25, 10, 50, 15);
            break;
        default: // code
            // コードブラケット
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('{ }', 0, 0);
    }
    ctx.restore();

    // 日付テキスト
    if (session.start) {
        const date = new Date(session.start);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.font = '14px monospace';
        ctx.fillStyle = color + '80';
        ctx.textAlign = 'left';
        ctx.fillText(dateStr, 12, 24);
    }

    // コミット数
    if (session.commit_count) {
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'right';
        ctx.fillText(`${session.commit_count}`, W - 12, H - 12);
    }

    // ボーダー
    ctx.strokeStyle = color + '60';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform sampler2D uTexture;
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uHover;
    uniform float uSelected;
    uniform float uBreath;
    varying vec2 vUv;

    void main() {
        vec2 uv = vUv;
        
        // テクスチャ取得
        vec4 tex = texture2D(uTexture, uv);
        vec3 color = tex.rgb;
        
        // 呼吸アニメーション
        float breath = sin(uBreath) * 0.5 + 0.5;
        color += uColor * 0.05 * breath * uIntensity;

        // ホバー時のハイライト
        float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
        float edgeWidth = 0.03 + uHover * 0.02;
        float border = smoothstep(edgeWidth, edgeWidth - 0.015, edgeDist);
        vec3 borderColor = uColor * (0.5 + uIntensity * 0.5);
        borderColor += vec3(1.0, 0.95, 0.8) * uHover * 0.4;
        
        color = mix(color, borderColor, border * (0.6 + uHover * 0.4));
        
        // 選択時の輝き
        color += uColor * uSelected * 0.3;
        
        // ホバー時の全体的な明るさ
        color += vec3(0.05) * uHover;

        gl_FragColor = vec4(color, 1.0);
    }
`;

export function createCard(session, position) {
    const geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
    const color = new THREE.Color(session.color || '#94a3b8');
    
    // テクスチャ生成（texture_urlがあれば読み込み、なければCanvas生成）
    let texture;
    if (session.texture_url) {
        texture = new THREE.TextureLoader().load(session.texture_url);
    } else {
        texture = generatePlaceholderTexture(session);
    }

    const material = new THREE.ShaderMaterial({
        vertexShader, fragmentShader,
        uniforms: {
            uTexture: { value: texture },
            uColor: { value: color },
            uIntensity: { value: session.intensity || 0.5 },
            uHover: { value: 0.0 },
            uSelected: { value: 0.0 },
            uBreath: { value: 0.0 },
        },
        transparent: true,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    let hoverTarget = 0;
    mesh.userData.setHover = (val) => { hoverTarget = val ? 1.0 : 0.0; };
    mesh.userData.updateBreath = (t) => {
        material.uniforms.uBreath.value = t * 1.5;
        const current = material.uniforms.uHover.value;
        material.uniforms.uHover.value += (hoverTarget - current) * 0.12;
    };
    mesh.userData.setSelected = (val) => { material.uniforms.uSelected.value = val; };
    return mesh;
}
