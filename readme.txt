=== Premium AJAX Form Saver ===
Contributors: antigravity
Tags: ajax, contact form, database saver, contact form database, premium form
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

A premium, highly secure WordPress plugin that adds an AJAX-powered contact form saving directly to a custom database table. Features a modern glassmorphic responsive layout, loading states, real-time success and error slide-down notifications, and a complete admin management system with CSV export and AJAX-based deletions.

== Description ==

Premium AJAX Form Saver offers an out-of-the-box, extremely fast, elegant, and secure contact form solution for your WordPress site.

By embedding the simple shortcode `[premium_ajax_form]`, you display a gorgeous premium form that users can submit without any page reloads. Under the hood, submissions are securely validated, sanitized, and stored into a custom database table `wp_ajax_form_submissions` for peak performance.

=== Premium Features ===
*   **Zero Page Reloads**: Dynamic AJAX-based processing makes the user experience lightning-fast and seamless.
*   **Custom Database Table**: Saves submissions directly to a dedicated database table for maximum speed and separation from standard WordPress logs.
*   **Stunning Modern UI**: Responsive card design with floating styling elements, modern input glow focus frames, active button state animations, and elegant HSL-colored sliding alerts.
*   **Robust Nonce & Sanitization Defense**: Complete defense against CSRF attacks and XSS attacks via native WordPress sanitization and validation utilities.
*   **Submissions Admin Panel**: Easily browse all messages via a beautiful, clean admin table under the "AJAX Submissions" menu.
*   **AJAX-Based Trash Deletion**: Instantly remove entries without standard panel reloads.
*   **One-Click CSV Export**: Easily download the complete submissions archive as a spreadsheet.

== Installation ==

1. Upload the `ajax-db-form-saver` directory to your `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. A custom table `{wpdb_prefix}ajax_form_submissions` will be automatically generated upon activation.
4. Go to any Page or Post, and insert the shortcode: `[premium_ajax_form]`
5. You're ready to collect elegant AJAX submissions!

== Shortcode Attributes ==

You can customize the titles shown on your form by passing attributes:

`[premium_ajax_form title="Contact Us Now" subtitle="We typically reply within 24 hours."]`

*   `title` - Sets the main header text of the glassmorphic card (Default: "Get In Touch").
*   `subtitle` - Sets the supporting subtitle below the main header (Default: "We would love to hear from you. Fill out the form below.").

== Changelog ==

= 1.0.0 =
* Initial premium release featuring full database hooks, frontend styles, JS controllers, shortcode renderer, dashboard table, and CSV exporter.
