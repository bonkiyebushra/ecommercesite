const { Client } = pkg
import pkg from 'pg';
import { connectionString, pool } from "./dbConfig.js";
const PRODUCT_IMAGES_DIRECTORY = "product_images"
let client;

//Client & Pool queries
const poolQuery = (query, argsArray) => {
    return new Promise((resolve, reject) => pool.query(query
        , argsArray, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result.rows)
            }
        }))
}

const clientQuery = (query, argsArray) => {
    return new Promise((resolve, reject) => client.query(query
        , argsArray, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result.rows)
            }
        }))
}


//Transaction functions

const executeTransaction = async (callback) => {
    return new Promise(async (resolve, reject) => {
        await client.connect();
        try {
            await client.query('BEGIN');
            try {
                await callback(client);
                await client.query('COMMIT');
                resolve();
            } catch (error) {
                await client.query('ROLLBACK');
                reject(error)
            }
        } finally {
            await client.end();
        }
    })
};

const executeResultTransaction = async (callback) => {
    return new Promise(async (resolve, reject) => {
        await client.connect();
        try {
            await client.query('BEGIN');
            try {
                let result = await callback(client);
                await client.query('COMMIT');
                resolve(result);
            } catch (error) {
                await client.query('ROLLBACK');
                reject(error)
            }
        } finally {
            await client.end();
        }
    })
};


//Client Queries

const queryRemoveProductQuantities = (productId, quantity = 1) => {
    return clientQuery(`
    UPDATE product SET quantity = quantity - $1 WHERE product_number = $2;
    `, [quantity, productId])
}

const queryAddProductQuantitiesSold = (productId, quantity = 2) => {
    return clientQuery(`
    UPDATE product SET quantity_sold = quantity_sold + $1 WHERE product_number = $2;
    `, [quantity, productId])
}

const queryImagesTransaction = (productId) => {
    return clientQuery(`SELECT * FROM product_image WHERE product_id = $1`, [productId])
}

const queryCustomerCartItems = (customerId) => {
    return clientQuery(`SELECT * FROM customer_cart_item WHERE customer_id=$1`, [customerId])
}

const queryTopSellingProductsTransaction = (productCount = 5) => {
    return clientQuery(`SELECT * FROM product ORDER BY quantity_sold DESC LIMIT $1`, [productCount])
}

const queryClientAddProductImageLink = (productId, imageName, isMainImage) => {
    return clientQuery(`
    INSERT INTO product_image(product_id, link, is_main_image) 
    VALUES($1 ,$2, $3)
    `, [productId, "product_images/" + imageName, isMainImage], (req, res) => {
    })
}

const queryClientAddProduct = (productColumnArr) => {
    return clientQuery(`INSERT INTO product(name, product_number, quantity, status, price,description,weight)
    VALUES ($1, $2, $3, $4, $5, $6, $7) returning product_number`, productColumnArr)
}

const queryAddTransaction = (customerId, totalCost, status, shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry) => {
    return clientQuery(`INSERT INTO transaction(customer_id, total_cost, transaction_status, shipping_address,shipping_city, shipping_state,shipping_zip_code, shipping_country)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING confirmation_number`, [customerId, totalCost, status, shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry])
}

const queryAddOrderLine = (productId, transactionId, quantity, weight, priceBeforeTax, priceAfterTax) => {
    return clientQuery(`INSERT INTO order_line(product_id, transaction_id, quantity, total_weight, price_before_tax, price_after_tax)
    VALUES($1, $2, $3, $4, $5, $6)`,
        [productId, transactionId, quantity, weight, priceBeforeTax, priceAfterTax])
}

const queryProductTransaction = (productId) => {
    return clientQuery(`SELECT * FROM product WHERE product_number = $1 LIMIT 1`, [productId])
}

const queryAddProductCategory = (productId, category) => {
    return clientQuery(`INSERT INTO product_category(product_id, category_id)
                        VALUES($1, $2)`, [productId, category])
}

const queryFiveDayRevenue = () => {
    return clientQuery(`SELECT date(transaction_date) as t_d,SUM(total_cost)
                        FROM transaction
                        GROUP BY t_d
                        ORDER BY t_d DESC
                        LIMIT 5`)
}

const queryAddUser = (email, password) => {
    return clientQuery(`INSERT INTO user_account(email, password) VALUES($1, $2)`, [email, password])
}

const queryAddCustomer = (firstName, lastName, email, phoneNumber) => {
    return clientQuery(`INSERT INTO customer(first_name, last_name, email, phone_number) 
                        VALUES($1, $2, $3, $4)`, [firstName, lastName, email, phoneNumber])
}

const queryAddEmployee = (firstName, lastName, email) => {
    return clientQuery(`INSERT INTO employee(first_name, last_name, email) 
                        VALUES($1, $2, $3)`, [firstName, lastName, email])
}


//Pool queries

export function queryProduct(productId) {
    return poolQuery(`SELECT * FROM product WHERE product_number = $1 LIMIT 1`, [productId])
}

export function queryCustomerCartItem(customerId, productId) {
    return poolQuery(`SELECT * FROM customer_cart_item WHERE customer_id=$1 AND product_id=$2`, [customerId, productId])
}

export function queryAddCustomerCartItem(customerId, productId) {
    return poolQuery(`INSERT INTO customer_cart_item(customer_id, product_id)
    VALUES ($1, $2)`, [customerId, productId])
}

export function queryProducts() {
    return poolQuery(`SELECT * FROM product`, [])
}

export function queryNProducts(n) {
    return poolQuery(`SELECT * FROM product LIMIT $1`, [n])
}

export function queryDeleteProduct(id) {
    return poolQuery(`DELETE FROM product WHERE product_number = $1`, [id])
}

export function queryDeleteCartItem(customerId, productId) {
    return poolQuery(`DELETE FROM customer_cart_item WHERE customer_id = $1 AND product_id = $2`, [customerId, productId])
}

export function queryTransactions() {
    return poolQuery(`
    SELECT * FROM transaction`)
}

export function queryCustomerTransactions(customerId) {
    return poolQuery(`
    SELECT * FROM transaction WHERE customer_id = $1`, [customerId])
}

export function queryProductReview(productId, customerId) {
    return poolQuery(`SELECT * FROM product_review WHERE product_id=$1 AND customer_id = $2`, [productId, customerId])
}

export function queryProductReviews(productId) {
    return poolQuery(`SELECT * FROM product_review WHERE product_id=$1`, [productId])
}

export function queryAddReview(productId, customerId, ratingNumber, reviewHeading, comment) {
    return poolQuery(`INSERT INTO product_review(product_id, customer_id, rating_number, review_heading, comment) 
                      VALUES($1, $2, $3, $4, $5)`, [productId, customerId, ratingNumber, reviewHeading, comment])
}

export function queryTopSellingProducts(category, productCount = 5) {
    if (category) {
        return poolQuery(`SELECT product.* FROM product, product_category, category
                          WHERE category.name =$1 AND product_category.category_id = category.name AND product_category.product_id = product.product_number
                          ORDER BY quantity_sold DESC LIMIT $2`, [category, productCount])
    } else {
        return poolQuery(`SELECT product.* FROM product, product_category, category
                          WHERE  product_category.category_id = category.name AND product_category.product_id = product.product_number
                          ORDER BY quantity_sold DESC LIMIT $1`, [productCount])
    }

}

export function queryTopCategories() {
    return poolQuery(`SELECT * FROM category`)
}

//Database transaction call functions

export function queryProductAndImages(productId) {
    client = new Client({
        connectionString: connectionString
    })
    return executeResultTransaction(async () => {
        return {
            product: await queryProductTransaction(productId),
            productImages: await queryImagesTransaction(productId)
        }
    })
}

export function queryAddProductAndImages(productId, productColumnArr, productCategories, mainImageName, secondaryImageNames) {
    client = new Client({
        connectionString: connectionString
    })
    return executeTransaction(async () => {
        await queryClientAddProduct(productColumnArr)
        await queryClientAddProductImageLink(productId, mainImageName, true)
        for (let i = 0; i < secondaryImageNames.length; i++) {
            await queryClientAddProductImageLink(productId, secondaryImageNames[i], false)
        }

        for (let i = 0; i < productCategories.length; i++) {
            await queryAddProductCategory(productId, productCategories[i])
        }
    })
}

export function queryBuyItems(boughtItems, customerId, totalCost, status, shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry) {
    client = new Client({
        connectionString: connectionString
    })
    return executeTransaction(async () => {
        const [transaction] = await queryAddTransaction(customerId, totalCost, status, shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry)

        for (let i = 0; i < boughtItems.length; i++) {
            let item = boughtItems[i]
            const [product] = await queryProductTransaction(item.productNumber)
            if (item.quantity > product.quantity) {
                throw new Error("Not enough product items")
            }
            await queryRemoveProductQuantities(item.productNumber, item.quantity);
            await queryAddProductQuantitiesSold(item.productNumber, item.quantity);
            await queryAddOrderLine(item.productNumber, transaction.confirmation_number, item.quantity, item.totalWeight, item.quantity * product.price, item.quantity * product.price * 1.075)
        }
    })
}

// export function queryTopSellingProducts

export function queryProductStats() {
    client = new Client({
        connectionString: connectionString
    })
    return executeResultTransaction(async () => {
        return {
            topSellingProducts: await queryTopSellingProductsTransaction(),
            fiveDayRevenue: await queryFiveDayRevenue()
        }
    })
}

export function queryCustomerCartItemProducts(customerId) {

    client = new Client({
        connectionString: connectionString
    })

    return executeResultTransaction(async () => {

        let customerCartItems = await queryCustomerCartItems(customerId)
        let cartProducts = []
        for (let i = 0; i < customerCartItems.length; i++) {
            let [product] = await queryProductTransaction(customerCartItems[i].product_id)
            cartProducts.push(product)
        }

        return cartProducts
    })
}

export function queryAddEmployeeUser(firstName, lastName, email, password) {
    client = new Client({
        connectionString: connectionString
    })

    return executeTransaction(async () => {
        await queryAddUser(email, password)
        await queryAddEmployee(firstName, lastName, email)
    })
}

export function queryAddCustomerUser(firstName, lastName, phoneNumber, email, password) {
    client = new Client({
        connectionString: connectionString
    })
    console.log(firstName, lastName,phoneNumber, email )
    return executeTransaction(async () => {
        await queryAddUser(email, password)
        await queryAddCustomer(firstName, lastName, email, phoneNumber)
    })
}

// export { queryProduct, queryProductAndImages, queryNProducts, queryProducts, queryAddProductAndImages, queryDeleteProduct, queryTransactions, queryBuyItems, queryCustomerTransactions, queryProductStats, queryCustomerCartItems, queryCustomerCartItem, queryAddCustomerCartItem, queryDeleteCartItem }