import * as dbStatement from "./dbStatements.js"
import { pool } from "./dbConfig.js";
import bodyParser from 'body-parser';
import multer from 'multer'
import bcrypt from "bcrypt"
import passport from "passport"
import session from "express-session"
import connectPgSimple from "connect-pg-simple"
// let initializePassport = require('./passport_config.js')
import { initialize as initializePassport } from "./passport_config.js"
import express from 'express';
import employee from "./routes/employee.js"
import * as responseHelpers from "./responseHelpers.js"
const pgSession = connectPgSimple(session)
const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

initializePassport(passport, async (username) => {
    return new Promise((resolve, reject) => {
        pool.query(`
          SELECT * FROM useraccount WHERE email=$1 LIMIT 1`
            , [username], (err, results) => {
                if (err) {
                    console.log(err)
                    return reject(err);
                } else {
                    console.log(results['rows'][0])
                    resolve(results['rows'][0])
                }
            }
        )
    })
},
    //   (id) => {
    //     return new Promise((resolve, reject) => {
    //       pool.query(`
    //           SELECT * FROM users WHERE id=$1 LIMIT 1`
    //         , [id], (err, results) => {
    //           if (err) {
    //             console.log(err)
    //             return reject(err);
    //           } else {
    //             resolve(results['rows'][0])
    //           }
    //         }
    //       )
    //     })
    //   }
);

app.use(session(
    {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 24 * 60 * 60 * 1000 },
        unset: "destroy",
        store: new pgSession({
            pool: pool,
            tableName: 'user_sessions',
        })
    }
))

app.use(passport.initialize())
app.use(passport.session())

app.use("/employee", employee)

const memoryUpload = multer({ storage: multer.memoryStorage() })

const PORT = 3000;
const PRODUCT_IMAGES_DIRECTORY = "product_images"

app.get("/", (req, res) => {

    const { category } = req.query
    // console.log(req.body)
    dbStatement.queryTopSellingProducts(category).then((topSellingProducts) => {
        //Might change to not be top categories
        dbStatement.queryTopCategories().then((topCategories) => {
            responseHelpers.sendDataResponse(res, {
                topSellingProducts,
                topCategories
            })
        }).catch((err) => {
            console.log(err)
            responseHelpers.sendError(res, "Error while getting top categories")
        })
    }).catch((err) => {
        console.log(err)
        responseHelpers.sendError(res, "Error while retrieving top selling products")
    })

    // let result = dbStatement.queryProductStats().then((products) => {
    //     responseHelpers.sendDataResponse(res, products)
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

    responseHelpers.sendDataResponse(res, result)
})

app.get("/products/:id", (req, res) => {

    const { id } = req.params
    dbStatement.queryProductAndImages(id).then((productAndImages) => {
        responseHelpers.sendDataResponse(res, productAndImages)
    }).catch((err) => {
        console.error(err)
        responseHelpers.sendError(res, "Error while getting product")
    })
})

app.delete("products/:id/remove_from_cart", (req, res) => {
    const { id: productId } = req.params
    const customerId = 1 // "GET_FROM_SESSION"

    dbStatement.queryDeleteCartItem(customerId, productId).then(() => {
        responseHelpers.sendSuccessResponse(res)
    }).catch((err) => {
        console.error(err)
        responseHelpers.sendError(res, "Error deleting cart item")
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
            responseHelpers.sendError(res, "Error while adding cart items")
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
        responseHelpers.sendError(res, "Error while fetching cart items")
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
        responseHelpers.sendError(res, "Error while buying item")
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
        responseHelpers.sendError(res, "Error while obtaining transactions")
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
        responseHelpers.sendError(res, "Error while adding review")
    });
})


//AUTHENTICATION

app.post("/register", async (req, res) => {
    const { first_name: firstName, last_name: lastName, phone_number: phoneNumber, email, password } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    dbStatement.queryAddCustomerUser(firstName, lastName, phoneNumber, email, hashedPassword).then(() => {
        responseHelpers.sendSuccessResponse(res)
    }).catch((err) => {
        console.log(err)
        responseHelpers.sendError(res, "Error while adding customer user")
    })

})

app.get("/login", (req, res) => {
    const { username, password } = req.body
    res.json({
        login: "page"
    })
})

app.post("/login", passport.authenticate('local', {
    successRedirect: "/user", //TODO:Change to user route after creating one. 
    failureRedirect: "/login",
}))

app.listen(PORT, () => {
    console.log("listening on port " + PORT)
})