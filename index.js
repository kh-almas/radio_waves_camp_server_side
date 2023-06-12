const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.post('/jwt', (req, res) => {
    const user = req.body;
    const result = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res.send(result);
})

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error: true, message: "unauthorized access"});
    }

    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
            return res.status(402).send({error: true, message: "unauthorized access"});
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster.9zce0xe.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email: email }
    const user = await usersCollection.findOne(query);
    if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'porbidden message' });
    }
    next();
}

async function run() {
    try {
        const usersCollection = client.db("RadioWavesCamp").collection("users");
        const classCollection = client.db("RadioWavesCamp").collection("class");


        app.post('/users', async (req, res) => {
            const data = req.body;
            console.log(data);
            const result = await usersCollection.insertOne(data);
            res.send(result);
        })

        app.get('/class', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        })

        app.post('/class', async (req, res) => {
            const data = req.body;
            console.log(data);
            const result = await classCollection.insertOne(data);
            res.send(result);
        })

        app.delete('/class/:id', async (req, res) => {
            const data = req.params.id;
            const query = {_id: new ObjectId(data)};

            console.log(query);
            const result = await classCollection.deleteOne(query);
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server is ready');
})

app.listen(port, () => {
    console.log('server is ok')
})