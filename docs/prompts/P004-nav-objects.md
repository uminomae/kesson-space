# P004: ナビゲーションオブジェクトのデザイン

---

## Context

Project: kesson-space（欠損駆動思考の3Dビジュアライゼーション）
Tech: Three.js 0.160.0, ES Modules (importmap), no build tools
Hosting: GitHub Pages

### 世界観

このWebサイトは「欠損駆動思考」という思考フレームワークの体験型ビジュアライゼーション。
- 闇（dark slate blueグラデーション）の中に光が浮かぶ空間
- 光はフラクタルエッジで明滅し、水面が下方に揺れている
- 粒子が空間に浮遊する
- カメラはOrbitControlsで回転・ズーム可能
- 美学: 忍的、秘すれば花、露骨にしない

### 現在の構成

背景の光（kessonメッシュ）は演出用でクリック不可。
別途、ナビゲーション用のオブジェクトが3つあり、クリックするとPDFが開く。
現在は「四角いテキストボックス」（CanvasテクスチャのSprite）で、世界観に合っていない。

---

## Request

### What to change

ナビゲーションオブジェクトの見た目を、世界観に合うものに変えたい。

### オブジェクトの要件

1. **3つのナビオブジェクト** — それぞれにラベルがある
   - 「一般向け」
   - 「設計者向け」
   - 「学術版」
2. **クリック可能であることが直感的にわかる**
   - 背景の光とは明らかに異なる存在感
   - ホバー時に変化があると良い（光が強くなる、少し大きくなる、など）
3. **世界観に溶け込む**
   - 「UIボタン」や「Webアプリ」のように見えたらNG
   - この空間に自然に存在するものとして
   - 例: 小さな光の球体 + テキストラベルが側に浮く、半透明の結晶的なカード、光のリング、など
   - アイデアは自由に提案してOK
4. **ラベルの読みやすさ**
   - 日本語テキストが読める必要がある（Canvasテクスチャ or CSS2DRenderer or Sprite）
   - フォント: 明朝体系（Yu Mincho等）
5. **空間内の配置**
   - カメラの前方、やや上に3つ並ぶ
   - カメラからの距離感が適切（近すぎず遠すぎず）
   - ゆっくり浮遊するアニメーション

### Why

現在の四角いボックスはbootstrap的なWeb UIに見え、世界観を壊している。
この空間の一部として自然に存在しつつ、「クリックできる」ことが知覚できるものが必要。

---

## Current Code

以下の2つの関数を書き換えてください。

```javascript
// --- テキストスプライト生成 ---
function createTextSprite(text, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    // 背景（半透明の暗いガラス）
    ctx.fillStyle = 'rgba(15, 25, 40, 0.5)';
    roundRect(ctx, 0, 0, canvas.width, canvas.height, 8);
    ctx.fill();

    // ボーダー
    ctx.strokeStyle = `rgba(100, 150, 255, 0.2)`;
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, canvas.width - 2, canvas.height - 2, 8);
    ctx.stroke();

    // テキスト
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '36px "Yu Mincho", "MS PMincho", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(8, 2, 1);

    return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// --- ナビオブジェクト作成 ---
function createNavObjects(scene) {
    NAV_ITEMS.forEach((item, index) => {
        const sprite = createTextSprite(item.label, item.color);
        sprite.position.set(...item.position);
        sprite.userData = {
            type: 'nav',
            url: item.url,
            label: item.label,
            baseY: item.position[1],
            index,
        };
        scene.add(sprite);
        _navMeshes.push(sprite);
    });
}
```

### 利用可能な変数（グローバル）

```javascript
import * as THREE from 'three';

const NAV_ITEMS = [
    {
        label: '一般向け',
        url: '...kesson-general.pdf',
        position: [-8, 5, 0],
        color: 0x6688cc,
    },
    {
        label: '設計者向け',
        url: '...kesson-designer.pdf',
        position: [0, 5, 0],
        color: 0x7799dd,
    },
    {
        label: '学術版',
        url: '...kesson-academic.pdf',
        position: [8, 5, 0],
        color: 0x5577bb,
    },
];

const _navMeshes = [];  // クリック判定用にここにpushする
```

### updateNavigation 関数（必要なら書き換えてOK）

```javascript
export function updateNavigation(time) {
    _navMeshes.forEach((sprite) => {
        const data = sprite.userData;
        sprite.position.y = data.baseY + Math.sin(time * 0.4 + data.index * 1.5) * 0.4;
    });
}
```

---

## Output Rules

1. **上記3つの関数の置き換えコードだけを出力**
   - `createNavObjects(scene)` — ナビオブジェクトを作ってsceneに追加し、`_navMeshes` にpushする
   - テキスト生成のヘルパー関数（必要なら）
   - `updateNavigation(time)` — 毎フレームアニメーション
2. **Raycaster対応**: `_navMeshes` にpushされたオブジェクトがRaycasterでクリック検出できること
   - SpriteでもMeshでもGroupでもOKだが、`intersectObjects`でhitする必要がある
   - Groupの場合は `intersectObjects(_navMeshes, true)` にするので子にMeshがあればOK
3. **`userData`を保持**: 各オブジェクトに以下のuserDataを設定すること
   ```javascript
   object.userData = {
       type: 'nav',
       url: item.url,
       label: item.label,
       baseY: item.position[1],
       index,
   };
   ```
4. **パフォーマンス**: 60fpsを維持（シェーダー使用OKだが重たくしない）
5. **変更箇所に `// CHANGED` コメント**
6. **デザインの意図を簡潔にコメントで説明**

---

## Constraints

- `import * as THREE from 'three';` が利用可能
- Three.js 0.160.0 (CDN)
- ES Modules only, no npm
- OrbitControls使用中（カメラが回転するので、ビルボード的にカメラを向くならSpriteが楽）
- フォント: `'Yu Mincho', 'MS PMincho', serif`
