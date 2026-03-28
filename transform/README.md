# transform/ — 変換層

ドラフト（Markdown）から公開スライド（HTML）への変換パイプラインを管理する。

## 構造

```
transform/
├── README.md          ← 本ファイル
├── rules/             ← 生成ルール（コンテンツの書き方・禁止事項）
│   └── slide-content-rules.md
└── scripts/           ← 生成スクリプト（将来用）
```

## パイプライン

```
構想（docs/CHARTER-guides.md）
    ↓
生成ルール（transform/rules/slide-content-rules.md）
    ↓
ドラフト執筆（content/guides/*.md）— transform/rich-slides で生成
    ↓
HTML生成（scripts/generate-rich-slides.py）
    ↓
表示（src/slide-viewer.js → iframe）
```

## スキル実行の原則

**重要なスキルはサブエージェントまたはエージェントチームで実行する。**

| スキル | 実行方式 | 理由 |
|---|---|---|
| `transform/rich-slides/SKILL.md` | エージェントチーム | ドラフト執筆 + HTML生成 + 品質チェックを分離 |
| 品質レビュー | サブエージェント | 生成者と検証者を分離（3層QA） |

エージェントチーム構成例:
1. **ドラフトエージェント**: 生成ルールに従い Markdown を執筆
2. **生成エージェント**: `generate-rich-slides.py` で HTML 化
3. **レビューエージェント**: ルール違反チェック（内部記号、自己啓発調 等）
