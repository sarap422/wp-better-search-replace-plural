(function( $ ) {
	'use strict';

	/**
	 * Pair counter: only increments, never resets.
	 * Pair 0 is rendered by PHP. This starts at 1 for dynamically added pairs.
	 */
	var bsrPairCounter = 1;

	/**
	 * Initializes our event handlers.
	 */
	function bsr_init() {
		bsr_init_pairs();
		bsr_init_import_export();
		bsr_search_replace();
		bsr_update_sliders();
		bsr_thickbox_fix();
	}

	/**
	 * Initializes pair add/remove handlers and restores prefilled pairs.
	 */
	function bsr_init_pairs() {

		// Add Pair button
		$( '#bsr-add-pair' ).on( 'click', function() {
			var newIndex = bsrPairCounter++;
			var pairEl = bsr_create_pair_element( newIndex );
			$( '#bsr-pairs-container' ).append( pairEl );
			bsr_update_pair_numbers();
		});

		// Remove Pair button (event delegation for dynamically added elements)
		$( '#bsr-pairs-container' ).on( 'click', '.bsr-remove-pair', function() {
			$( this ).closest( '.bsr-pair' ).remove();
			bsr_update_pair_numbers();
		});

		// Restore prefilled pairs from previous run (pairs 1..N)
		if ( typeof bsrPrefillPairs !== 'undefined' && bsrPrefillPairs.length > 1 ) {
			for ( var i = 1; i < bsrPrefillPairs.length; i++ ) {
				var idx = bsrPairCounter++;
				var el = bsr_create_pair_element( idx );
				$( '#bsr-pairs-container' ).append( el );
				var $pair = $( '#bsr-pairs-container .bsr-pair' ).last();
				$pair.find( '.bsr-search-input' ).val( bsrPrefillPairs[i].search_for );
				$pair.find( '.bsr-replace-input' ).val( bsrPrefillPairs[i].replace_with );
			}
			bsr_update_pair_numbers();
		}
	}

	/**
	 * Creates a new pair DOM element using safe createElement (no innerHTML with user data).
	 */
	function bsr_create_pair_element( index ) {
		// Pair wrapper
		var pair = document.createElement( 'div' );
		pair.className = 'bsr-pair';
		pair.setAttribute( 'data-pair-index', index );

		// Header row
		var header = document.createElement( 'div' );
		header.className = 'bsr-pair-header';

		var number = document.createElement( 'span' );
		number.className = 'bsr-pair-number';
		number.textContent = '#' + ( index + 1 );

		var deleteBtn = document.createElement( 'button' );
		deleteBtn.type = 'button';
		deleteBtn.className = 'bsr-remove-pair';
		deleteBtn.textContent = '×'; // ×
		deleteBtn.title = bsr_object_vars.remove_pair || 'Remove this pair';

		header.appendChild( number );
		header.appendChild( deleteBtn );

		// Search/Replace row
		var row = document.createElement( 'div' );
		row.className = 'row search-replace';

		// Search input container
		var searchDiv = document.createElement( 'div' );
		searchDiv.className = 'input-text full-width';
		var searchLabel = document.createElement( 'label' );
		var searchStrong = document.createElement( 'strong' );
		searchStrong.textContent = bsr_object_vars.label_search || 'Search for';
		searchLabel.appendChild( searchStrong );
		var searchInput = document.createElement( 'input' );
		searchInput.type = 'text';
		searchInput.name = 'search_for[]';
		searchInput.className = 'regular-text bsr-search-input';
		searchDiv.appendChild( searchLabel );
		searchDiv.appendChild( searchInput );

		// Replace input container
		var replaceDiv = document.createElement( 'div' );
		replaceDiv.className = 'input-text full-width';
		var replaceLabel = document.createElement( 'label' );
		var replaceStrong = document.createElement( 'strong' );
		replaceStrong.textContent = bsr_object_vars.label_replace || 'Replace with';
		replaceLabel.appendChild( replaceStrong );
		var replaceInput = document.createElement( 'input' );
		replaceInput.type = 'text';
		replaceInput.name = 'replace_with[]';
		replaceInput.className = 'regular-text bsr-replace-input';
		replaceDiv.appendChild( replaceLabel );
		replaceDiv.appendChild( replaceInput );

		row.appendChild( searchDiv );
		row.appendChild( replaceDiv );

		pair.appendChild( header );
		pair.appendChild( row );

		return pair;
	}

	/**
	 * Updates pair numbers (#1, #2, ...) after add/remove.
	 */
	function bsr_update_pair_numbers() {
		$( '#bsr-pairs-container .bsr-pair' ).each( function( i ) {
			$( this ).find( '.bsr-pair-number' ).text( '#' + ( i + 1 ) );
		});
	}

	/**
	 * Displays an error message in the standard error wrap.
	 */
	function bsr_show_error( msg ) {
		$( '#bsr-error-wrap' ).html( '<div class="error"><p></p></div>' ).show();
		$( '#bsr-error-wrap p' ).text( msg );
	}

	/**
	 * Builds a YYYYMMDDHHMMSS timestamp for export filenames.
	 */
	function bsr_build_timestamp() {
		var d = new Date();
		var pad = function( n ) { return ( n < 10 ? '0' : '' ) + n; };
		return d.getFullYear() +
			pad( d.getMonth() + 1 ) +
			pad( d.getDate() ) +
			pad( d.getHours() ) +
			pad( d.getMinutes() ) +
			pad( d.getSeconds() );
	}

	/**
	 * Initializes Import/Export button handlers.
	 */
	function bsr_init_import_export() {

		$( '#bsr-export-pairs' ).on( 'click', function() {
			bsr_export_pairs();
		});

		$( '#bsr-import-pairs' ).on( 'click', function() {
			// Reset value so re-selecting the same file fires change event.
			$( '#bsr-import-file' ).val( '' ).trigger( 'click' );
		});

		$( '#bsr-import-file' ).on( 'change', function( e ) {
			var file = e.target.files && e.target.files[0];
			if ( ! file ) { return; }
			bsr_import_pairs( file );
		});
	}

	/**
	 * Collects current pairs from DOM and triggers a JSON file download.
	 * Empty search_for pairs are excluded. DOES NOT trim values (P004).
	 */
	function bsr_export_pairs() {
		var pairs = [];
		$( '.bsr-pair' ).each( function() {
			var search  = $( this ).find( '.bsr-search-input' ).val();
			var replace = $( this ).find( '.bsr-replace-input' ).val();
			// Empty search_for is the only filter (replace_with empty = deletion is valid).
			if ( typeof search === 'string' && search !== '' ) {
				pairs.push({
					search_for:   search,
					replace_with: typeof replace === 'string' ? replace : ''
				});
			}
		});

		if ( pairs.length === 0 ) {
			bsr_show_error( bsr_object_vars.export_empty );
			return;
		}

		// Clear any previous error.
		$( '#bsr-error-wrap' ).html( '' ).hide();

		var payload = {
			format:      'bsr-pairs',
			version:     1,
			exported_at: new Date().toISOString(),
			pairs:       pairs
		};

		var json = JSON.stringify( payload, null, 2 );
		var blob = new Blob( [ json ], { type: 'application/json' } );
		var url  = URL.createObjectURL( blob );

		var a = document.createElement( 'a' );
		a.href     = url;
		a.download = 'bsr-pairs-' + bsr_build_timestamp() + '.json';
		document.body.appendChild( a );
		a.click();
		document.body.removeChild( a );

		// Free memory after a tick (some browsers need the click to register first).
		setTimeout( function() { URL.revokeObjectURL( url ); }, 0 );
	}

	/**
	 * Imports pairs from a user-selected JSON file.
	 * Validates structure, prompts on existing input, then replaces pairs.
	 */
	function bsr_import_pairs( file ) {

		// Extension check (case-insensitive).
		if ( ! /\.json$/i.test( file.name ) ) {
			bsr_show_error( bsr_object_vars.import_invalid_ext );
			return;
		}

		var reader = new FileReader();

		reader.onload = function( e ) {
			var data;
			try {
				data = JSON.parse( e.target.result );
			} catch ( err ) {
				bsr_show_error( bsr_object_vars.import_parse_error );
				return;
			}

			if ( ! data || ! Array.isArray( data.pairs ) ) {
				bsr_show_error( bsr_object_vars.import_invalid_struct );
				return;
			}

			// Filter to valid pairs (search_for must be a string; empty string is invalid).
			var validPairs = [];
			for ( var i = 0; i < data.pairs.length; i++ ) {
				var p = data.pairs[i];
				if ( p && typeof p.search_for === 'string' && p.search_for !== '' ) {
					validPairs.push({
						search_for:   p.search_for,
						replace_with: typeof p.replace_with === 'string' ? p.replace_with : ''
					});
				}
			}

			if ( validPairs.length === 0 ) {
				bsr_show_error( bsr_object_vars.import_no_pairs );
				return;
			}

			// Smart replace: confirm only when user has typed something.
			var hasInput = false;
			$( '.bsr-pair' ).each( function() {
				var s = $( this ).find( '.bsr-search-input' ).val();
				var r = $( this ).find( '.bsr-replace-input' ).val();
				if ( s || r ) {
					hasInput = true;
					return false; // break
				}
			});

			if ( hasInput && ! window.confirm( bsr_object_vars.import_confirm ) ) {
				return;
			}

			// Replace all pairs.
			$( '#bsr-pairs-container' ).empty();
			for ( var j = 0; j < validPairs.length; j++ ) {
				var idx = bsrPairCounter++;
				var el  = bsr_create_pair_element( idx );
				$( '#bsr-pairs-container' ).append( el );
				var $pair = $( '#bsr-pairs-container .bsr-pair' ).last();
				$pair.find( '.bsr-search-input' ).val( validPairs[j].search_for );
				$pair.find( '.bsr-replace-input' ).val( validPairs[j].replace_with );
			}
			bsr_update_pair_numbers();

			// Clear errors on success.
			$( '#bsr-error-wrap' ).html( '' ).hide();
		};

		reader.onerror = function() {
			bsr_show_error( bsr_object_vars.import_read_error );
		};

		reader.readAsText( file );
	}

	/**
	 * Builds the custom admin URL with a valid bsr-ajax query value.
	 *
	 * @param {string} action Admin action to be passed as a query arg to endpoint.
	 */
	function bsr_ajax_url( action ) {
		var base = bsr_object_vars.endpoint;
		return base + ( base.indexOf( '?' ) !== -1 ? '&' : '?' ) + 'bsr-ajax=' + encodeURIComponent( action );
	}

	/**
	 * Recursive function for performing batch operations.
	 */
	function bsr_process_step( action, step, page, data ) {

		$.ajax({
			type: 'POST',
			url: bsr_ajax_url( action ),
			data: {
				bsr_ajax_nonce : bsr_object_vars.ajax_nonce,
				action: action,
				bsr_step: step,
				bsr_page: page,
				bsr_data: data
			},
			dataType: 'json',
			success: function( response ) {

				// Maybe display more details.
				if ( typeof response.message != 'undefined' ) {
					$('.bsr-description').remove();
					$( '<p class="description bsr-description"></p>' ).text( response.message ).appendTo( '.bsr-progress-wrap' );
				}

				if ( 'done' == response.step ) {

					bsr_update_progress_bar( '100%' );

					// Maybe run another action.
					if ( typeof response.next_action != 'undefined' ) {
						bsr_update_progress_bar( '0%', 0 );
						bsr_process_step( response.next_action, 0, 0, response.bsr_data );
					} else {
						$('.bsr-processing-wrap').remove();
						$('.bsr-disabled').removeClass('bsr-disabled button-disabled' );
						window.location = response.url;
					}

				} else {
					bsr_update_progress_bar( response.percentage );
					bsr_process_step( action, response.step, response.page, response.bsr_data );
				}

			}
		}).fail(function (response) {
			$('.bsr-processing-wrap').remove();
			$('.bsr-disabled').removeClass('bsr-disabled button-disabled' );
			$('#bsr-error-wrap').html( '<div class="error"><p>' + bsr_object_vars.unknown + '</p></div>' ).show();
			if ( window.console && window.console.log ) {
				console.log(response);
			}
		});

	}

	/**
	 * Initializes a search/replace.
	 */
	function bsr_search_replace() {

		var search_replace_submit = $( '#bsr-submit' );
		var bsr_error_wrap = $( '#bsr-error-wrap' );
		search_replace_submit.on( 'click', function( e ) {

			e.preventDefault();

			if ( ! search_replace_submit.hasClass( 'button-disabled' ) ) {

				// Validate: at least one pair must have a non-empty search_for.
				// DO NOT trim values (spaces are valid search text).
				// DO NOT check replace_with (empty = deletion, which is valid).
				var hasValidPair = false;
				$( '.bsr-pair' ).each( function() {
					var searchVal = $( this ).find( '.bsr-search-input' ).val();
					if ( searchVal ) {
						hasValidPair = true;
						return false; // break
					}
				});

				if ( ! hasValidPair ) {
					bsr_error_wrap.html( '<div class="error"><p>' + bsr_object_vars.no_search + '</p></div>' ).show();
				} else if ( ! $( '#bsr-table-select' ).val() ) {
					bsr_error_wrap.html( '<div class="error"><p>' + bsr_object_vars.no_tables + '</p></div>' ).show();
				} else {
					var str 	= $( '.bsr-action-form' ).serialize();
					var data 	= str.replace(/%5C/g, "#BSR_BACKSLASH#" );

					bsr_error_wrap.html('').hide();
					search_replace_submit.addClass( 'bsr-disabled button-disabled' );
					$( '#bsr-submit-wrap' ).before('<div class="bsr-processing-wrap"><div class="spinner is-active bsr-spinner"></div><div class="bsr-progress-wrap"><div class="bsr-progress"></div></div></div>');
					$('.bsr-progress-wrap').append( '<p class="description bsr-description">' + bsr_object_vars.processing + '</p>' );
					bsr_process_step( 'process_search_replace', 0, 0, data );
				}

			}

		});

	}

	/**
	 * Updates the progress bar for AJAX bulk actions.
	 */
	function bsr_update_progress_bar( percentage, speed ) {
		if ( typeof speed == 'undefined' ) {
			speed = 150;
		}
		$( '.bsr-progress' ).animate({
			width: percentage
		}, speed );
	}

	/**
	 * Updates the "Max Page Size" slider.
	 */
	function bsr_update_sliders( percentage ) {
		$('#bsr-page-size-slider').slider({
			value: bsr_object_vars.page_size,
			range: "min",
			min: 1000,
			max: 50000,
			step: 1000,
			slide: function( event, ui ) {
				$('#bsr-page-size-value').text( ui.value );
				$('#bsr_page_size').val( ui.value );
			}
		});
	}

	/**
	 * Fixes the Thickbox iframe src truncation.
	 *
	 * Core thickbox.js truncates iframe src at the substring "TB_"; this restores the full URL when action=bsr_view_details.
	 */
	function bsr_thickbox_fix() {
		document.addEventListener('DOMContentLoaded', function() {
			if ( typeof window.tb_show !== 'function' ) {
				return;
			}

			var origTbShow = window.tb_show;

			window.tb_show = function ( caption, url, imageGroup ) {
				origTbShow.call( this, caption, url, imageGroup );

				if ( typeof url !== 'string' || url.indexOf( 'action=bsr_view_details' ) === -1 ) {
					return;
				}

				var applySrc = function () {
					var el = document.getElementById( 'TB_iframeContent' );
					if ( el ) {
						el.setAttribute( 'src', url );
					}
				};

				if ( window.requestAnimationFrame ) {
					window.requestAnimationFrame( function () {
						window.requestAnimationFrame( applySrc );
					} );
				} else {
					window.setTimeout( applySrc, 0 );
				}
			};
		});
	}

	bsr_init();

	function toggle_tooltip( icon ) {
		var icon = $( icon );
		var bubble = icon.next();

		// Close any that are already open
		$( '.helper-message' ).not( bubble ).hide();

		var position = icon.position();

		if ( icon.parent()[0].nodeName === 'TD' ) {
			position = icon.offset();
		}

		if ( bubble.hasClass( 'left' ) ) {
			bubble.css({
				'left': ( position.left - bubble.width() - icon.width() - 29 ) + 'px',
				'top': ( position.top + icon.height() / 2 - 18 ) + 'px'
			})
		} else if ( bubble.hasClass( 'bottom' ) ) {
			bubble.css( {
				'left': ( ( position.left - bubble.width() / 2 ) - 5 ) + 'px',
				'top': ( position.top + icon.height() + 19 ) + 'px'
			} );
		} else {
			bubble.css( {
				'left': ( position.left + icon.width() + 19 ) + 'px',
				'top': ( position.top + icon.height() / 2 - 18 ) + 'px'
			} );
		}

		bubble.toggle();
	}

	$('body').on('thickbox:iframe:loaded', function(){
		var $iframeBody = $( '#TB_window iframe' ).contents().find( 'body' );

		$iframeBody.on( 'mouseover', '.tooltip', function( e ) {
			e.preventDefault();
			$iframeBody.find( '.helper-message' ).hide();
			toggle_tooltip( this );
			e.stopPropagation();
		});

		$iframeBody.on( 'mouseleave', 'td', function( e ) {
			$iframeBody.find( '.helper-message' ).hide();
		});
	});

	$( 'body' ).on( 'mouseover', '.tooltip', function( e ) {
		toggle_tooltip( this );
	} );

	$( 'body' ).on( 'mouseleave', '.tooltip', function( e ) {
		$( '.helper-message' ).hide();
	} );

	$( '.notice.inline' )
		.appendTo('.bsr-notice-container' )
		.css( 'display', 'block' );

	setTimeout(function() {
		const $settings_saved_notice = $( '#setting-error-settings_updated' );
		const $bsr_notices = $( '.bsr-updated' );

		if ( $settings_saved_notice.length || $bsr_notices.length ) {
			$( '<div class="bsr-inner-notice-container"></div>' ).prependTo( '.inside' );
			$settings_saved_notice.prependTo( '.bsr-inner-notice-container' ).css( 'display', 'block' );
			$bsr_notices.prependTo( '.bsr-inner-notice-container' ).css( 'display', 'block' );
		}

		$( '.bsr-inner-notice-container .notice-dismiss' ).on( 'click', function ( e ) {
			if ( ! $bsr_notices.length ) {
				$( '.bsr-inner-notice-container' ).remove();
			}
		});
	}, 75);



})( jQuery );
