# Better Search Replace Plural

Better Search Replace v1.4.10 に「**複数ペア一括置換**」機能を追加するパッチファイル群です。

通常の Better Search Replace は検索/置換の入力欄が1組だけですが、このパッチを適用すると複数のペアをまとめて一度に実行できるようになります。ペアの保存・読み込みに対応した Import/Export 機能も追加されます。

![screenshot-1](assets/screenshot-1.png)
![screenshot-2](assets/screenshot-2.png)
![screenshot-3](assets/screenshot-3.png)

## 動作要件

- WordPress 5.0+
- [Better Search Replace](https://wordpress.org/plugins/better-search-replace/) **v1.4.10**（他のバージョンでは動作を保証しません）
- PHP 7.4+

## 適用方法

1. WordPress に Better Search Replace v1.4.10 を通常インストール
2. このリポジトリの `plugin/better-search-replace/` 以下のファイルを、`wp-content/plugins/better-search-replace/` に上書きコピー

```bash
cp -r plugin/better-search-replace/* /path/to/wp-content/plugins/better-search-replace/
```

> ⚠️ **注意**: 本パッチはデータベースを直接書き換えます。適用前に必ずバックアップを取得してください。

## 追加機能

### 複数ペア一括置換

- 「+ Add Pair」ボタンで検索/置換ペアを追加
- 各ペアは個別に削除可能
- Dry Run 後もペアが復元される

### Import / Export

- **Export Pairs**: 画面のペアを JSON ファイルとしてダウンロード（ファイル名: `bsr-pairs-YYYYMMDDHHMMSS.json`）
- **Import Pairs**: JSON ファイルを読み込んでペアを復元
- 全処理クライアントサイド完結（サーバー往復なし）

Export されるファイルの形式:

```json
{
  "format": "bsr-pairs",
  "version": 1,
  "exported_at": "2026-04-17T12:34:56.789Z",
  "pairs": [
    { "search_for": "https://old.example.com", "replace_with": "https://new.example.com" },
    { "search_for": "old-name", "replace_with": "new-name" }
  ]
}
```

## 変更ファイル一覧

### PHP（4ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `better-search-replace.php` | Plugin Name / Version / BSR_NAME リネーム |
| `includes/class-bsr-admin.php` | ペア UI 用スクリプト変数追加、`prefill_value()` 配列対応、`get_prefill_pairs_json()` 新設、Import/Export 用ローカライズ文字列追加 |
| `includes/class-bsr-ajax.php` | `search_for[]` / `replace_with[]` 配列パース、ペア構築、ペア別レポート集約 |
| `includes/class-bsr-db.php` | `apply_pairs()` ヘルパー追加、`srdb()` 2箇所を `apply_pairs()` に置換 |

### テンプレート（1ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `templates/bsr-search-replace.php` | 単一入力 → ペアコンテナ UI（`#bsr-pairs-container`、動的追加/削除）、Import/Export ツールバー追加 |

### JS / CSS（4ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `assets/js/better-search-replace.js` | ペア追加/削除/番号更新、DOM 安全生成、バリデーション、Import/Export 機能 |
| `assets/js/better-search-replace.min.js` | 上記の minified 版 |
| `assets/css/better-search-replace.css` | ペア管理 UI の CSS 追加（末尾約 80 行） |
| `assets/css/better-search-replace.min.css` | 上記の minified 版 |

> **注意**: `.min.js` / `.min.css` は必須です。WordPress は `SCRIPT_DEBUG` が未定義の場合、minified 版を優先的に読み込みます。

## BSR 本体アップデート時の追従手順

Better Search Replace がアップデートした場合、以下の手順でパッチをマージしてください。

1. BSR 新バージョンのリリースノートを確認
2. 上記ファイルについて、新バージョンとの差分を確認:
   ```bash
   diff original/better-search-replace/<file> <new-version>/<file>
   ```
3. 本体側の変更をパッチファイルにマージ
4. JS/CSS を変更した場合は minified 版を再生成:
   ```bash
   npx terser assets/js/better-search-replace.js --compress --mangle -o assets/js/better-search-replace.min.js
   npx clean-css-cli -o assets/css/better-search-replace.min.css assets/css/better-search-replace.css
   ```
5. 動作確認

## 設計上の注意点

- **trim 禁止**: 検索/置換文字列に trim を適用しない（スペース消失防止）
- **空 replace_with 許容**: 空文字での置換（＝削除）は正当な操作
- **ペア ID**: カウンター増加のみ、リセット禁止（ID 重複防止）
- **DOM 生成**: innerHTML 禁止、createElement + textContent 使用（XSS 防止）
- **Text Domain**: `better-search-replace` を維持（既存翻訳互換）

## ベースバージョン

- Better Search Replace: **v1.4.10**
- パッチバージョン: **v1.4.10r**

## License

GPL-2.0. Based on [Better Search Replace](https://wordpress.org/plugins/better-search-replace/) by WP Engine, licensed under GPL-2.0.