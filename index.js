const express = require("express");
const cors = require("cors");
require("dotenv").config();
require('./db/config');
const User = require("./db/User");
const Product = require("./db/Product");
const { response } = require("express");
const Jwt = require('jsonwebtoken');
const jwtKey = process.env.jwtKey;

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
    origin: 'https://e-com-dasboard.netlify.app',
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/register", async (req, resp) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            resp.send({ result: "Something went wrong,Please try after sometime." })
        }
        resp.send({ result, auth: token })
    })
})

app.post("/login", async (req, resp) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "Something went wrong,Please try after sometime." })
                }
                resp.send({ user, auth: token })
            })
        } else {
            resp.send({ result: "No user found" })
        }
    } else {
        resp.send({ result: "No user found" })
    }
});

app.post("/add-product", async (req, resp) => {
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result);
});

app.get("/products", async (req, resp) => {
    const products = await Product.find();
    if (products.length > 0) {
        resp.send(products)
    } else {
        resp.send({ result: "No Product found" })
    }
});

app.delete("/product/:id", async (req, resp) => {
    let result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result)
});

app.get("/product/:id", async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id })
    if (result) {
        resp.send(result)
    } else {
        resp.send({ "result": "No Record Found" })
    }
})

app.put("/product/:id", async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )
    resp.send(result)
})

app.get('/products/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const userProducts = await Product.find({ userId: userId });
        res.json(userProducts);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get("/search/:key", async (req, resp) => {
    let result = await Product.find({
        "$or": [
            {
                name: { $regex: req.params.key }
            },
            {
                company: { $regex: req.params.key }
            },
            {
                category: { $regex: req.params.key }
            }
        ]
    });
    resp.send(result);
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});