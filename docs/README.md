# docs/README.md — プロジェクト管理ハブ

**バージョン**: 1.3
**更新日**: 2026-02-14

本ファイルは、kesson-spaceのセッション起動・運用・同期の**唯一の管理ハブ**である。
旧 SCOPE.md・WORKFLOW.md の内容を統合し、一本化した。

---

## 1. プロジェクトの位置づけとスコープ

kesson-spaceは、欠損駆動思考プロジェクト群の**3D体験空間**を担当する。

```
kesson-driven-thinking（理論の正本・Private）
    │
    ├──→ kesson-space（3D体験空間）  ← 本リポジトリ
    │
    └──→ pjdhiro（ブログ・PDF配信）
```

情報の流れは**単方向**。kesson-driven-thinking → kesson-space。逆方向の依存は作らない。

### スコープ

Three.jsサイト（https://uminomae.github.io/kesson-space/）に関する**技術的な実装・運用・改善**のみ。

| 扱う | 扱わない（→ 担当リポジトリ） |
|------|-------------------------------|
| Three.js / GLSL 実装・調整 | 理論の構築・精緻化（→ kesson-thinking） |
| UI/UX・モバイル対応・パフォーマンス | 保持論点 ISS-*・理論タスク（→ kesson-thinking） |
| ナビ・ビューアー・言語切替・devパネル | PDF本文の生成・変換ルール（→ kesson-thinking） |
| CONCEPT.mdに基づく理論→視覚の変換判断 | ブログ記事の執筆（→ pjdhiro） |

理論的判断が必要になった場合は、kesson-thinkingセッションで決定し、CONCEPT.mdに反映する。
kesson-spaceセッションはCONCEPT.mdを参照して実装する。

---

## 2. セッション開始手順

Claudeは新セッションで以下を**順番に**実行する。

### Step 0: 環境判定（Claudeが自動実行）

利用可能ツールを確認し、環境を判定：

| 判定基準 | 環境 | ルート |
|---------|------|--------|
| `github:` ツールが存在 | DTアプリ + MCP | → Step 1A |
| `github:` ツールなし | ウェブ版 | → Step 1B |

### Step 1A: 管理書類の参照（DTアプリ）

GitHub APIで正本を直接取得：

| 優先度 | 対象 | 目的 |
|--------|------|------|
| 1 | `docs/README.md`（本ファイル） | 運用ルール全体 |
| 2 | `docs/CURRENT.md` | 進捗・残タスク |
| 3 | `docs/TODO.md` | バックログ確認 |
| 4 | `docs/CONCEPT.md` | 必要時のみ |

**PKは参照しない**。GitHub正本を直接読む。

**cross-repo確認**（タスクが外部リポジトリに関係する場合のみ）:

| リポジトリ | 参照ファイル |
|-----------|-------------|
| kesson-driven-thinking | `docs/CURRENT.md` |
| pjdhiro | 必要に応じて |

### Step 1B: ウェブ版の場合

未定。DTアプリでの運用を確立した後に策定する。
当面はPK参照で簡易運用。CURRENT.mdの更新日付が古い場合はユーザーに同期を促す。

### Step 2: 現状報告

Phase・進捗・引き継ぎ事項・残タスクを把握しユーザーに報告。
ユーザーがタスク指定済みなら確認不要で着手。

---

## 3. セッション終了手順

### 必須チェックリスト

- [ ] `docs/CURRENT.md` を更新（完了タスク、未完了、新規課題、次回タスク）
- [ ] `docs/TODO.md` を更新（完了→移動、新規タスク→追加）
- [ ] ブランチ確認：作業ブランチで作業した場合、mainにマージするか？
- [ ] GitHubにプッシュ
- [ ] cross-repo報告経路の確認：CURRENT.mdとCONCEPT.mdは正確か？
- [ ] 理論的判断の保留事項があればCURRENT.mdに記録

### CURRENT.md テンプレート

```markdown
# CURRENT - 進捗・引き継ぎ

**最終更新**: YYYY-MM-DD
**セッション**: #N タイトル

## 現在の状態
### 完了 / 進行中 / 未着手

## 技術的メモ
## 参照リンク
```

### セッション番号の採番

- 新しいセッションごとに `#N` をインクリメント
- 日付が変わったら新セッション
- 長時間空いたら新セッション

---

## 4. 正本の原則・出力ルール

```
GitHub リポジトリ = 正本（single source of truth）
Project Knowledge = GitHubの同期先（読み取り専用の鏡）
```

PKを直接編集・削除しない。すべての変更はGitHubに対して行う。

### DTアプリの場合

```
Claude → GitHub APIで直接コミット
  ↓
完了（PK同期不要）
```

### ウェブ版の場合

未定。当面はPKで簡易運用。

---

## 5. Cross-repoプロトコル

### kesson-thinking → kesson-space（読み取り）

kesson-driven-thinkingセッションが本リポジトリの状態を確認する際の参照ポイント：

| 参照ファイル | 提供する情報 |
|-------------|-------------|
| `docs/CURRENT.md` | 進捗・未着手タスク・技術メモ |
| `docs/CONCEPT.md` | 理論と視覚表現の対応表 |

これが本リポジトリからkesson-thinkingへの**唯一の報告経路**。

### kesson-space → kesson-thinking（参照しない）

本リポジトリからkesson-driven-thinkingの内部文書を参照する運用はない。
理論的な指示はCONCEPT.mdを経由して受け取る。

### 変換ルールの所在

理論→3D体験空間への変換ルールは、kesson-driven-thinking側の
`transform/reader-rules/reader-rules-space.md` に正本がある。本リポジトリにコピーは持たない。

### セッションで理論的議論が発生した場合

1. 判断を保留し、ユーザーに報告
2. 「この判断はkesson-thinkingセッションで行うべきか？」を確認
3. ここで決定するならCONCEPT.mdに反映。持ち帰るならCURRENT.mdに保留記録

---

## 6. PK管理（Claude.ai Project運用）

### PKに含まれる文書の読み方

PKにはkesson-thinking側の管理文書も含まれている。
これらは**プロジェクト群の全体構造を理解するための文脈情報**であり、
このセッションで直接操作する対象ではない。

| PK内の文書 | 由来 | 扱い |
|-----------|------|------|
| kesson-space の docs/* | 本リポジトリ | 直接操作対象 |
| kesson-thinking の docs/* | 親リポジトリ | 文脈参照のみ |

### Tier分類

| Tier | ファイル | 参照タイミング |
|------|---------|---------------|
| 1 | README.md, CURRENT.md, TODO.md | セッション開始時に必ず |
| 2 | CONCEPT.md, ARCHITECTURE.md | タスクに応じて |
| 3 | PROMPT-STRUCTURE.md, REVIEW-REPORT.md, prompts/ | Gemini作業時のみ |

---

## 7. Claude × Gemini 分業体制

| 役割 | 担当 | 責務 |
|------|------|------|
| **マネージャー** | Claude | コンテキスト把握、要件整理、プロンプト設計、複数ファイル管理、config/devパネル/main.js統合 |
| **プログラマー** | Gemini | Three.js実装、GLSLシェーダー、視覚的品質の最適化 |

### エージェント呼び出しルール

**Three.js / GLSLコードの実装は、必ずGemini MCP経由で行う。**

| 作業内容 | 担当 | 理由 |
|---------|------|------|
| シェーダー新規作成・修正 | **Gemini** | 視覚品質・GLSL専門性 |
| Three.jsメッシュ・マテリアル・ジオメトリ | **Gemini** | 3D実装の専門性 |
| config.js パラメータ追加 | Claude | 設定管理はClaudeの責務 |
| dev-panel.js スライダー追加 | Claude | UI統合はClaudeの責務 |
| main.js applyDevValue 追加 | Claude | ワイヤリングはClaudeの責務 |
| scene.js 統合・呼び出し追加 | Claude | オーケストレーションはClaudeの責務 |
| HTML/CSS変更 | Claude | DOM操作はClaudeの責務 |
| twiglコード→Three.js変換 | **Gemini** | シェーダー移植は専門作業 |

### ワークフロー

```
1. Claude: 要件整理 + プロンプト設計（PROMPT-STRUCTURE.md参照）
2. Claude: Gemini MCPにコード生成を依頼
3. Claude: 生成されたコードをconfig/devパネル/scene.jsに統合
4. ユーザー: 視覚確認・フィードバック
5. 必要に応じて 2–4 を繰り返し
```

**Claudeが直接Three.js/GLSLを書かない。** Claudeが書くと品質差やバグ（UV正規化ミス等）が発生する。

MCPツール・セットアップの技術詳細は ARCHITECTURE.md を参照。

---

## 8. テスト・品質管理

### 三層テスト体制

| 層 | トリガー | ツール | 内容 |
|----|---------|--------|------|
| **CI自動** | `git push`（src/, tests/, index.html変更時） | GitHub Actions + Node.js | config整合性テスト |
| **E2Eスモーク** | デプロイ後 | Claude in Chrome MCP | TC-01, 02, 04（約2分） |
| **E2Eフル** | 機能追加後 | Claude in Chrome MCP | TC-01〜08（約5分） |

### ルール

1. **コミット前**: `node tests/config-consistency.test.js` をローカルで実行。CIでも自動実行される
2. **デプロイ後**: E2Eスモークテストを実行（「E2Eスモーク実行して」でClaude in Chromeが対応）
3. **機能追加時**: 該当するTCを更新 or 新規TCを設計書に追加してからコード実装（テスト先行）
4. **テスト結果**: CURRENT.mdに記録

### 実行方法

#### 静的テスト（Node.js / CI）

```bash
node tests/config-consistency.test.js
```

config ↔ shader ↔ dev-panel の値整合性、i18nキー構造、未使用ファイルを検証。
`process.exit(1)` でFAIL時に非ゼロ返却 → CIで赤バッジ。

#### E2Eテスト（Claude in Chrome MCP）

```javascript
// 全テスト実行
fetch('https://uminomae.github.io/kesson-space/tests/e2e-runner.js')
  .then(r => r.text()).then(eval)

// スモーク（TC-01, 02, 04 のみ）
window.__e2e.smoke()

// 個別実行
window.__e2e.run('TC-E2E-03')  // 例: 言語テスト（?lang=en で実行）
```

#### テストケース一覧

| TC | カテゴリ | 検証内容 |
|----|---------|----------|
| 01 | WebGL描画 | canvas存在、WebGLコンテキスト、アニメーション動作 |
| 02 | UI要素 | タイトル、タグライン、クレジット、操作ガイド、リンク |
| 03 | 言語切替 | `?lang=en` での英語表示、トグルボタン |
| 04 | コンソール | JSエラーゼロ、404なし |
| 05 | ナビオーブ | シーン内存在、ラベル表示、視認性 |
| 06 | スクロール | カメラ移動、dev-log表示、浮上ボタン |
| 07 | Devパネル | `?dev` での表示制御、スライダー連動 |
| 08 | パフォーマンス | ロード時間、FPS、メモリ |

詳細設計: [tests/e2e-test-design.md](../tests/e2e-test-design.md)

### テストファイル

| ファイル | 種別 | 実行環境 |
|---------|------|---------|
| `tests/config-consistency.test.js` | 静的解析 | Node.js / CI |
| `tests/e2e-test-design.md` | E2E設計書 | ドキュメント |
| `tests/e2e-runner.js` | E2Eランナー | ブラウザ注入 |
| `.github/workflows/test.yml` | CI定義 | GitHub Actions |

---

## 9. ブランチ運用

| ブランチ | 役割 | pushする人/ツール |
|---------|------|------------------|
| main | 正本。GitHub Pagesデプロイ対象 | DTアプリ（GitHub API） |
| feature/* | 機能開発用 | 必要時に作成 |

- DTアプリは通常mainに直接push
- 大きな変更は feature/* で作業し、レビュー後にマージ
- **セッション終了時に必ず確認**: 作業ブランチが残っていたら、mainにマージするかをユーザーに確認

---

## 10. ファイルカタログ

### 管理文書

| パス | 役割 | Tier |
|------|------|------|
| `docs/README.md` | 管理ハブ（本ファイル） | 1 |
| `docs/CURRENT.md` | 進捗・セッション記録 | 1 |
| `docs/TODO.md` | タスクバックログ（優先度・分類・サイズ） | 1 |
| `docs/CONCEPT.md` | 理論↔視覚変換定義。cross-repo報告経路 | 2 |
| `docs/ARCHITECTURE.md` | 技術構成・ファイル依存関係・設計原則 | 2 |
| `docs/PROMPT-STRUCTURE.md` | Gemini向けプロンプトテンプレート | 3 |
| `docs/REVIEW-REPORT.md` | 品質レビュー記録（#7） | 3 |
| `docs/prompts/` | 個別プロンプト履歴（P001–P004） | 3 |

### ソースコード

| ディレクトリ | 内容 |
|--------------|------|
| `src/` | エントリ(main.js), シーン(scene.js), 設定(config.js), カメラ(controls.js), ナビ(navigation.js, nav-objects.js), ビューア(viewer.js), i18n, devパネル |
| `src/shaders/` | GLSL: 背景, 水面, 光(欠損), ポストプロセス, 流体フィールド, 渦, 共有noise |

### テスト・CI

| パス | 内容 |
|------|------|
| `tests/config-consistency.test.js` | 静的解析テスト（Node.js / CI） |
| `tests/e2e-test-design.md` | E2Eテスト設計書 |
| `tests/e2e-runner.js` | ブラウザ注入E2Eランナー |
| `.github/workflows/test.yml` | CI定義（pushトリガー） |

### インフラ

| パス | 内容 |
|------|------|
| `mcp_servers/` | Gemini API連携 (gemini_threejs.py) |
| `scripts/` | MCPセットアップ (setup-mcp.sh) |

ソースコードの詳細な依存関係と設計原則は ARCHITECTURE.md を参照。

---

## 11. 技術スタック

- Three.js 0.160.0（CDN importmap）
- Bootstrap 5.3.3（CDN、devパネル用）
- ES Modules（ビルドツールなし）
- ポート: 3001（ローカル開発）
- デプロイ: GitHub Pages（mainブランチ直接）
- devパネル: `?dev` をURLに付与で表示

---

## 12. 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2026-02-13 | 1.0 | 初版作成。SCOPE.md・WORKFLOW.mdを統合。管理ハブ化 |
| 2026-02-14 | 1.1 | §8 テスト・品質管理を三層体制に改訂。§10 テスト・CIカタログ追加 |
| 2026-02-14 | 1.2 | TODO.md新設に伴い、Tier1にTODO.md追加。§2,§3,§6,§10更新 |
| 2026-02-14 | 1.3 | §7 エージェント呼び出しルール追加。Three.js/GLSLはGemini MCP必須 |
