const jsonfile = require('jsonfile');
const _ = require('underscore');
const MongoClient = require('mongodb').MongoClient;

class OrdersUpdater {
  constructor(ordersArray) {
    this.orders = this.keyToExternalId(ordersArray);
    this.credentials = jsonfile.readFileSync('./credentials/mongo.json');
    this.now = Date.now().toString();
  }

  async updateAll() {
    const db = await this.connectToMongo();
    const collection = db.collection('orders');

    let dbOrders = await this.fetchDbOrders(collection);

    const batch = collection.initializeUnorderedBulkOp();
    this.generateBatchOperations(batch, dbOrders);

    const result = await batch.execute();

    await db.close();
  }

  generateBatchOperations(batch, dbOrders) {
    _.each(this.orders, (order, externalId) => {
      const dbOrder = dbOrders[externalId];

      if (dbOrder) {
        console.log(dbOrder);
        //const documentUpdate = this.documentToUpdate(order, dbOrder);
        //if (documentUpdate) {
          //batch.find({externalId: externalId}).update(documentUpdate);
        //}
      } else {
        batch.insert(this.newDbOrder(order));
      }
    });
  }

  newDbOrder(order) 
    const history = {};
    history[this.now] = {
      price: order.price,
      quantity: order.quantity
    };

    return {
      externalId: order.externalId,
      history: history
    };
  }

  async fetchDbOrders(collection) {
    try {
      const ordersArray = await collection.find({
        externalId: {$in: _.keys(this.orders)}
      }).toArray();

      return this.keyToExternalId(ordersArray);
    } catch (e) {
      console.log(e)
      process.exit(1);
    }
  }

  async connectToMongo() {
    try {
      return await MongoClient.connect(this.credentials.uri);
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  }

  async createIndex() {
    try {
      const db = await this.connectToMongo();
      const collection = db.collection('orders');

      collection.createIndex({ externalId: 1 }, { unique: true });

      db.close();
    } catch (e) {
      console.log(e);
      console.log('error creating index');
    }
  }

  async printIndexes() {
    try {
      const db = await this.connectToMongo();
      const collection = db.collection('orders');

      console.log(await collection.indexes());

      db.close();
    } catch (e) {
      console.log(e);
      console.log('error printing indexes');
    }
  }

  keyToExternalId(ordersArray) {
    let orders = {};

    _.each(ordersArray, (order) => {
      orders[order.externalId] = order;
    });

    return orders;
  }
}

module.exports = OrdersUpdater;
