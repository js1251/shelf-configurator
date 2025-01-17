require('dotenv').config();

var WooCommerceAPI = require('woocommerce-api'); 
var WooCommerce = new WooCommerceAPI({
    url: 'https://www.serenepieces.com',
    consumerKey: process.env.WC_CONSUMER_KEY,
    consumerSecret: process.env.WC_CONSUMER_SECRET,
    wpAPI: true,
    version: 'wc/v3'
});

WooCommerce.getAsync('products').then(function(result) {
    const products = JSON.parse(result.toJSON().body);

    console.log(products[1]);

    // dafault images
    console.log('------------- Default Images -------------');
    console.log(products[1].images);

    // get variants if there are any
    console.log('------------- Variants -------------');
    if (products[1].variations.length > 0) {
        products[1].variations.forEach(variant => {
            // get from id
            console.log(variant);
            WooCommerce.getAsync('products/' + variant).then(function(result) {
                const variantData = JSON.parse(result.toJSON().body);
                console.log(variantData.meta_data);
                console.log(variantData.meta_data[0].value);
            });
        });
    }

    // get the products meta data
    console.log('------------- Meta Data -------------');
    console.log(products[1].meta_data);
});