import { pool } from "./dbConfig.js"
import bodyParser from 'body-parser';
// let bcrypt = require("bcrypt")
// let initializePassport = require('./passport_config.js')

import express from 'express';
const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {

    const { category } = req.body

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
    console.log("Hi")
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
            result,
            total:""
        }
    })
})

app.listen(PORT, () => {
    console.log("listening on port " + PORT)
})