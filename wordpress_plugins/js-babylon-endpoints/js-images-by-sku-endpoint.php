<?php
/*
Plugin name: (Internal) WooCommerce Image URLs by SKU Endpoint
Description: An internal plugin to add an AJAX endpoint to get the image urls of a product by SKU. Usage: /wp-admin/admin-ajax.php?action=get_image_urls_by_sku&sku=YOUR_SKU
Plugin Author: Jakob Sailer
Plugin URI: https://jakobsailer.com
Author URI: https://jakobsailer.com
text-domain: om-service-widget
*/

add_action('wp_ajax_get_image_urls_by_sku', 'get_image_urls_by_sku');
add_action('wp_ajax_nopriv_get_image_urls_by_sku', 'get_image_urls_by_sku'); // For guests

function get_image_urls_by_sku() {
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

    $image_urls = [];
	if ( $product->get_image_id() ) {
		$image_ids = $product->get_image_id();
        $image_urls = wp_get_attachment_image_src($image_ids, 'full');
	}

    // Add gallery images from custom meta key "blocksy_post_meta_options"
    $blocksy_meta = get_post_meta($product_id, 'blocksy_post_meta_options', true);
    if (!empty($blocksy_meta['images'])) {
        $images = $blocksy_meta['images'];

        foreach ($images as $image) {
            $image_urls[] = $image['url'];
        }
    }

    if (!empty($image_urls)) {
        wp_send_json_success(['image_urls' => $image_urls]);
    } else {
        wp_send_json_error(['message' => 'No images found for product with SKU: ' . $sku]);
    }
}
