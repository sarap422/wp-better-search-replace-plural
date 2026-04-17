# 設計: 複数ペア一括置換 設定のエクスポート/インポート

- **タスク**: 0417.1
- **日付**: 2026-04-17
- **対象**: Better Search Replace Plural v1.5.0 →（パッチ拡張）

## 1. 目的

「複数ペア一括置換」の検索/置換ペア設定をJSONファイルに保存し、別環境や別タイミングで読み込めるようにする。
主用途はサイト引っ越し時のペア再利用（同じペアセットを別環境で繰り返し実行）。

## 2. スコープ

### In Scope
- ペアのJSONファイルへのエクスポート（クライアントサイド download）
- JSONファイルからのインポート（クライアントサイド read + 画面復元）
- 既存ペア入力時のスマート置換（空のみ→無確認、入力あり→確認）
- 入力バリデーション（拡張子、JSONパース、構造、ペア配列の存在）

### Out of Scope
- DB保存（プリセット機能は将来検討）
- サーバーAPI / AJAXエンドポイント（不要、すべてクライアントで完結）
- バージョン1以外のJSONフォーマット対応（将来の拡張余地として `format` / `version` フィールドのみ持たせる）
- ペア数の上限制限

## 3. JSON フォーマット

```json
{
  "format": "bsr-pairs",
  "version": 1,
  "exported_at": "2026-04-17T12:00:00",
  "pairs": [
    { "search_for": "https://old.example.com", "replace_with": "https://new.example.com" },
    { "search_for": "old-name", "replace_with": "new-name" }
  ]
}
```

- `format`: 固定値 `"bsr-pairs"`（不一致時は警告のみ、構造が合えば許容）
- `version`: 整数（現在 `1`、将来の互換性チェック用）
- `exported_at`: ISO 8601 ローカルタイム（情報用、必須でない）
- `pairs`: ペア配列（必須）。各要素は `search_for`（必須・string）、`replace_with`（任意・string、省略時は空文字）

## 4. UI 設計

### 配置
- パネル `<div class="panel-content">` 内、`#bsr-pairs-container` の **直上** に配置
- 横一列のツールバー（右寄せ）

### マークアップ
```html
<div class="bsr-pairs-toolbar">
  <button type="button" id="bsr-import-pairs" class="button">Import Pairs</button>
  <button type="button" id="bsr-export-pairs" class="button">Export Pairs</button>
  <input type="file" id="bsr-import-file" accept=".json,application/json" hidden>
</div>
```

### 操作フロー

**Export:**
1. ユーザーが `Export Pairs` をクリック
2. 画面のペアから `search_for` が空でないものを収集
3. 0件の場合 → エラー表示（`#bsr-error-wrap`）「No pairs to export.」
4. 1件以上 → JSON生成 → Blob → `<a download>` で自動ダウンロード
5. ファイル名: `bsr-pairs-YYYYMMDDHHMMSS.json`

**Import:**
1. ユーザーが `Import Pairs` をクリック → 隠し `<input type="file">` を click()
2. ファイル選択 → FileReader で読み込み
3. 拡張子 `.json` 以外 → エラー
4. JSONパース失敗 → エラー
5. `pairs` 配列がない → エラー
6. 有効ペアが0件 → エラー
7. 既存ペアに入力あり → `confirm()` で確認、キャンセル時は中止
8. 既存ペアを全削除 → 新規ペアを順次挿入 → 番号振り直し
9. 成功時 → エラー表示クリア

## 5. エラーハンドリング

| エラー | メッセージ | 対応 |
|---|---|---|
| Export時、ペアが空 | "No pairs to export. Please enter at least one search string." | エラー表示、処理中止 |
| ファイル拡張子不正 | "Please select a .json file." | エラー表示、処理中止 |
| JSONパース失敗 | "Invalid JSON file. Could not parse." | エラー表示、処理中止 |
| 構造不正（pairs配列なし） | "Invalid file format. Missing 'pairs' array." | エラー表示、処理中止 |
| 有効ペア0件 | "No valid pairs found in the file." | エラー表示、処理中止 |
| FileReader失敗 | "Failed to read the file." | エラー表示、処理中止 |
| 既存ペアあり | "Replace existing pairs with imported data?" | confirm() ダイアログ、キャンセル時は中止 |

エラー表示は既存の `#bsr-error-wrap` を流用し、UI統一感を保つ。

## 6. セキュリティ考慮

- **XSS対策**: ペア値はすべて `createElement` + `value` 代入経由で挿入（既存パターン P006 準拠）。`innerHTML` は使用しない
- **権限**: 管理画面（`manage_options`）内なので、悪意ある入力は前提にしない。バリデーションは誤操作防止が主目的
- **CSP対応**: `Blob` + `URL.createObjectURL` 使用、外部リソース不要
- **サーバーサイド処理なし**: AJAX往復なし、PHPコード変更は文字列ローカライズのみ

## 7. 変更ファイル一覧

| ファイル | 種別 | 変更内容 |
|---|---|---|
| `plugin/better-search-replace/templates/bsr-search-replace.php` | テンプレート | ツールバーHTML追加（4行） |
| `plugin/better-search-replace/assets/js/better-search-replace.js` | JS | export/import関数追加（約120行） |
| `plugin/better-search-replace/assets/js/better-search-replace.min.js` | JS（生成） | terserで再生成 |
| `plugin/better-search-replace/assets/css/better-search-replace.css` | CSS | `.bsr-pairs-toolbar` スタイル追加（約15行） |
| `plugin/better-search-replace/assets/css/better-search-replace.min.css` | CSS（生成） | clean-css-cliで再生成 |
| `plugin/better-search-replace/includes/class-bsr-admin.php` | PHP | `wp_localize_script` にメッセージ追加（7文字列） |
| `README.md` | ドキュメント | 機能説明・JSONフォーマット例追加 |

## 8. テスト計画

### 単体動作確認（ブラウザでの手動テスト）
1. **Export 正常系**: 3ペア入力 → Export → ファイル名 `bsr-pairs-YYYYMMDDHHMMSS.json` でダウンロード、内容確認
2. **Export 空ペア除外**: 5ペア中 search_for 空のものが2つ → 出力は3ペアのみ
3. **Export 全空エラー**: 空ペアのみ → エラー表示
4. **Import 正常系（空状態）**: ペア1個（空）→ Import → ペアが置換、確認ダイアログなし
5. **Import 正常系（入力あり）**: ペア入力済み → Import → 確認ダイアログ → OK で置換
6. **Import キャンセル**: 入力ありの状態で Import → 確認ダイアログ → Cancel で既存維持
7. **Import 不正拡張子**: `.txt` ファイル選択 → エラー
8. **Import 不正JSON**: 壊れたJSON → エラー
9. **Import 構造不正**: `{"foo": "bar"}` → エラー
10. **Round-trip**: Export → Import → 同じ内容に復元
11. **特殊文字**: バックスラッシュ・改行・引用符を含むペア → Export → Import で完全復元
12. **Re-import 同一ファイル**: 同じファイルを2回連続選択 → 2回目も発火する（input.value リセット必須）

### シンタックスチェック
```bash
php -l plugin/better-search-replace/includes/class-bsr-admin.php
php -l plugin/better-search-replace/templates/bsr-search-replace.php
node -c plugin/better-search-replace/assets/js/better-search-replace.js  # syntax check
```

### Minified版生成
```bash
npx terser assets/js/better-search-replace.js --compress --mangle --source-map -o assets/js/better-search-replace.min.js
npx clean-css-cli -o assets/css/better-search-replace.min.css assets/css/better-search-replace.css
```

## 9. ロールバック計画

- すべてのファイル変更は git で追跡
- 問題発生時は `git revert` で元に戻せる
- DBスキーマ変更なし、トランジェント変更なし、本体APIへの破壊的変更なし

## 10. 既存設計原則との整合性

- **P004（trim禁止・空文字許容）**: import/export 両方で値を加工しない
- **P005（ペアID増加のみ）**: 既存の `bsrPairCounter` をそのまま使用、リセットしない
- **P006（DOM安全生成）**: `bsr_create_pair_element` を流用、innerHTML禁止
- **YAGNI**: DB保存・プリセット機能は対象外
