import express from "express";
const app = express.Router();
import multer from 'multer'
import * as dbStatement from "../dbStatements.js"
import * as responseHelpers from "../responseHelpers.js"

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


/* Employee Routes*/

app.get("", (req, res) => {
    dbStatement.queryProductStats().then((stats) => {
        res.json({
            "data": stats
        })
    }).catch((err) => {
        console.error(err)
        responseHelpers.sendError("Error occured retrieving product stats")
    })
})

app.get("/products", (req, res) => {

    const { product_count: productCount } = req.query
    dbStatement.queryNProducts(productCount).then((products) => {
        res.json({
            "data": products
        })
    }).catch((err) => {
        console.error(err)
        responseHelpers.sendError(res, "Error occured while getting products")
    })
})

let productImageUploads = upload.fields([{ name: "main_image", maxCount: 1 }, { name: "other_image", maxCount: 12 }])

app.post("/products", productImageUploads, (req, res) => {
    const { product_name: productName, product_number: productNumber, quantity, price, description, weight } = req.body;
    const productCategories = JSON.parse(req.body.categories)
    let productColumnArr = [productName, productNumber, quantity, "inactive", price, description, weight]
    let secondaryImageNames = req.files.other_image.map((other_image) => other_image.originalname)
    dbStatement.queryAddProductAndImages(productNumber, productColumnArr, productCategories, req.files.main_image[0].originalname, secondaryImageNames).then(() => {
        res.json({
            success: true,
        })
    }).catch((err) => {
        console.error(err)
        responseHelpers.sendError(res, "Error while adding product")
    })
})

app.get("/products/:id/", (req, res) => {
    const { id } = req.params
    dbStatement.queryProduct(id).then((product) => {
        res.json({
            "data": product
        })
    }).catch((err) => {
        console.error(err)
        responseHelpers.sendError(res, "Error while fetching product")
    })
})

app.delete("/products/:id", (req, res) => {
    const { id } = req.params
    dbStatement.queryDeleteProduct(id).then(() => {
        res.json({
            success: true,
        })
    }).catch((err) => {
        console.error(err)
        responseHelpers.sendError(res, "Error while deleting product")
    })
})

app.get("/orders", (req, res) => {
    dbStatement.queryTransactions().then((transactions) => {
        res.json({
            "data": transactions
        })
    }).catch((err) => {
        console.error(err)
        responseHelpers.sendError(res, "Error while obtaining transactions")
    })
})

app.post("/register", async (req, res) => {
    const { first_name: firstName, last_name: lastName, email, password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)

    dbStatement.queryAddEmployeeUser(firstName, lastName, email, hashedPassword).then(()=> {
        responseHelpers.sendSuccessResponse(res)
    }).catch((err)=> {
        console.log(err)
        responseHelpers.sendError(res, "Error while adding employee user")
    })
})


export default app;