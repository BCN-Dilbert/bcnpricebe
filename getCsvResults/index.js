const appInsights = require("applicationinsights");
appInsights.setup();
const client = appInsights.defaultClient;

module.exports = function (context, req) {
  client.trackMetric({name: "csv-file-name", value: req.params.csvfile});
  context.res = {
    body: context.bindings.inTable,
    headers: {
     'Content-Type': 'application/json'
    }
  };
  context.done();
};