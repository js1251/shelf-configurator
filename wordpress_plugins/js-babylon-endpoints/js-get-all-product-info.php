<?php
/*
Plugin name: (Internal) WooCommerce All Product Info Endpoint
Description: An internal plugin to add an AJAX endpoint to get all product info. Usage: /wp-admin/admin-ajax.php?action=get_all_product_info
Plugin Author: Jakob Sailer
Plugin URI: https://jakobsailer.com
Author URI: https://jakobsailer.com
text-domain: om-service-widget
*/

add_action('wp_ajax_get_all_product_info', 'get_all_product_info');
add_action('wp_ajax_nopriv_get_all_product_info', 'get_all_product_info'); // For guests

function get_all_product_info() {
    $args = array(
        'post_type' => 'product',
        'posts_per_page' => -1,
    );

    // A product can be either a simple product or a variable product
    $products = new WP_Query($args);
    
    // this array will contain all info of all variations of all variable products
    $variations_info = [];

    if (!$products->have_posts()) {
        wp_reset_postdata();
        wp_send_json_error(['message' => 'No products found']);
        return;
    }

    while ($products->have_posts()) {
        $products->the_post();
        $product = wc_get_product(get_the_ID());

        if ($product->is_type('variable')) {
            $variation_ids = $product->get_children();

            foreach ($variation_ids as $variation_id) {
                $variation = wc_get_product($variation_id);
                $variation_sku = $variation->get_sku();

                $image_urls = [];
	            if ($variation->get_image_id()) {
		            $image_id = $variation->get_image_id();
                    $image_array = wp_get_attachment_image_src($image_id, 'full');

                    if (!empty($image_array)) {
                        $image_urls[] = $image_array[0];
                    }
	            }

                // Add gallery images from custom meta key "blocksy_post_meta_options"
                $blocksy_meta = get_post_meta($variation_id, 'blocksy_post_meta_options', true);
                if (!empty($blocksy_meta['images'])) {
                    $images = $blocksy_meta['images'];

                    foreach ($images as $image) {
                        $image_urls[] = $image['url'];
                    }
                }
                    
                $variations_info[$variation_sku] = [
                    'name' => $product->get_name(),
                    'price' => $variation->get_price(),
                    'description' => $product->get_description(),
                    'image_urls' => $image_urls,
                    'shop_url' => get_permalink($variation_id),
                ];
            }
        } else {
            // ignore for simple products for now
            continue;
        }
    }

    wp_send_json_success(['variations_info' => $variations_info]);
    wp_reset_postdata();
}