/**
 * AJAX DB Form Saver — Front-end script
 * Handles validation, AJAX submission, and message display.
 */
jQuery( document ).ready( function ( $ ) {

    var form        = $( '#ajax-db-form' );
    var responseBox = $( '#ajax-db-form-response' );
    var submitBtn   = $( '#pfs-submit-btn' );
    var msgs        = AjaxDBFormSaver.messages;

    // Timer for the bottom alert box
    var hideTimer = null;

    // Per-field auto-hide timers (keyed by fieldId)
    var fieldTimers = {};

    /* ------------------------------------------------------------------
     * Helpers
     * ------------------------------------------------------------------ */

    /**
     * Show an inline field error and auto-hide it after 3 seconds.
     */
    function showFieldError( fieldId, message ) {
        var $group = $( '#pfs-group-' + fieldId );
        var $input = $( '#' + fieldId );
        var $err   = $( '#error-' + fieldId );

        $group.addClass( 'pfs-has-error' );
        $input.addClass( 'pfs-input-error' );
        $err.text( message ).addClass( 'visible' );

        // Cancel any existing timer for this field
        if ( fieldTimers[ fieldId ] ) {
            clearTimeout( fieldTimers[ fieldId ] );
        }

        // Auto-hide after 3 seconds
        fieldTimers[ fieldId ] = setTimeout( function () {
            clearFieldError( fieldId );
            delete fieldTimers[ fieldId ];
        }, 3000 );
    }

    /**
     * Clear a single field error (also cancels its auto-hide timer).
     */
    function clearFieldError( fieldId ) {
        var $group = $( '#pfs-group-' + fieldId );
        var $input = $( '#' + fieldId );
        var $err   = $( '#error-' + fieldId );

        $group.removeClass( 'pfs-has-error' );
        $input.removeClass( 'pfs-input-error' );
        $err.text( '' ).removeClass( 'visible' );

        // Cancel the auto-hide timer if the user fixed it manually
        if ( fieldTimers[ fieldId ] ) {
            clearTimeout( fieldTimers[ fieldId ] );
            delete fieldTimers[ fieldId ];
        }
    }

    /**
     * Clear all field errors.
     */
    function clearAllErrors() {
        [ 'adfs_name', 'adfs_email', 'adfs_phone', 'adfs_subject', 'adfs_message' ].forEach( function ( id ) {
            clearFieldError( id );
        } );
    }

    /**
     * Show the response alert below the form.
     * @param {string} type    'success' | 'error'
     * @param {string} message Text to display
     * @param {number} delay   Auto-hide after this many ms
     */
    function showAlert( type, message, delay ) {
        if ( hideTimer ) {
            clearTimeout( hideTimer );
        }

        var icon = type === 'success'
            ? '<svg class="pfs-alert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
            : '<svg class="pfs-alert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

        responseBox
            .removeClass( 'show pfs-alert pfs-alert-success pfs-alert-error' )
            .html(
                '<div class="pfs-alert pfs-alert-' + type + '">' +
                    icon +
                    '<span class="pfs-alert-message">' + $( '<span>' ).text( message ).html() + '</span>' +
                '</div>'
            )
            .addClass( 'show' );

        hideTimer = setTimeout( function () {
            responseBox.removeClass( 'show' );
            setTimeout( function () {
                responseBox.html( '' );
            }, 400 ); // wait for CSS transition to finish
        }, delay );
    }

    /**
     * Set the submit button into loading / normal state.
     */
    function setLoading( loading ) {
        if ( loading ) {
            submitBtn.addClass( 'loading' ).prop( 'disabled', true );
        } else {
            submitBtn.removeClass( 'loading' ).prop( 'disabled', false );
        }
    }

    /* ------------------------------------------------------------------
     * Live validation — clear error as user types / changes
     * ------------------------------------------------------------------ */
    form.on( 'input change', '.pfs-input, .pfs-textarea', function () {
        clearFieldError( this.id );
    } );

    /* ------------------------------------------------------------------
     * Client-side validation
     * ------------------------------------------------------------------ */
    function validateForm() {
        var valid = true;

        var name    = $.trim( $( '#adfs_name' ).val() );
        var email   = $.trim( $( '#adfs_email' ).val() );
        var phone   = $.trim( $( '#adfs_phone' ).val() );
        var subject = $.trim( $( '#adfs_subject' ).val() );
        var message = $.trim( $( '#adfs_message' ).val() );

        clearAllErrors();

        if ( name === '' ) {
            showFieldError( 'adfs_name', msgs.required );
            valid = false;
        }

        if ( email === '' ) {
            showFieldError( 'adfs_email', msgs.required );
            valid = false;
        } else if ( ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email ) ) {
            showFieldError( 'adfs_email', msgs.invalid_email );
            valid = false;
        }

        if ( phone === '' ) {
            showFieldError( 'adfs_phone', msgs.required );
            valid = false;
        } else if ( ! /^[+\d\s\-().]{7,20}$/.test( phone ) ) {
            showFieldError( 'adfs_phone', msgs.invalid_phone );
            valid = false;
        }

        if ( subject === '' ) {
            showFieldError( 'adfs_subject', msgs.required );
            valid = false;
        }

        if ( message === '' ) {
            showFieldError( 'adfs_message', msgs.required );
            valid = false;
        }

        return valid;
    }

    /* ------------------------------------------------------------------
     * Form submit
     * ------------------------------------------------------------------ */
    form.on( 'submit', function ( e ) {
        e.preventDefault();

        if ( ! validateForm() ) {
            // Scroll to first error
            var $firstError = form.find( '.pfs-has-error' ).first();
            if ( $firstError.length ) {
                $( 'html, body' ).animate( {
                    scrollTop: $firstError.offset().top - 80
                }, 300 );
            }
            return;
        }

        setLoading( true );

        var data = {
            action:       'ajax_db_form_submit',
            nonce:        AjaxDBFormSaver.nonce,
            adfs_name:    $.trim( $( '#adfs_name' ).val() ),
            adfs_email:   $.trim( $( '#adfs_email' ).val() ),
            adfs_phone:   $.trim( $( '#adfs_phone' ).val() ),
            adfs_subject: $.trim( $( '#adfs_subject' ).val() ),
            adfs_message: $.trim( $( '#adfs_message' ).val() ),
        };

        $.post( AjaxDBFormSaver.ajax_url, data, function ( resp ) {
            setLoading( false );

            if ( resp.success ) {
                form[ 0 ].reset();
                clearAllErrors();
                // Success: hide after 5 seconds
                showAlert( 'success', resp.data.message, 5000 );
            } else {
                // Show server-side field errors if returned
                if ( resp.data && resp.data.fields ) {
                    $.each( resp.data.fields, function ( fieldId, errorMsg ) {
                        showFieldError( fieldId, errorMsg );
                    } );
                }
                // Error: hide after 3 seconds
                var errMsg = ( resp.data && resp.data.message ) ? resp.data.message : msgs.server_error;
                showAlert( 'error', errMsg, 3000 );
            }
        }, 'json' ).fail( function () {
            setLoading( false );
            // Network / server error: hide after 3 seconds
            showAlert( 'error', msgs.server_error, 3000 );
        } );
    } );

} );
