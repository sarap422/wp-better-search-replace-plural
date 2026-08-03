<?php
/**
 * Displays the main "Search/Replace" tab.
 *
 * @link       https://bettersearchreplace.com
 * @since      1.1
 *
 * @package    Better_Search_Replace
 * @subpackage Better_Search_Replace/templates
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Prevent direct/unauthorized access.
if ( ! defined( 'BSR_PATH' ) ) exit;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
$bsr_assets = plugin_dir_url( __FILE__ ) . '../assets/svg/';
$bsr_guid_doc = 'https://wordpress.org/documentation/article/changing-the-site-url/#important-guid-note';
// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
?>

<div id="bsr-search-replace-wrap" class="postbox">

	<div class="ui-sidebar-wrapper">

		<div class="inside">

			<div id="bsr-search-replace-form" class="form-table">
			<!--Hidden and to trigger the dry run notice placement-->
			<h2 class="hidden"><?php esc_html_e( 'Dry Run Notice', 'better-search-replace' ); ?></h2>

			<!--Search/Replace Panel-->
			<div class="panel">

				<div class="panel-header">
					<h3><?php esc_html_e( 'Search/Replace', 'better-search-replace' ); ?></h3>
					<a href="#" class="tooltip">
						<img src="<?php echo esc_url( $bsr_assets . 'icon-help.svg' ); ?>" alt="">
					</a>
					<span class="helper-message left">
						<?php esc_html_e( 'Search and replace text in the database, including serialized arrays and objects. Be sure to back up your database before running this process.', 'better-search-replace' ); ?>
					</span>
				</div>

				<div class="panel-content">

					<!--Pairs Toolbar (Import/Export)-->
					<div class="bsr-pairs-toolbar">
						<button type="button" id="bsr-import-pairs" class="button"><?php esc_html_e( 'Import Pairs', 'better-search-replace' ); ?></button>
						<button type="button" id="bsr-export-pairs" class="button"><?php esc_html_e( 'Export Pairs', 'better-search-replace' ); ?></button>
						<input type="file" id="bsr-import-file" accept=".json,application/json" hidden />
					</div>

					<!--Search/Replace Pairs Container-->
					<div id="bsr-pairs-container">

						<div class="bsr-pair" data-pair-index="0">
							<div class="bsr-pair-header">
								<span class="bsr-pair-number">#1</span>
								<button type="button" class="bsr-remove-pair" title="<?php esc_attr_e( 'Remove this pair', 'better-search-replace' ); ?>">&times;</button>
							</div>
							<div class="row search-replace">
								<div class="input-text full-width">
									<label><strong><?php esc_html_e( 'Search for', 'better-search-replace' ); ?></strong></label>
									<input type="text" name="search_for[]" class="regular-text bsr-search-input" value="<?php BSR_Admin::prefill_value( 'search_for', 'text', 0 ); ?>" />
								</div>

								<div class="input-text full-width">
									<label><strong><?php esc_html_e( 'Replace with', 'better-search-replace' ); ?></strong></label>
									<input type="text" name="replace_with[]" class="regular-text bsr-replace-input" value="<?php BSR_Admin::prefill_value( 'replace_with', 'text', 0 ); ?>" />
								</div>
							</div>
						</div>

					</div>

					<button type="button" id="bsr-add-pair" class="button"><?php esc_html_e( '+ Add Pair', 'better-search-replace' ); ?></button>
					<p class="description bsr-pair-note"><?php esc_html_e( 'Pairs are applied sequentially from top to bottom.', 'better-search-replace' ); ?></p>

					<script>var bsrPrefillPairs = <?php echo BSR_Admin::get_prefill_pairs_json(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON encoded with JSON_HEX_* flags in get_prefill_pairs_json(). ?>;</script>

					<!--Tables-->
					<div class="row">
						<div class="col full-width tables">
							<label for="select_tables"><strong><?php esc_html_e( 'Select tables', 'better-search-replace' ); ?></strong></label>
								<?php BSR_Admin::load_tables(); ?>
								<p class="description"><?php esc_html_e( 'Select multiple tables with Ctrl-Click for Windows or Cmd-Click for Mac.', 'better-search-replace' ); ?></p>
							</div>
					</div>

				</div>
			</div>


			<!--Additional Settings Panel-->
			<div class="panel">

				<div class="panel-header">
					<h3><?php esc_html_e( 'Additional Settings', 'better-search-replace' ); ?></h3>
				</div>

				<div class="panel-content settings additional-settings">

				<!--Case Sensitive-->
				<label for="case_insensitive" class="row">
					<div class="col">
						<input id="case_insensitive" type="checkbox" name="case_insensitive" <?php BSR_Admin::prefill_value( 'case_insensitive', 'checkbox' ); ?> />
					</div>
					<div class="col">
						<label for="case_insensitive"><strong><?php esc_html_e( 'Case-Insensitive', 'better-search-replace' ); ?></strong></label>
						<label for="case_insensitive"><span class="description"><?php esc_html_e( 'Searches are case-sensitive by default.', 'better-search-replace' ); ?></span></label>
					</div>
				</label>

				 <!--Replace GUIDs-->
				 <label for="replace_guids" class="row">
					<div class="col">
						<input id="replace_guids" type="checkbox" name="replace_guids" <?php BSR_Admin::prefill_value( 'replace_guids', 'checkbox' ); ?> />
					</div>
					<div class="col">
					  <label for="replace_guids" class="replace_guids"><strong><?php esc_html_e( 'Replace GUIDs', 'better-search-replace' ); ?></strong><a href="<?php echo esc_url( $bsr_guid_doc ); ?>" target="_blank" rel="noopener noreferrer"><img src="<?php echo esc_url( $bsr_assets . 'icon-help.svg' ); ?>" alt=""></a></label>
						<label for="replace_guids"><span class="description"><?php esc_html_e( 'If left unchecked, all database columns titled \'guid\' will be skipped.', 'better-search-replace' ); ?></span></label>
					</div>
				</label>

				<!--Dry Run-->
				<label for="dry_run" class="row">
					<div class="col">
						<input id="dry_run" type="checkbox" name="dry_run" checked />
					</div>
					<div class="col">
						<label for="dry_run"><strong><?php esc_html_e( 'Run as dry run', 'better-search-replace' ); ?></strong></label>
						<label for="dry_run"><span class="description"><?php esc_html_e( 'If checked, no changes will be made to the database, allowing you to check the results beforehand.', 'better-search-replace' ); ?></span></label>
					</div>
				</label>

			</div>
		</div>
	        <div id="bsr-error-wrap"></div>
			<!--Submit Button-->
			<div id="bsr-submit-wrap">
				<?php wp_nonce_field( 'process_search_replace', 'bsr_nonce' ); ?>
				<input type="hidden" name="action" value="bsr_process_search_replace" />
				<button id="bsr-submit" type="submit" class="button button-primary button-lg"><?php esc_html_e( 'Run Search/Replace', 'better-search-replace' ); ?>
					<img src="<?php echo esc_url( $bsr_assets . 'icon-arrow.svg' ); ?>" alt="">
				</button>
			</div>
		</div>

	</div>

	<?php
	if ( file_exists( BSR_PATH . 'templates/sidebar.php' ) ) {
		include_once BSR_PATH . 'templates/sidebar.php';
	}
	?>

	<!-- /.ui-sidebar-wrapper -->
	</div>

</div><!-- /#bsr-search-replace-wrap -->
