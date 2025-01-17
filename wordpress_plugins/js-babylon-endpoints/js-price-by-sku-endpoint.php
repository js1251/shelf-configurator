<?php
/*
Plugin name: (Internal) WooCommerce Price by SKU Endpoint
Description: An internal plugin to add an AJAX endpoint to get the price of a product by SKU. Usage: /wp-admin/admin-ajax.php?action=get_price_by_sku&sku=YOUR_SKU
Plugin Author: Jakob Sailer
Plugin URI: https://jakobsailer.com
Author URI: https://jakobsailer.com
text-domain: om-service-widget
*/

add_action('wp_ajax_get_price_by_sku', 'get_price_by_sku');
add_action('wp_ajax_nopriv_get_price_by_sku', 'get_price_by_sku'); // For guests

function get_price_by_sku() {
    // Sanitize the input SKU
    $sku = sanitize_text_field($_POST['sku']);

    // Get the product ID from the SKU
    $product_id = wc_get_product_id_by_sku($sku);

    if (!$product_id) {
        wp_send_json_error(['message' => 'Product not found for SKU: ' . $sku]);
        return;
    }

    // Load the product
    $product = wc_get_product($product_id);

    if (!$product) {
        wp_send_json_error(['message' => 'Product not found for SKU: ' . $sku]);
        return;
    }

    // Get the price
    $price = $product->get_price();

    wp_send_json_success([
        'price' => $price,
        'currency' => get_woocommerce_currency()
    ]);
}