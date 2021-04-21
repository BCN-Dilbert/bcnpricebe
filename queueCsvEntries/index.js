const appInsights = require("applicationinsights");
appInsights.setup();
const client = appInsights.defaultClient;

module.exports = function (context, myBlob) {
  context.log("JavaScript blob trigger function processed blob \n Name:", context.bindingData.name, "\n Blob Size:", myBlob.length, "Bytes");
  var parse = require('csv-parse/lib/sync');
  var records = parse(myBlob, {columns: true});
  var output = "[ ";
  var delimiter = "";

  for (var index in records) {
    var vm = records[index];
    vm.csvfile = context.bindingData.name;
    output = output + delimiter + JSON.stringify(vm);
    delimiter = ",";
  }

  var reqRU = index * 40; // averge request charge is currently 39.49
  if (reqRU > 10000) { reqRU = 10000; }
  if (reqRU < 400) { reqRU = 400; }
  var https = require('https');

  var options = {
    host: process.env.apiscalecosmosdbhost,
    path: process.env.apiscalecosmosdbpath+'?ru='+reqRU,
    method: 'POST',
    headers: {'Ocp-Apim-Subscription-Key': process.env.bcnpriceAPIKEY}
  };
  var req = https.request(options, (res) => {
    context.log('statusCode: ' + res.statusCode);
    res.on('data', (d) => {
      context.log('output :' + d)
    });

    client.trackMetric({name: "csv-file-size", value: index});
    output = output + " ]";
    context.bindings.outputQueueItem = output;
    context.done();
  
  }).on('error', (e) => {
    context.log('error: ' + e);
    process.exit(1);
  });

  req.write("");
  req.end();
};