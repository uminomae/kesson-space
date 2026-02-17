# INSTRUCTION-35: import map self-host 化（three CDN 単一依存の排除）

## Issue
- #35 `[P1] import map が単一CDN依存 — CDN障害時に全モジュール連鎖停止`

## 設計方針
1. **import map の three 系を self-host 化**
- `three` と `three/addons/` は `vendor/three@0.160.0/` 配下へ切替。
- runtime の three 系 URL を CDN から排除し、CDN障害の単一障害点を除去する。

2. **vendor 化の単位**
- バージョンは現行互換維持のため `0.160.0` 固定。
- 参照一貫性のため `build/three.module.js` と `examples/jsm/` を同一バージョンで配置。

3. **変更対象（最小）**
- `index.html`
- `devlog.html`
- `vendor/three@0.160.0/**`（追加）
- `vendor/three@0.160.0/INVENTORY.md`（追加、棚卸し）

4. **非対象**
- `marked` や Bootstrap 等、Issue #35 の three 依存解消と無関係な CDN は変更しない。
- レンダリングロジックやシェーダーコードは変更しない。

## ロールバック方針
1. import map の `three` / `three/addons/` を `https://unpkg.com/three@0.160.0/...` に戻す。
2. `vendor/three@0.160.0/` を削除する。
3. 追加した棚卸しファイルを削除する。

## 検証
- `node tests/config-consistency.test.js`
- `node --experimental-vm-modules tests/config-exports.test.js`
- 変更ファイルへの `node --check`
