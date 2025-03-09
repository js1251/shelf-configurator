<?php
/*
Plugin name: (Internal) WooCommerce All Product SKUs Endpoint
Description: An internal plugin to add an AJAX endpoint to get all product skus. Usage: /wp-admin/admin-ajax.php?action=get_all_product_skus
Plugin Author: Jakob Sailer
Plugin URI: https://jakobsailer.com
Author URI: https://jakobsailer.com
text-domain: om-service-widget
*/

add_action('wp_ajax_get_all_product_skus', 'get_all_product_skus');
add_action('wp_ajax_nopriv_get_all_product_skus', 'get_all_product_skus'); // For guests

function get_all_product_skus() {
    $args = array(
        'post_type' => 'product',
        'posts_per_page' => -1,
    );

    $products = new WP_Query($args);

    $skus = [];

    if ($products->have_posts()) {
        while ($products->have_posts()) {
            $products->the_post();
            $product = wc_get_product(get_the_ID());

            // check if it has variations
            if ($product->is_type('variable')) {
                $variations = $product->get_children();

                foreach ($variations as $variation_id) {
                    $variation = wc_get_product($variation_id);
                    $skus[] = $variation->get_sku();
                }
            } else {
                $skus[] = $product->get_sku();
            }
        }
    }

    wp_send_json_success(['skus' => $skus]);
    wp_reset_postdata();
}