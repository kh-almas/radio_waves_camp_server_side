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
    // console.log(user);
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res.send({token: token});
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

        //store user data
        app.post('/users', async (req, res) => {
            const data = req.body;
            const result = await usersCollection.insertOne(data);
            res.send(result);
        })

        // For instructor
        app.get('/my-class/:email', verifyJWT , async (req, res) => {
            const TokenData = req.decoded.email;
            const urlParams = req.params.email;
            if(TokenData === urlParams){
                const result = await classCollection.find({instructorEmail: urlParams}).toArray();
                res.send(result);
            }else{
                return res.status(407).send({error: true, message: "unauthorized access"});
            }

        })

        // For instructor
        app.get('/class/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await classCollection.findOne(query);
            res.send(result);
        })

        // For instructor
        app.post('/class', async (req, res) => {
            const data = req.body;
            const result = await classCollection.insertOne(data);
            res.send(result);
        })

        // For instructor
        app.put('/class/:id/:email', verifyJWT , async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const TokenData = req.decoded.email;
            const urlParams = req.params.email;
            if(TokenData !== urlParams){
                return res.status(401).send({error: true, message: "unauthorized access"});
            }
            const query = {_id: new ObjectId(id)};
            const update = {
                $set: {
                    className: data.className,
                    availableSeats: data.availableSeats,
                    price: data.price,
                    img: data.img,
                    des: data.des,
                }
            };
            const result = await classCollection.updateOne(query, update);
            res.send(result);
        })

        // For instructor
        app.delete('/class/:id', async (req, res) => {
            const data = req.params.id;
            const query = {_id: new ObjectId(data)};
            const result = await classCollection.deleteOne(query);
            res.send(result);
        })

        // For admin
        app.get('/all-users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        // For admin
        app.put('/set-role/:id/:email', verifyJWT , async (req, res) => {
            const id = req.params.id;
            const TokenData = req.decoded.email;
            const urlParams = req.params.email;
            const data = req.body;

            // last admin can not change his role
            const role = await usersCollection.find({role: "admin"}).toArray();
            const roleCount = role.length;
            if((data.role === "instructor" || data.role === "user") && roleCount < 2){
                return res.status(344).send({error: true, message: "Last admin should not change his role"});
            }
            if(TokenData !== urlParams){
                return res.status(401).send({error: true, message: "unauthorized access"});
            }
            const query = {_id: new ObjectId(id)};
            const update = {
                $set: {
                    role: data.role,
                }
            };
            const result = await usersCollection.updateOne(query, update);
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