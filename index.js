const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

//middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qohz0wa.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    console.log('token inside jwt verify', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const usersCollection = client.db("furnitureWorld").collection("users");
        const categoriesCollection = client.db("furnitureWorld").collection("categories");
        const productsCollection = client.db("furnitureWorld").collection("products");
        const ordersCollection = client.db("furnitureWorld").collection("orders");
        const reportsCollection = client.db("furnitureWorld").collection("reports");
        const paymentsCollection = client.db("furnitureWorld").collection("payments");

        app.get('/categories', async (req, res) => {
            const query = {};
            const result = await categoriesCollection.find(query).project({ category_title: 1, _id: 1 }).toArray();
            res.send(result);
        });

        app.get('/categories/catproducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { product_category: id };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        app.get('/catCategories', async (req, res) => {
            const query = {};
            const result = await categoriesCollection.find(query).project({ category_title: 1, _id: 1 }).toArray();
            res.send(result);
        });
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
                return res.send({ accessToken: token });
            }
            // console.log(user);
            res.status(403).send({ accessToken: '' });
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        //for all seller
        app.get('/allseller', async (req, res) => {
            const query = { role: 'seller' };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.delete('/allseller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });

        app.put('/allseller/status/:id', async (req, res) => {
            const id = req.params.id;
            const state = req.body;
            console.log(id, state);
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: state.status
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        //for all buyer
        app.get('/allbuyer', async (req, res) => {
            const query = { role: 'buyer' };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.delete('/allbuyer/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });

        app.put('/allbuyer/status/:id', async (req, res) => {
            const id = req.params.id;
            const state = req.body;
            console.log(id, state);
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: state.status
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        //Report Item
        app.get('/reports', async (req, res) => {
            const query = {};
            const users = await reportsCollection.find(query).toArray();
            res.send(users);
        });
        app.delete('/reports/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await reportsCollection.deleteOne(filter);
            res.send(result);
        });
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const users = await usersCollection.findOne(query);
            res.send({ isAdmin: users?.role === 'admin' });
        });

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const users = await usersCollection.findOne(query);
            res.send({ isSeller: users?.role === 'seller' });
        });

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const users = await usersCollection.findOne(query);
            res.send({ isBuyer: users?.role === 'buyer' });
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/homecategories', async (req, res) => {
            const query = {};
            const options = {
                sort: { category_title: -1 }
            };
            const categories = await categoriesCollection.find(query, options).limit(3).toArray();
            res.send(categories);
        });

        app.get('/products', async (req, res) => {
            const query = {}
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const products = await productsCollection.find(query).toArray();
            console.log(products);
            res.send(products);
        });

        app.get('/products/:email', async (req, res) => {
            const email = req.params.email;
            const query = { seller_email: email };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        app.get('/advertisedproducts', async (req, res) => {
            const query = { advertised: "advertised", available: "available" };
            const products = await productsCollection.find(query).limit(3).toArray();
            res.send(products);
        });

        app.post('/addproduct', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        });

        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    available: 'sold'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        app.put('/products/promote/:id', async (req, res) => {
            const id = req.params.id;
            const state = req.body;
            console.log(id, state);
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertised: state.advertised
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { buyer_email: email };
            const products = await ordersCollection.find(query).toArray();
            res.send(products);
        });

        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const orders = await ordersCollection.findOne(query);
            res.send(orders);
        });

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(filter);
            res.send(result);
        });
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });

        //for payment


        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ],

            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updateResult = await ordersCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        app.post('/report', async (req, res) => {
            const order = req.body;
            const result = await reportsCollection.insertOne(order);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(error => console.log(error))


app.get('/', (req, res) => {
    res.send('furnitureWorld server');
});


app.listen(port, () => {
    console.log(`furnitureWorld server running on port : ${port}`)
});