// devlog-config.js — devlog.html用の設定値一元管理
// devlog-bg.js, devlog.html (CSS変数) から参照

export const devlogParams = {
  camera: {
    positionY: -50,
    lookAtY: -50,
  },
  overlay: {
    opacityTop: 0.3,
    opacityMid: 0.5,
    opacityBottom: 0.7,
    bgColor: '5, 5, 8',     // rgba()のRGB部分
  },
  fog: {
    density: 0.012,
  },
  toggles: {
    background: true,
    water: true,
    kessonLights: true,
    vortex: true,
    fog: true,
  },
};
