# docs/README.md — プロジェクト管理ハブ

**バージョン**: 1.0
**更新日**: 2026-02-13

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
| 3 | `docs/CONCEPT.md` | 必要時のみ |

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
| 1 | README.md, CURRENT.md | セッション開始時に必ず |
| 2 | CONCEPT.md, ARCHITECTURE.md | タスクに応じて |
| 3 | PROMPT-STRUCTURE.md, REVIEW-REPORT.md, prompts/ | Gemini作業時のみ |

---

## 7. Claude × Gemini 分業体制

| 役割 | 担当 | 強み |
|------|------|------|
| マネージャー | Claude | コンテキスト把握、複数ファイル管理、要件整理 |
| プログラマー | Gemini | シェーダー、視覚的品質の高いThree.jsコード |

**Geminiはユーザーが明示した時のみ使用する。自動呼び出しはしない。**

MCPツール・セットアップの技術詳細は ARCHITECTURE.md を参照。

---

## 8. 品質・テスト

### 現行テスト

```bash
node tests/config-consistency.test.js
```

設定値の整合性（config → shader → dev-panel）を自動検証。

### Chromeベーステスト（目標）

Three.jsの視覚的品質検証には、実際のブラウザ上でのテストが不可欠。
Claude in Chrome MCPを活用したテストスイートを整備する。

目標とする検証項目：

| カテゴリ | 検証内容 |
|----------|----------|
| 描画 | ページロード後にcanvasが描画されているか |
| ナビ | 鬼火オーブが表示され、クリックでPDFビューアーが開くか |
| UI | タイトル・クレジット・言語トグルが表示されるか |
| 言語 | `?lang=en` で英語切替が動作するか |
| モバイル | レスポンシブ表示、タッチ操作 |
| コンソール | JSエラーがないか |
| パフォーマンス | 極端なフレーム落ちがないか |

実装方法：スキルファイルまたはテストスイートとして整備予定。

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
| `docs/CURRENT.md` | 進捗・タスク・決定事項 | 1 |
| `docs/CONCEPT.md` | 理論↔視覚変換定義。cross-repo報告経路 | 2 |
| `docs/ARCHITECTURE.md` | 技術構成・ファイル依存関係・設計原則 | 2 |
| `docs/PROMPT-STRUCTURE.md` | Gemini向けプロンプトテンプレート | 3 |
| `docs/REVIEW-REPORT.md` | 品質レビュー記録（#7） | 3 |
| `docs/prompts/` | 個別プロンプト履歴（P001–P004） | 3 |

### ソースコード

| ディレクトリ | 内容 |
|--------------|------|
| `src/` | エントリ(main.js), シーン(scene.js), 設定(config.js), カメラ(controls.js), ナビ(navigation.js, nav-objects.js), ビューア(viewer.js), i18n, devパネル |
| `src/shaders/` | GLSL: 背景, 水面, 光(欠損), ポストプロセス, 流体フィールド, 共有noise |
| `tests/` | 設定値整合性テスト (config-consistency.test.js) |
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
