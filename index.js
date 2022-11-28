const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

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

        app.get('/categories', async (req, res) => {
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

        app.get('/products', async (req, res) => {
            const query = {}
            const products = await productsCollection.find(query).toArray();
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