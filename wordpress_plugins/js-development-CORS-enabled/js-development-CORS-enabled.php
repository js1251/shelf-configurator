<?php
/*
Plugin name: (Internal) Enable CORS for local development
Description: Allow cross-origin requests from your local development environment.
Plugin Author: Jakob Sailer
Plugin URI: https://jakobsailer.com
Author URI: https://jakobsailer.com
text-domain: om-service-widget
*/

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Enable CORS for local development
add_action('init', function() {
    // Allow cross-origin requests from your local development environment
    header("Access-Control-Allow-Origin: http://localhost:8080");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
});

// Display a warning in the admin area
add_action('admin_notices', function() {
    if (is_admin()) {
        // Create a nonce for security
        $nonce = wp_create_nonce('disable_cors_plugin');
        $disable_url = admin_url('admin-post.php?action=disable_cors_plugin&nonce=' . $nonce);

        echo '
        <div class="notice notice-error" style="background: #ffdddd; border-left: 4px solid #ff0000; padding: 10px; font-size: 16px;">
            <strong>WARNING:</strong> CORS is allowed for http://localhost:8080. Please disable it in the production environment to avoid exposing your server to potential risks!<br>
            <a href="' . esc_url($disable_url) . '" class="button button-primary" style="margin-top: 10px;">Disable Plugin</a>
        </div>';
    }
});

// Handle the disable button click
add_action('admin_post_disable_cors_plugin', function() {
    // Verify nonce for security
    if (!isset($_GET['nonce']) || !wp_verify_nonce($_GET['nonce'], 'disable_cors_plugin')) {
        wp_die(__('Invalid request.', 'om-service-widget'));
    }

    // Deactivate this plugin
    deactivate_plugins(plugin_basename(__FILE__));

    // Redirect back to the admin area with a success message
    wp_safe_redirect(admin_url('plugins.php?deactivation=success'));
    exit;
});