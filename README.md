# Better Search Replace Plural - Patch Files

Better Search Replace v1.4.10 に「複数ペア一括置換」機能を追加するパッチファイル群です。

## 適用方法

1. WordPress に Better Search Replace v1.4.10 を通常インストール
2. このディレクトリ内のファイルを `wp-content/plugins/better-search-replace/` に上書きコピー

```bash
cp -r plugin/better-search-replace/* /path/to/wp-content/plugins/better-search-replace/
```

## 変更ファイル一覧

### PHP（4ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `better-search-replace.php` | Plugin Name/Version/BSR_NAME リネーム |
| `includes/class-bsr-admin.php` | ペアUI用スクリプト変数追加、`prefill_value()` 配列対応、`get_prefill_pairs_json()` 新設 |
| `includes/class-bsr-ajax.php` | `search_for[]` / `replace_with[]` 配列パース、ペア構築、ペア別レポート集約 |
| `includes/class-bsr-db.php` | `apply_pairs()` ヘルパー追加、`srdb()` 2箇所を `apply_pairs()` に置換 |

### テンプレート（1ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `templates/bsr-search-replace.php` | 単一入力 → ペアコンテナUI（`#bsr-pairs-container`、動的追加/削除） |

### JS / CSS（4ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `assets/js/better-search-replace.js` | ペア追加/削除/番号更新、DOM安全生成、バリデーション |
| `assets/js/better-search-replace.min.js` | 上記のminified版 |
| `assets/css/better-search-replace.css` | ペア管理UIのCSS追加（末尾約80行） |
| `assets/css/better-search-replace.min.css` | 上記のminified版 |

**注意**: `.min.js` / `.min.css` は必須です。WordPressは `SCRIPT_DEBUG` が未定義の場合、minified版を優先的に読み込みます。

## 各ファイルの変更詳細

### `better-search-replace.php`
- Plugin Name: `Better Search Replace` → `Better Search Replace Plural`
- Version: `1.4.10` → `1.5.0`
- `BSR_NAME` 定数: `'better-search-replace'` → `'better-search-replace-plural'`

### `includes/class-bsr-admin.php`
- `wp_localize_script()` に `label_search`, `label_replace`, `remove_pair` 文字列を追加
- バリデーションメッセージを「At least one search string must be defined.」に変更
- 結果メッセージにペア数表示を追加
- `prefill_value()` メソッドに第3引数 `$index` を追加（配列対応）
- `get_prefill_pairs_json()` メソッドを新設（Dry Run後のペア復元用）

### `includes/class-bsr-ajax.php`
- `search_for[]`, `replace_with[]` 配列形式の受け取りに対応
- 文字列形式との後方互換あり（単一値を配列に正規化）
- 空の検索文字列をスキップするバリデーション追加
- `$args['pairs']` 配列を構築して `srdb()` に渡す
- `append_report()` でペア別レポート集約

### `includes/class-bsr-db.php`
- L194-208: pairs配列のバックスラッシュデコード
- L267: siteurl処理パスで `apply_pairs()` 呼出
- L288: 通常処理パスで `apply_pairs()` 呼出
- L336-347: `apply_pairs()` private メソッド定義

### `templates/bsr-search-replace.php`
- `#bsr-pairs-container` でペアを動的管理
- `name="search_for[]"` / `name="replace_with[]"` 配列記法
- ペア番号表示、削除ボタン（`:only-child` 時CSS非表示）
- 「+ Add Pair」ボタン
- Dry Run後のprefill復元スクリプト

### `assets/js/better-search-replace.js`
- `bsrPairCounter`: ペアID管理（増加のみ、リセットなし）
- `bsr_init_pairs()`: Add Pair / Remove Pair イベントハンドラ
- `bsr_create_pair_element()`: DOM安全生成（createElement + textContent）
- `bsr_update_pair_numbers()`: 削除後の番号振り直し
- バリデーション: 「少なくとも1つの検索文字列」チェック

### `assets/css/better-search-replace.css`
- `.bsr-pair` コンテナ、ヘッダ、番号表示
- `.bsr-remove-pair` 削除ボタン（`:only-child` 非表示制御）
- `#bsr-add-pair` 追加ボタン
- `.bsr-pair-note` 注記テキスト

## BSR本体アップデート時の追従手順

1. BSR新バージョンのリリースノートを確認
2. 上記ファイルについて、新バージョンとの差分を確認:
   ```bash
   diff original/better-search-replace/<file> <new-version>/<file>
   ```
3. 本体側の変更をパッチファイルにマージ
4. JS/CSSを変更した場合はminified版を再生成:
   ```bash
   npx terser assets/js/better-search-replace.js --compress --mangle -o assets/js/better-search-replace.min.js
   npx clean-css-cli -o assets/css/better-search-replace.min.css assets/css/better-search-replace.css
   ```
5. 動作確認

## 設計上の注意点

- **trim禁止**: 検索/置換文字列にtrimを適用しない（スペース消失防止）
- **空replace_with許容**: 空文字での置換（＝削除）は正当な操作
- **ペアID**: カウンター増加のみ、リセット禁止（ID重複防止）
- **DOM生成**: innerHTML禁止、createElement + textContent使用（XSS防止）
- **Text Domain**: `better-search-replace` を維持（既存翻訳互換）

## ベースバージョン

- Better Search Replace: **v1.4.10**
- パッチバージョン: **v1.5.0**
