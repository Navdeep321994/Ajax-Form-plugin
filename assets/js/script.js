/**
 * Premium AJAX Form Saver - Frontend Script
 * Handles real-time validation, form locking, AJAX requests, and response message animations.
 */

document.addEventListener('DOMContentLoaded', function () {
    const forms = document.querySelectorAll('.pfs-ajax-form');

    forms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = form.querySelector('.pfs-submit-btn');

            // --- Helper Inner Functions (Defined first for absolute safety) ---
            function getAlertElements() {
                let alertContainer = form.querySelector('.pfs-alert-container');
                if (!alertContainer) {
                    alertContainer = document.createElement('div');
                    alertContainer.className = 'pfs-alert-container';
                    form.appendChild(alertContainer);
                }

                let alertInner = alertContainer.querySelector('.pfs-alert-inner');
                if (!alertInner) {
                    alertInner = document.createElement('div');
                    alertInner.className = 'pfs-alert';
                    alertContainer.appendChild(alertInner);
                }
                
                let alertIcon = alertInner.querySelector('.pfs-alert-icon');
                if (!alertIcon) {
                    alertIcon = document.createElement('div');
                    alertIcon.className = 'pfs-alert-icon';
                    alertInner.appendChild(alertIcon);
                }

                let alertMessage = alertInner.querySelector('.pfs-alert-message');
                if (!alertMessage) {
                    alertMessage = document.createElement('div');
                    alertMessage.className = 'pfs-alert-message';
                    alertInner.appendChild(alertMessage);
                }

                return {
                    container: alertContainer,
                    inner: alertInner,
                    icon: alertIcon,
                    message: alertMessage
                };
            }

            function showFeedback(isSuccess, messageText) {
                const el = getAlertElements();
                
                // Clear existing state and apply success/error class
                el.inner.className = 'pfs-alert ' + (isSuccess ? 'pfs-alert-success' : 'pfs-alert-error');
                
                // SVG Icons
                const successIconSvg = `
                    <svg class="pfs-alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                `;
                const errorIconSvg = `
                    <svg class="pfs-alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                `;

                el.icon.innerHTML = isSuccess ? successIconSvg : errorIconSvg;
                el.message.textContent = messageText;

                // Animate showing
                el.container.classList.add('show');
            }

            function hideFeedback() {
                const el = getAlertElements();
                el.container.classList.remove('show');
            }

            function setLoadingState(isLoading) {
                if (!submitBtn) return;
                if (isLoading) {
                    submitBtn.disabled = true;
                    submitBtn.classList.add('loading');
                    const textNode = submitBtn.querySelector('.pfs-btn-text');
                    if (textNode) {
                        submitBtn.dataset.originalText = textNode.textContent;
                        textNode.textContent = 'Sending Message...';
                    }
                } else {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('loading');
                    const textNode = submitBtn.querySelector('.pfs-btn-text');
                    if (textNode && submitBtn.dataset.originalText) {
                        textNode.textContent = submitBtn.dataset.originalText;
                    }
                }
            }

            // 1. Validate Form client-side robustly
            const nameField = form.querySelector('input[name="name"]');
            const emailField = form.querySelector('input[name="email"]');
            const subjectField = form.querySelector('input[name="subject"]');
            
            if (nameField && nameField.value.trim() === '') {
                showFeedback(false, 'Please enter your full name.');
                if (nameField.focus) nameField.focus();
                return;
            }

            if (emailField) {
                const emailVal = emailField.value.trim();
                if (emailVal === '') {
                    showFeedback(false, 'Please enter your email address.');
                    if (emailField.focus) emailField.focus();
                    return;
                }
                
                // Comprehensive email pattern matching
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailVal)) {
                    showFeedback(false, 'Please enter a valid, well-formed email address.');
                    if (emailField.focus) emailField.focus();
                    return;
                }
            }

            if (subjectField && subjectField.value.trim() === '') {
                showFeedback(false, 'Please enter a subject.');
                if (subjectField.focus) subjectField.focus();
                return;
            }

            // 2. Clear previous alerts & set loading state
            hideFeedback();
            setLoadingState(true);

            // 3. Prepare FormData
            const formData = new FormData(form);
            formData.append('action', 'pfs_submit_form');
            // We append the nonce generated by WordPress
            if (typeof pfs_vars !== 'undefined' && pfs_vars.nonce) {
                formData.append('nonce', pfs_vars.nonce);
            }

            // 4. Send AJAX Fetch Request
            const ajaxUrl = typeof pfs_vars !== 'undefined' ? pfs_vars.ajax_url : '/wp-admin/admin-ajax.php';

            fetch(ajaxUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setLoadingState(false);
                if (data.success) {
                    // Success! Display premium message & clear form
                    showFeedback(true, data.data.message || 'Form submitted successfully! Thank you.');
                    form.reset();
                } else {
                    // Business logic failure (e.g. security check failed, invalid email)
                    showFeedback(false, data.data.message || 'An error occurred during submission.');
                }
            })
            .catch(error => {
                console.error('Submission Error:', error);
                setLoadingState(false);
                showFeedback(false, 'Failed to connect to the server. Please check your internet connection and try again.');
            });
        });
    });

    // --- Admin Dashboard Interactivity (Delete Submission) ---
    const deleteButtons = document.querySelectorAll('.pfs-delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            
            const submissionId = this.dataset.id;
            const nonce = this.dataset.nonce;
            const row = document.getElementById('pfs-submission-' + submissionId);

            if (!confirm('Are you sure you want to delete this submission permanently?')) {
                return;
            }

            // Mark row as deleting (triggers CSS fade/slide out)
            row.classList.add('pfs-row-deleting');

            const ajaxUrl = typeof pfs_admin_vars !== 'undefined' ? pfs_admin_vars.ajax_url : '/wp-admin/admin-ajax.php';
            
            const formData = new FormData();
            formData.append('action', 'pfs_delete_submission');
            formData.append('id', submissionId);
            formData.append('nonce', nonce);

            fetch(ajaxUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Remove row from table after animation finishes
                    setTimeout(() => {
                        row.remove();
                        // If no more entries are left, show the empty state message
                        const tableBody = document.querySelector('.pfs-admin-table tbody');
                        if (tableBody && tableBody.children.length === 0) {
                            location.reload(); // Quick refresh to show standard WP empty state if needed
                        }
                    }, 500);
                } else {
                    row.classList.remove('pfs-row-deleting');
                    alert(data.data.message || 'Failed to delete entry.');
                }
            })
            .catch(error => {
                row.classList.remove('pfs-row-deleting');
                console.error('Delete Error:', error);
                alert('Connection failure. Could not contact the server.');
            });
        });
    });
});
