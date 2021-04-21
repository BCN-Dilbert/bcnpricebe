const appInsights = require("applicationinsights");
appInsights.setup();
const client = appInsights.defaultClient;

module.exports = function(context, trigger) {
  var vmsize = trigger.query.vmsize;
  client.trackMetric({name: "getdetail-vmsize-name", value: vmsize});

  var url = process.env.bcnpricedb;

  var MongoClient = require('mongodb').MongoClient,
  test = require('assert');
  MongoClient.connect(url, function(err, db) {
    var collection = db.collection('bcnpricedb');
    collection.find({'name': vmsize}).toArray(function(err, docs) {
      db.close();
      context.log(docs);
      context.res = docs;
      context.done();
    });
  });

}