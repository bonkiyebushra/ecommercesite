import * as dbStatement from "./dbStatements.js"
import bodyParser from 'body-parser';
import multer from 'multer'


// let bcrypt = require("bcrypt")
// let initializePassport = require('./passport_config.js')

import express from 'express';
const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

//Multer init

var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'product_images')
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname)
    }
})


const upload = multer({ storage: Storage })
const memoryUpload = multer({ storage: multer.memoryStorage() })
const PORT = 3000;
const PRODUCT_IMAGES_DIRECTORY = "product_images"

// Helper functions

function sendError(res, message) {
    res.json({
        "result": {
            success: false,
            message: message
        }
    })
}

function sendSuccessResponse(res) {
    res.json({
        "result": {
            success: true
        }
    })
}

function sendDataResponse(res, data) {
    res.json({
        "data": data
    })
}

app.get("/", (req, res) => {

    const { category } = req.query
    // console.log(req.body)

    dbStatement.queryTopSellingProductsByCategory(category).then((topSellingProducts) => {
        //Might change to not be top categories
        dbStatement.queryTopCategories().then((topCategories) => {
            sendDataResponse(res, {
                topSellingProducts,
                topCategories
            })
        }).catch((err) => {
            console.log(err)
            sendError(res, "Error while getting top categories")
        })
    }).catch((err) => {
        console.log(err)
        sendError(res, "Error while retrieving top selling products")
    })

    // let result = dbStatement.queryProductStats().then((products) => {
    //     sendDataResponse(res, products)
    // })
})

app.get("/search", (req, res) => {

    // let { q, sort_filter, category, price_min, price_max, result_count } = req.body

    let result = [{
        name: "Adidas Shoes",
        price: "95.0",
        main_image_link: "https://assets.adidas.com/images/w_600,f_auto,q_auto/4e894c2b76dd4c8e9013aafc016047af_9366/Superstar_Shoes_White_FV3284_01_standard.jpg"
    },
    {
        name: "shirt",
        price: "20.0",
        main_image_link: "https://cdn.rushordertees.com/design/ZoomImage.php?src=NTUyMTM2Mw_f&style=RT2000&colorCode=WHT&x=240&y=300&width=880&height=880&scale=1.7&watermark=false&autoInvertDesign=true"
    }]

    sendDataResponse(res, result)
})

app.get("/products/:id", (req, res) => {

    const { id } = req.params
    dbStatement.queryProductAndImages(id).then((productAndImages) => {
        sendDataResponse(res, productAndImages)
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error while getting product")
    })
})

app.delete("products/:id/remove_from_cart", (req, res) => {
    const { id: productId } = req.params
    const customerId = 1 // "GET_FROM_SESSION"

    dbStatement.queryDeleteCartItem(customerId, productId).then(() => {
        sendSuccessResponse(res)
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error deleting cart item")
    })

})

app.post("/products/:id/add_to_cart", (req, res) => {
    const { id: productId } = req.params
    const customerId = 1 // "GET_FROM_SESSION"
    console.log(productId)

    dbStatement.queryCustomerCartItem(customerId, productId).then((cartItem) => {
        dbStatement.queryAddCustomerCartItem(customerId, productId).then(() => {
            // res.redirect("/products/" + productId)
            res.json({
                "result": {
                    success: true
                }
            })
        }).catch((err) => {
            console.error(err)
            sendError(res, "Error while adding cart items")
        })
    })
})

app.get("/cart", (req, res) => {
    const customerId = 1 //"GET_FROM_SESSION"

    dbStatement.queryCustomerCartItemProducts(customerId).then((cartItems) => {
        res.json({
            "data": cartItems
        })
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error while fetching cart items")
    })
})

app.post("/buy", memoryUpload.none(), (req, res) => {
    const boughtItems = JSON.parse(req.body.products)
    const { customer_id: customerId, total_cost: totalCost, status, shipping_address: shippingAddress, shipping_city: shippingCity, shipping_state: shippingState, shipping_zip_code: shippingZipCode, shipping_country: shippingCountry } = req.body

    dbStatement.queryBuyItems(boughtItems, customerId, totalCost, status, shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry).then(() => {
        res.json({
            "result": {
                success: true
            }
        })
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error while buying item")
    })
})

app.get("/orders", (req, res) => {
    // const {customer_id:customerId} = req.body
    const customerId = "1"
    dbStatement.queryCustomerTransactions(customerId).then((transactions) => {
        res.json({
            "data": transactions
        })
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error while obtaining transactions")
    })
})

/* Employee Routes*/

app.get("/employee", (req, res) => {
    dbStatement.queryProductStats().then((stats) => {
        res.json({
            "data": stats
        })
    }).catch((err) => {
        console.error(err)
        sendError("Error occured retrieving product stats")
    })
})

app.get("/employee/products", (req, res) => {

    const { product_count: productCount } = req.query
    dbStatement.queryNProducts(productCount).then((products) => {
        res.json({
            "data": products
        })
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error occured while getting products")
    })
})

let productImageUploads = upload.fields([{ name: "main_image", maxCount: 1 }, { name: "other_image", maxCount: 12 }])

app.post("/employee/products", productImageUploads, (req, res) => {
    const { product_name: productName, product_number: productNumber, quantity, price, description, weight } = req.body;
    const productCategories = JSON.parse(req.body.categories)
    let productColumnArr = [productName, productNumber, quantity, "inactive", price, description, weight]
    let secondaryImageNames = req.files.other_image.map((other_image) => other_image.originalname)
    dbStatement.queryAddProductAndImages(productNumber, productColumnArr, productCategories,req.files.main_image[0].originalname, secondaryImageNames).then(() => {
        res.json({
            success: true,
        })
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error while adding product")
    })
})

app.get("/employee/products/:id/", (req, res) => {
    const { id } = req.params
    dbStatement.queryProduct(id).then((product) => {
        res.json({
            "data": product
        })
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error while fetching product")
    })
})

app.delete("/employee/products/:id", (req, res) => {
    const { id } = req.params
    dbStatement.queryDeleteProduct(id).then(() => {
        res.json({
            success: true,
        })
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error while deleting product")
    })
})

app.get("/employee/orders", (req, res) => {
    dbStatement.queryTransactions().then((transactions) => {
        res.json({
            "data": transactions
        })
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error while obtaining transactions")
    })
})

app.get("/products/:id/reviews", (req, res) => {
    const { id } = req.params
    dbStatement.queryProductReviews(id).then((reviews) => {
        res.json({
            "data": reviews
        })
    })
})

app.get("/products/:id/review", (req, res) => {
    const customerId = 1 //Get from session
    const { id } = req.params

    dbStatement.queryProductReview(id, customerId).then((review) => {
        res.json({
            "data": review
        })
    })
})

app.post("/products/:id/review", (req, res) => {
    const customerId = 1 //Get from session 
    const { id } = req.params

    // TODO: Check if customer has completed transaction for the product

    const { rating_number: ratingNumber, review_heading: reviewHeading, comment } = req.body
    dbStatement.queryAddReview(id, customerId, ratingNumber, reviewHeading, comment).then(() => {
        res.json({
            result: {
                success: true
            }
        })
    }).catch((err) => {
        console.error(err)
        sendError(res, "Error while adding review")
    });
})

app.listen(PORT, () => {
    console.log("listening on port " + PORT)
})