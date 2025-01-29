require('dotenv').config();

var WooCommerceAPI = require('woocommerce-api'); 
var WooCommerce = new WooCommerceAPI({
    url: 'https://www.bsp-protect.com',
    consumerKey: process.env.WC_CONSUMER_KEY,
    consumerSecret: process.env.WC_CONSUMER_SECRET,
    wpAPI: true,
    version: 'wc/v3'
});

// function to get all orders between two dates (inclusive)
async function getOrdersBetweenDates(startDate, endDate) {
    // make sure all orders are fetched, in case there are more than 100
    const orders = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const response = await WooCommerce.getAsync('orders', {
            after: startDate,
            before: endDate,
            per_page: 100,
            page: page
        });

        const data = JSON.parse(response.toJSON().body);
        orders.push(...data);

        totalPages = parseInt(response.headers['x-wp-totalpages']);
        page++;

        console.log('Fetched page ' + page);
    }
}

// get all orders between 1. april 2024 and 31. december 2024
const startDate = '2024-04-01T00:00:00';
const endDate = '2024-12-31T23:59:59';

getOrdersBetweenDates(startDate, endDate).then(orders => {
    console.log(orders.length);
    console.log(orders[0]);
});