const { Client } = pkg
import pkg from 'pg'
import { pool, connectionString } from "./dbConfig.js"
const PRODUCT_IMAGES_DIRECTORY = "product_images"
let client;

let poolQuery = (query, argsArray) => {
    return new Promise((resolve, reject) => pool.query(query
        , argsArray, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result.rows)
            }
        }))
}

let clientQuery = (query, argsArray) => {
    return new Promise((resolve, reject) => client.query(query
        , argsArray, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result.rows)
            }
        }))
}

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

const executeResultTransaction =async (callback) => {
    return new Promise(async (resolve, reject) => {
        await client.connect();
        try {
            await client.query('BEGIN');
            try {
                let result = await callback(client);
                await client.query('COMMIT');
                console.log(result)
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

let queryRemoveProductQuantities = (productId, quantity = 1) => {
    return clientQuery(`
    UPDATE product SET quantity = quantity - $1 WHERE product_number = $2;
    `, [quantity, productId])
}

let queryAddProductQuantitiesSold = (productId, quantity = 2) => {
    return clientQuery(`
    UPDATE product SET quantity_sold = quantity_sold + $1 WHERE product_number = $2;
    `, [quantity, productId])
}

let queryProduct = (productId) => {
    return poolQuery(`SELECT * FROM product WHERE product_number = $1 LIMIT 1`, [productId])
}

let queryTopSellingProducts = (productCount = 5) => {
    return clientQuery(`SELECT * FROM product ORDER BY quantity_sold DESC LIMIT $1`, [productCount])
}

let queryProductTransaction = (productId) => {
    return clientQuery(`SELECT * FROM product WHERE product_number = $1 LIMIT 1`, [productId])
}

let queryProducts = () => {
    return poolQuery(`SELECT * FROM product`, [])
}

let queryNProducts = (n) => {
    return poolQuery(`SELECT * FROM product LIMIT $1`, [n])
}

let queryClientAddProduct = (productColumnArr) => {
    return clientQuery(`INSERT INTO product(name, product_number, quantity, status, price,description,weight)
    VALUES ($1, $2, $3, $4, $5, $6, $7) returning product_number`, productColumnArr)
}

let queryClientAddProductImageLink = (productId, imageName, isMainImage) => {
    return clientQuery(`
    INSERT INTO product_image(product_id, link, is_main_image) 
    VALUES($1 ,$2, $3)
    `, [productId, "product_images/" + imageName, isMainImage], (req, res) => {
    })
}

let queryAddProductAndImages = (productId, productColumnArr, mainImageName, secondaryImageNames) => {
    client = new Client({
        connectionString: connectionString
    })
    return executeTransaction(async () => {
        await queryClientAddProduct(productColumnArr)
        await queryClientAddProductImageLink(productId, mainImageName, true)
        for (let i = 0; i < secondaryImageNames.length; i++) {
            await queryClientAddProductImageLink(productId, secondaryImageNames[i], false)
        }
    })
}

let queryDeleteProduct = (id) => {
    return poolQuery(`DELETE FROM product WHERE product_number = $1`, [id])
}

let queryTransactions = () => {
    return poolQuery(`
    SELECT * FROM transaction`)
}

let queryCustomerTransactions = (customerId) => {
    return poolQuery(`
    SELECT * FROM transaction WHERE customer_id = $1`, [customerId])
}

let queryAddTransaction = (customerId, totalCost, status, shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry) => {
    return clientQuery(`INSERT INTO transaction(customer_id, total_cost, transaction_status, shipping_address,shipping_city, shipping_state,shipping_zip_code, shipping_country)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING confirmation_number`, [customerId, totalCost, status, shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry])
}

let queryAddOrderLine = (productId, transactionId, quantity, weight, priceBeforeTax, priceAfterTax) => {
    return clientQuery(`INSERT INTO order_line(product_id, transaction_id, quantity, total_weight, price_before_tax, price_after_tax)
    VALUES($1, $2, $3, $4, $5, $6)`,
        [productId, transactionId, quantity, weight, priceBeforeTax, priceAfterTax])
}

let queryBuyItems = (boughtItems, customerId, totalCost, status, shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry) => {
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

            console.log(product)
            await queryAddOrderLine(item.productNumber, transaction.confirmation_number, item.quantity, item.totalWeight, item.quantity * product.price, item.quantity * product.price * 1.075)
        }
    })
}

let queryProductStats = () => {
    client = new Client({
        connectionString: connectionString
    })
    return executeResultTransaction(async () => {
        let stats = {}

        stats["top_selling_products"] = await queryTopSellingProducts()
        return stats
    })
}

export { queryProduct, queryNProducts, queryProducts, queryAddProductAndImages, queryDeleteProduct, queryTransactions, queryBuyItems, queryCustomerTransactions, queryProductStats }