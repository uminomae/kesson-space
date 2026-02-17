# three@0.160.0 vendored inventory

Issue #35 の CDN 単一依存解消のため、three runtime 依存を self-host 化。

## Added
- source package: npm `three@0.160.0`
- `build/three.module.js` を含む `build/` 一式
- `examples/jsm/` 一式（addons 依存連鎖を欠損なく解決）
- upstream metadata: `LICENSE`, `package.json`

## Snapshot
- total files: 580
- build files: 5
- examples/jsm files: 555
- size: 30M
- jsm top-level dirs: animation, cameras, capabilities, controls, csm, curves, effects, environments, exporters, geometries, helpers, interactive, libs, lights, lines, loaders, materials, math, misc, modifiers, nodes, objects, offscreen, physics, postprocessing, renderers, shaders, textures, transpiler, utils, webxr

## Runtime impact
- `index.html` / `devlog.html` の import map で `three` と `three/addons/` をローカル `./vendor/three@0.160.0/` 参照に切替。
