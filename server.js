import { queryProduct, queryNProducts, queryProducts, queryAddProductAndImages, queryDeleteProduct, queryTransactions, queryBuyItems, queryCustomerTransactions, queryProductStats } from "./dbStatements.js";
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

app.get("/", (req, res) => {

    const { category } = req.body
    console.log(req.body)

    let result = queryProductStats().then((products)=> {
        res.json({
            "data": products
        })
    })
})

app.get("/search", (req, res) => {

    let { q, sort_filter, category, price_min, price_max, result_count } = req.body

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

    res.json({
        "data": result
    })
})

app.get("/products/:id", (req, res) => {

    const { id } = req.params
    let result = {
        name: "Adidas Shoes",
        price: "$95.0",
        main_image_links: [{
            link: "https://assets.adidas.com/images/w_600,f_auto,q_auto/4e894c2b76dd4c8e9013aafc016047af_9366/Superstar_Shoes_White_FV3284_01_standard.jpg",
            is_main_image: true
        }]
    }

    res.json(result)
})

app.post("/products/:id/add_to_cart", (req, res) => {
    const { id } = req.params
    const customer_id = "GET_FROM_SESSION"
    res.redirect("/products/" + id)
})

app.get("/cart", (req, res) => {
    const customer_id = "GET_FROM_SESSION"

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

    res.json({
        "data": {
            result: "",
            total: ""
        }
    })
})

app.post("/buy", memoryUpload.none(), (req, res) => {
    const boughtItems = JSON.parse(req.body.products)
    const { customer_id: customerId, total_cost: totalCost, status, shipping_address: shippingAddress, shipping_city: shippingCity, shipping_state: shippingState, shipping_zip_code: shippingZipCode, shipping_country: shippingCountry } = req.body

    queryBuyItems(boughtItems, customerId, totalCost, status, shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry).then(() => {
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
    queryCustomerTransactions(customerId).then((transactions) => {
        res.json({
            "data": transactions
        })
    }).catch((err) => {
        console.log(err)
        sendError(res, "Error while obtaining transactions")
    })
})


/* Employee Routes*/

app.get("/employee", (req, res) => {
    queryProductStats().then((stats)=> {
        res.json({
            "data": stats
        })
    }).catch((err)=> {
        console.log(err)
        sendError("Error occured retrieving product stats")
    })
    
})

app.get("/employee/products", (req, res) => {
    queryProducts().then((products) => {
        res.json({
            "data": products
        })
    }).catch((err) => {
        console.log(err)
        sendError(res, "Error occured while getting products")
    })
})

let productImageUploads = upload.fields([{ name: "main_image", maxCount: 1 }, { name: "other_image", maxCount: 12 }])

app.post("/employee/products", productImageUploads, (req, res) => {
    const { product_name: productName, product_number: productNumber, quantity, price, description, weight } = req.body;

    let productColumnArr = [productName, productNumber, quantity, "inactive", price, description, weight]
    let secondaryImageNames = req.files.other_image.map((other_image) => other_image.originalname)
    queryAddProductAndImages(productNumber, productColumnArr, req.files.main_image[0].originalname, secondaryImageNames).then(() => {
        res.json({
            success: true,
        })
    }).catch((err) => {
        console.log(err)
        sendError(res, "Error while adding product")
    })
})

app.get("/employee/products/:id/", (req, res) => {
    const { id } = req.params
    console.log(id)
    queryProduct(id).then((product) => {
        console.log(product);
        res.json({
            "data": product
        })
    }).catch((err) => {
        console.log(err)
        sendError(res, "Error while fetching product")
    })
})

app.delete("/employee/products/:id", (req, res) => {
    const { id } = req.params
    queryDeleteProduct(id).then(() => {
        res.json({
            success: true,
        })
    }).catch((err) => {
        console.log(err)
        sendError(res, "Error while deleting product")
    })
})

app.get("/employee/orders", (req, res) => {
    queryTransactions().then((transactions) => {
        res.json({
            "data": transactions
        })
    }).catch((err) => {
        console.log(err)
        sendError(res, "Error while obtaining transactions")
    })
})

app.listen(PORT, () => {
    console.log("listening on port " + PORT)
})