<?php
/*
Plugin Name: AJAX Form Saver
Plugin URI: https://example.com/premium-ajax-form-saver
Description: A highly elegant and secure AJAX contact form that saves entries directly into a custom database table. Includes a robust admin panel to manage, delete, and export submissions as CSV. Use the shortcode [premium_ajax_form] to display the form.
Version: 1.0.0
Author: Antigravity
Author URI: https://example.com
License: GPL2
Text Domain: premium-ajax-form-saver
*/

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 1. DATABASE SETUP
 * Creates a custom table on plugin activation.
 */
function pfs_create_database_table()
{
    global $wpdb;
    $table_name = $wpdb->prefix . 'ajax_form_submissions';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        name varchar(100) NOT NULL,
        email varchar(100) NOT NULL,
        subject varchar(255) NOT NULL,
        message text NOT NULL,
        submitted_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
register_activation_hook(__FILE__, 'pfs_create_database_table');

/**
 * 2. SCRIPTS AND STYLES REGISTRATION
 */
function pfs_register_assets()
{
    // Register Frontend Styles
    wp_register_style(
        'pfs-style',
        plugins_url('assets/css/style.css', __FILE__),
        array(),
        '1.0.0'
    );

    // Register Frontend Scripts
    wp_register_script(
        'pfs-script',
        plugins_url('assets/js/script.js', __FILE__),
        array(),
        '1.0.0',
        true
    );

    // Localize Data for AJAX Security
    wp_localize_script('pfs-script', 'pfs_vars', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('pfs_form_submission_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'pfs_register_assets');

/**
 * Enqueue Admin Assets on our specific admin page
 */
function pfs_enqueue_admin_assets($hook)
{
    if ('toplevel_page_pfs-submissions' !== $hook) {
        return;
    }

    wp_enqueue_style(
        'pfs-admin-style',
        plugins_url('assets/css/style.css', __FILE__),
        array(),
        '1.0.0'
    );

    wp_enqueue_script(
        'pfs-admin-script',
        plugins_url('assets/js/script.js', __FILE__),
        array(),
        '1.0.0',
        true
    );

    wp_localize_script('pfs-admin-script', 'pfs_admin_vars', array(
        'ajax_url' => admin_url('admin-ajax.php')
    ));
}
add_action('admin_enqueue_scripts', 'pfs_enqueue_admin_assets');

/**
 * 3. SHORTCODE CREATION [premium_ajax_form]
 */
function pfs_render_shortcode($atts)
{
    // Enqueue registered assets when shortcode is active
    wp_enqueue_style('pfs-style');
    wp_enqueue_script('pfs-script');

    // Parse attributes in case user wants customizable titles
    $atts = shortcode_atts(array(
        'title' => 'Get In Touch',
        'subtitle' => 'We would love to hear from you. Fill out the form below.'
    ), $atts, 'premium_ajax_form');

    ob_start();
    ?>
    <div class="pfs-form-container">
        <div class="pfs-form-header">
            <h2 class="pfs-form-title"><?php echo esc_html($atts['title']); ?></h2>
            <p class="pfs-form-subtitle"><?php echo esc_html($atts['subtitle']); ?></p>
        </div>

        <form class="pfs-ajax-form" method="POST" novalidate>
            <div class="pfs-form-grid">
                <div class="pfs-form-grid-2col">
                    <div class="pfs-form-group">
                        <label class="pfs-label" for="pfs-name">Full Name</label>
                        <div class="pfs-input-wrapper">
                            <input type="text" id="pfs-name" name="name" class="pfs-input" placeholder="John Doe" required>
                        </div>
                    </div>

                    <div class="pfs-form-group">
                        <label class="pfs-label" for="pfs-email">Email Address</label>
                        <div class="pfs-input-wrapper">
                            <input type="email" id="pfs-email" name="email" class="pfs-input" placeholder="john@example.com"
                                required>
                        </div>
                    </div>
                </div>

                <div class="pfs-form-group pfs-grid-span-2">
                    <label class="pfs-label" for="pfs-subject">Subject</label>
                    <div class="pfs-input-wrapper">
                        <input type="text" id="pfs-subject" name="subject" class="pfs-input"
                            placeholder="How can we help you?" required>
                    </div>
                </div>

                <div class="pfs-form-group pfs-grid-span-2">
                    <label class="pfs-label" for="pfs-message">Message</label>
                    <div class="pfs-input-wrapper">
                        <textarea id="pfs-message" name="message" class="pfs-textarea"
                            placeholder="Type your message details here..."></textarea>
                    </div>
                </div>

                <div class="pfs-form-group pfs-grid-span-2">
                    <button type="submit" class="pfs-submit-btn">
                        <span class="pfs-btn-spinner"></span>
                        <span class="pfs-btn-text">Submit Message</span>
                    </button>
                </div>
            </div>

            <!-- Beautiful Feedback Container -->
            <div class="pfs-alert-container">
                <div class="pfs-alert-inner">
                    <div class="pfs-alert-icon"></div>
                    <div class="pfs-alert-message"></div>
                </div>
            </div>
        </form>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('premium_ajax_form', 'pfs_render_shortcode');

/**
 * 4. AJAX ENDPOINT FOR SUBMISSION PROCESSING
 */
function pfs_handle_form_submission()
{
    // A. Security Nonce Check
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'pfs_form_submission_nonce')) {
        wp_send_json_error(array('message' => 'Security token invalid. Please refresh the page and try again.'));
    }

    // B. Extraction & Trimming
    $name = isset($_POST['name']) ? trim($_POST['name']) : '';
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $subject = isset($_POST['subject']) ? trim($_POST['subject']) : '';
    $message = isset($_POST['message']) ? trim($_POST['message']) : '';

    // C. Validation
    if (empty($name) || empty($email) || empty($subject)) {
        wp_send_json_error(array('message' => 'Name, Email, and Subject fields are strictly required.'));
    }

    if (!is_email($email)) {
        wp_send_json_error(array('message' => 'Please provide a valid, well-formed email address.'));
    }

    // D. Sanitization
    $name = sanitize_text_field($name);
    $email = sanitize_email($email);
    $subject = sanitize_text_field($subject);
    $message = sanitize_textarea_field($message);

    // E. Database Insertion
    global $wpdb;
    $table_name = $wpdb->prefix . 'ajax_form_submissions';

    $inserted = $wpdb->insert(
        $table_name,
        array(
            'name' => $name,
            'email' => $email,
            'subject' => $subject,
            'message' => $message,
            'submitted_at' => current_time('mysql')
        ),
        array('%s', '%s', '%s', '%s', '%s')
    );

    if ($inserted) {
        wp_send_json_success(array('message' => 'Thank you! Your submission has been saved securely to our database.'));
    } else {
        wp_send_json_error(array('message' => 'A database error occurred. Please try again later.'));
    }
}
add_action('wp_ajax_pfs_submit_form', 'pfs_handle_form_submission');
add_action('wp_ajax_nopriv_pfs_submit_form', 'pfs_handle_form_submission');

/**
 * 5. ADMIN MANAGEMENT DASHBOARD MENU & VIEW
 */
function pfs_register_admin_menu()
{
    add_menu_page(
        'AJAX Submissions',
        'AJAX Submissions',
        'manage_options',
        'pfs-submissions',
        'pfs_render_admin_dashboard_page',
        'dashicons-feedback',
        30
    );
}
add_action('admin_menu', 'pfs_register_admin_menu');

/**
 * Render the Beautiful Admin Dashboard List Table
 */
function pfs_render_admin_dashboard_page()
{
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'premium-ajax-form-saver'));
    }

    global $wpdb;
    $table_name = $wpdb->prefix . 'ajax_form_submissions';

    // Fetch all submissions from the custom table
    $submissions = $wpdb->get_results("SELECT * FROM $table_name ORDER BY submitted_at DESC", ARRAY_A);

    // Generate secure export URL
    $export_url = wp_nonce_url(admin_url('admin-post.php?action=pfs_export_csv'), 'pfs_export_csv_nonce');
    ?>
    <div class="wrap pfs-admin-wrap">
        <div class="pfs-admin-header">
            <div>
                <h1>AJAX Contact Form Submissions</h1>
                <p style="margin: 5px 0 0 0; color: #64748b;">Manage and view all incoming AJAX messages saved directly to
                    your database.</p>
            </div>
            <?php if (!empty($submissions)): ?>
                <a href="<?php echo esc_url($export_url); ?>" class="pfs-admin-btn">
                    <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Export CSV
                </a>
            <?php endif; ?>
        </div>

        <div class="pfs-admin-table-container">
            <?php if (empty($submissions)): ?>
                <div class="pfs-empty-state">
                    <svg style="width: 48px; height: 48px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293H8.586a1 1 0 01-.707-.293L5.464 13.5a1 1 0 00-.707-.293H0">
                        </path>
                    </svg>
                    <h3>No submissions recorded yet</h3>
                    <p>Submissions will populate here automatically once users submit the form via [premium_ajax_form]
                        shortcode.</p>
                </div>
            <?php else: ?>
                <table class="pfs-admin-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">ID</th>
                            <th style="width: 150px;">Name</th>
                            <th style="width: 180px;">Email</th>
                            <th style="width: 200px;">Subject</th>
                            <th>Message</th>
                            <th style="width: 160px;">Date & Time</th>
                            <th style="width: 80px; text-align: center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($submissions as $submission): ?>
                            <tr id="pfs-submission-<?php echo esc_attr($submission['id']); ?>">
                                <td><span class="pfs-admin-badge">#<?php echo esc_html($submission['id']); ?></span></td>
                                <td><strong><?php echo esc_html($submission['name']); ?></strong></td>
                                <td><a
                                        href="mailto:<?php echo esc_attr($submission['email']); ?>"><?php echo esc_html($submission['email']); ?></a>
                                </td>
                                <td><?php echo esc_html($submission['subject']); ?></td>
                                <td><?php echo nl2br(esc_html($submission['message'])); ?></td>
                                <td><?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($submission['submitted_at']))); ?>
                                </td>
                                <td style="text-align: center;">
                                    <div class="pfs-admin-actions">
                                        <button class="action-delete pfs-delete-btn"
                                            data-id="<?php echo esc_attr($submission['id']); ?>"
                                            data-nonce="<?php echo esc_attr(wp_create_nonce('pfs_delete_submission_' . $submission['id'])); ?>">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>
    <?php
}

/**
 * 6. ADMIN AJAX ENDPOINT TO DELETE SUBMISSION
 */
function pfs_handle_delete_submission()
{
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Unauthorized action.'));
    }

    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : '';

    if (!$id || !wp_verify_nonce($nonce, 'pfs_delete_submission_' . $id)) {
        wp_send_json_error(array('message' => 'Security token check failed. Please refresh.'));
    }

    global $wpdb;
    $table_name = $wpdb->prefix . 'ajax_form_submissions';

    $deleted = $wpdb->delete(
        $table_name,
        array('id' => $id),
        array('%d')
    );

    if ($deleted !== false) {
        wp_send_json_success(array('message' => 'Submission deleted successfully.'));
    } else {
        wp_send_json_error(array('message' => 'Failed to delete submission from database.'));
    }
}
add_action('wp_ajax_pfs_delete_submission', 'pfs_handle_delete_submission');

/**
 * 7. CSV EXPORT POST HANDLER
 */
function pfs_handle_csv_export()
{
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('Unauthorized access.', 'premium-ajax-form-saver'));
    }

    // Verify Nonce
    if (!isset($_GET['_wpnonce']) || !wp_verify_nonce($_GET['_wpnonce'], 'pfs_export_csv_nonce')) {
        wp_die(esc_html__('Security check failed. Please refresh your page and try again.', 'premium-ajax-form-saver'));
    }

    global $wpdb;
    $table_name = $wpdb->prefix . 'ajax_form_submissions';

    // Fetch submissions
    $submissions = $wpdb->get_results("SELECT id, name, email, subject, message, submitted_at FROM $table_name ORDER BY submitted_at DESC", ARRAY_A);

    // Clean outputs to prevent pollution
    if (ob_get_length()) {
        ob_clean();
    }

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=ajax-submissions-' . date('Y-m-d') . '.csv');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');

    // Add UTF-8 BOM for proper excel formatting
    fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

    // CSV Header row
    fputcsv($output, array('ID', 'Full Name', 'Email Address', 'Subject', 'Message Details', 'Submitted At'));

    if (!empty($submissions)) {
        foreach ($submissions as $row) {
            fputcsv($output, $row);
        }
    }

    fclose($output);
    exit;
}
add_action('admin_post_pfs_export_csv', 'pfs_handle_csv_export');
