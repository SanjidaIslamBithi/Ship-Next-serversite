const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f3zbe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('NextShopDB');
    //mongodb database name^

    //the name of all user collected in db is all users
    const usersCollection = database.collection('allUsers');

    //for products at home page
    const allproductsCollection = database.collection('allproducts');
    //review
    const reviewsCollection = database.collection('allReviews');
    //order
    const ordersCollection = database.collection('allOrders');
    // --------------------Review------------------
    // add Review
    app.post('/addReview', async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // get All Review
    app.get('/reviews', async (req, res) => {
      const cursor = reviewsCollection.find({}).sort({ _id: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    // -----------------Review code end--------------------------
    // -----------------Products code start-------------------------
    //to add product
    app.post('/addProduct', async (req, res) => {
      const productDetails = req.body;
      const result = await allproductsCollection.insertOne(productDetails);
      res.send(result);
    });

    //for allproduct to show in allProducts page from db
    app.get('/allproducts', async (req, res) => {
      const cursor = allproductsCollection.find({});
      const allproducts = await cursor.toArray();
      res.send(allproducts);
    });
    //getting products by id
    app.get('/allproducts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      // const cursor = allproductsCollection.find({});
      const allproducts = await allproductsCollection.findOne(query);
      res.send(allproducts);
    });

    //updating single Product by id
    app.put('/allproducts/:id', async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedProduct.name,
          price: updatedProduct.price,
          stock: updatedProduct.stock,
          description: updatedProduct.description,
          img: updatedProduct.img,
        },
      };
      const result = await allproductsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log('updating comment', req);
      res.json(result);
    });

    // delete product from the database
    app.delete('/allproducts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await allproductsCollection.deleteOne(query);
      res.json(result);

      if (result.deletedCount === 1) {
        console.log('Successfully deleted one document.');
      } else {
        console.log('No documents matched the query. Deleted 0 documents.');
      }
    });
    // --------------------Adding product, updating, deleting it----Ends------------

    // -----------Order related work------------------
    // get all orders
    app.get('/allOrders', async (req, res) => {
      const cursor = ordersCollection.find({});
      const orders = await cursor.toArray();
      res.send(orders);
    });
    // add Place Order details
    app.post('/addOrder', async (req, res) => {
      const orderDetails = req.body;
      const result = await ordersCollection.insertOne(orderDetails);
      res.send(result);
    });
    // find specific order by email
    app.get('/myOrders', (req, res) => {
      ordersCollection
        .find({ email: req.query.email })
        .toArray((err, documents) => {
          res.send(documents);
        });
    });

    // delete user order
    app.delete('/allOrders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);

      if (result.deletedCount === 1) {
        console.log('Successfully deleted one document.');
      } else {
        console.log('No documents matched the query. Deleted 0 documents.');
      }
    });

    // order status update | way 2
    app.put('/statusUpdate/:id', async (req, res) => {
      console.log(req.params.id);
      const filter = { _id: ObjectId(req.params.id) };
      const result = await ordersCollection.updateOne(filter, {
        $set: {
          status: 'Shipped',
        },
      });
      res.send(result);
      console.log(result);
    });
    // -------------------Order related work ends here------------------

    //------------User related work starts------------------------
    // finding the user is admin or not by email
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === 'admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    //user related work below:
    // add user
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);

      // console.log(result);
    });

    // update user collection when new user login throw google, and don't store duplicate
    app.put('/users', async (req, res) => {
      const user = req.body;
      console.log(user);
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // make admin by updating user role
    app.put('/users/admin', async (req, res) => {
      const user = req.body;
      // console.log('put', user);
      const filter = { email: user.email };
      const updateDoc = { $set: { role: 'admin' } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // -----------------User related work end here--------------------
    
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello P-300-START!');
});

app.listen(port, () => {
  console.log(`listening at ${port}`);
});
