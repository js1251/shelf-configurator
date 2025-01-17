<?php
/*
Plugin name: (Internal) WooCommerce Sell by value with Price Ranges
Description: Allows selling products by a number value, with dynamic pricing based on defined ranges.
Plugin Author: Jakob Sailer
Plugin URI: https://jakobsailer.com
Author URI: https://jakobsailer.com
text-domain: om-service-widget
*/

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add "Price by Range" checkbox to product type options (simple and variable products)
 */
add_filter('product_type_options', function($options) {
    // add "Price by Range" checkbox
    $options['enable_price_by_range'] = array(
        'id'            => '_enable_price_by_range',
        'wrapper_class' => 'show_if_simple show_if_variable',
        'label'         => __( 'Price per unit', 'woocommerce' ),
        'description'   => __( 'Enable this option to define pricing based on units (eg. per meter).', 'woocommerce' ),
        'default'       => 'no',
    );

    return $options;
}, 10);

/**
 * Save "Price by Range" checkbox value (simple and variable products)
 */
add_action("save_post_product", function ($post_ID, $product, $update) {
    update_post_meta(
          $product->ID
        , "_enable_price_by_range"
        , isset($_POST["_enable_price_by_range"]) ? "yes" : "no"
    );

}, 10, 3);

/**
 * Add "Price by Range" fields to simple products
 */
add_action('woocommerce_product_options_pricing', function () {
    echo '<div class="options_group show_if_simple show_if_variable">';
    
    // Add input for price ranges
    woocommerce_wp_textarea_input(array(
        'id'          => '_price_by_range_values',
        'label'       => __('Price Ranges', 'woocommerce'),
        'description' => __('Define price ranges here. Example: "1-5:10, 6-10:20" (ranges in meters, prices in currency).', 'woocommerce'),
        'desc_tip'    => true,
        'class'       => 'price-by-range-field',
    ));
    
    echo '</div>';
});

/**
 * Save "Price by Range" field for simple products
 */
add_action('save_post_product', function ($post_ID, $product, $update) {
    if (isset($_POST['_price_by_range_values'])) {
        update_post_meta($product->ID, '_price_by_range_values', sanitize_text_field($_POST['_price_by_range_values']));
    }
}, 10, 3);

/**
 * Add "Price by Range" fields to variable products
 */
add_action('woocommerce_variation_options_pricing', function ($loop, $variation_data, $variation) {
    woocommerce_wp_textarea_input(array(
        'id'          => "_price_by_range_values_{$variation->ID}",
        'label'       => __('Price Ranges', 'woocommerce'),
        'description' => __('Define price ranges for this variation. Example: "1-5:10, 6-10:20".', 'woocommerce'),
        'desc_tip'    => true,
        'value'       => get_post_meta($variation->ID, '_price_by_range_values', true),
        'class'       => 'variation-price-by-range-field',
    ));
}, 10, 3);

/**
 * Save "Price by Range" field for variable products
 */
add_action('woocommerce_save_product_variation', function ($variation_id, $i) {
    if (isset($_POST["_price_by_range_values_{$variation_id}"])) {
        update_post_meta(
            $variation_id,
            '_price_by_range_values',
            sanitize_text_field($_POST["_price_by_range_values_{$variation_id}"])
        );
    }
}, 10, 2);

/**
 * Hide regular and sale price fields for products with "Price by Range" enabled (simple and variable products)
 * 
 * TODO: broken for variable products! (Regular and range price fields are always visible right now)
 */
add_action('admin_footer', function () {
    // Only run this script on the product edit page
    if ('product' !== get_post_type()) {
        return;
    }
    ?>
    <script>
        jQuery(document).ready(function ($) {
            // Target the checkbox and fields for the parent product
            const priceByRangeCheckbox = $('#_enable_price_by_range');
            const parentRegularPriceField = $('.pricing ._regular_price_field');
            const parentSalePriceField = $('.pricing ._sale_price_field');
            const parentPriceRangeField = $('.pricing ._price_by_range_values_field');
            
            const variationPriceRangeField = $('._price_by_range_values_650_field');

            // Function to toggle the visibility of the parent product fields
            function toggleParentPriceFields() {
                if (priceByRangeCheckbox.is(':checked')) {
                    parentRegularPriceField.hide();
                    parentSalePriceField.hide();

                    parentPriceRangeField.show();
                    variationPriceRangeField.show();
                } else {
                    parentRegularPriceField.show();
                    parentSalePriceField.show();

                    parentPriceRangeField.hide();
                    variationPriceRangeField.hide();
                }
            }

            // Initial check on page load
            toggleParentPriceFields();

            // Listen for changes to the parent product checkbox
            priceByRangeCheckbox.change(function () {
                toggleParentPriceFields();
            });

            // Reapply logic when new variations are dynamically loaded
            $(document).on('woocommerce_variations_loaded woocommerce_variations_added', function () {
                toggleParentPriceFields();
            });
        });
    </script>
    <?php
});

/**
 * Add input field for product quantity on product page
 */
add_action('woocommerce_before_add_to_cart_button', function () {
    global $product;

    // Check if "Price by Range" is enabled for this product
    $price_by_range_enabled = get_post_meta($product->get_id(), '_enable_price_by_range', true);

    if ($price_by_range_enabled === 'yes') {
        // Get the price ranges
        $price_ranges = get_post_meta($product->get_id(), '_price_by_range_values', true);
        ?>
        <div class="price-by-range-container">
            <p>
                <strong><?php esc_html_e('Price Ranges:', 'woocommerce'); ?></strong>
                <br>
                <?php echo esc_html($price_ranges); ?>
            </p>
            <label for="measurement_input"><?php esc_html_e('Enter the measurement (e.g., meters):', 'woocommerce'); ?></label>
            <input type="number" id="measurement_input" name="measurement_input" step="0.01" min="0" required>
        </div>
        <?php
    }
});