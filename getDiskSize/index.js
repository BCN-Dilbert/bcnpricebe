module.exports = function(context, trigger) {
  
    // Input Parameters
  
    // * Currency
      var currency = trigger.query.currency;
    currency = (typeof currency !== 'undefined') ?  currency : "EUR";
    if (currency == "") { var currency = "EUR"; }
    var price = "price_"+currency;
  
    // * Region
    var region = trigger.query.region;
    region = (typeof region !== 'undefined') ?  region : "europe-north";
    if (region == "all") { var region = ""; }
    if (region == "All") { var region = ""; }
  
    // * Premium, Standard or All
    var ssd = trigger.query.ssd;
    ssd = (typeof ssd !== 'undefined') ?  ssd : "All";
    switch(ssd.toLowerCase()) {
      case "yes":
        var dskType = "premium";
        break;
      case "no":
        var dskType = "standard";
        break;
      default:
        var dskType = "All";
    }
  
    // * Throughput
    var throughput = trigger.query.throughput;
    throughput = (typeof throughput !== 'undefined') ?  throughput : 1;
    if ( throughput == '' ) { throughput = 1; }
    throughput = parseInt(throughput);
  
    // * IOPS
    var iops = trigger.query.iops;
    iops = (typeof iops !== 'undefined') ?  iops : 1;
    if ( iops == '' ) { iops = 1; }
    iops = parseInt(iops);
  
    // * Capacity
    var data = trigger.query.data;
    data = (typeof data !== 'undefined') ?  data : 1;
    if ( data == '' ) { data = 1; }
    data = parseInt(data);
  
    // * Max Disk Count
    var maxdisks = trigger.query.maxdisks;
    maxdisks = (typeof maxdisks !== 'undefined') ?  maxdisks : 999;
    if ( maxdisks == '' ) { maxdisks = 999; }
    maxdisks = parseInt(maxdisks);
  
    // Map Input to Used/Readable Variables
    var dskCapacity = data;
    var dskIOPS = iops;
    var dskThroughput = throughput;
    var dskMaxCount = maxdisks;
  
    // Initiliaze
    // * Get Disks info from MongoDB
    var index = 0;
    var output = {};
    var url = process.env.bcnpricedb;
    var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
    var findVms = function(db, callback) {
      var cursor =db.collection('bcnpricedb').find( { "type": "disk", "region": region } );
      cursor.each(function(err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            if (index === 0) {
              db.command({getLastRequestStatistics:1}).then(result => {
                context.log.metric("RequestCharge", result.RequestCharge); 
                context.log("RequestCharge:"+result.RequestCharge); 
              })
              .catch(error => {
                context.log(error);
              });
            }
            index++;
            output[index] = doc;
        } else {
            callback();
        }
      });
    };
  
    MongoClient.connect(url, function(err, db) {
      assert.equal(null, err);
      findVms(db, function() {
        db.close();
  
        // * Parameters
        var disks = output;
        var dskCount = 999999999;
        var dskPrice = 999999999;
        var dskName = "";
  
        // "Brute force" calculations
        for(var index in disks){
          var disk = disks[index];
          if (disk.tier == dskType || dskType == "All") {
            capCount = Math.ceil(dskCapacity / disk.MaxDataDiskSizeGB);
            iopsCount = Math.ceil(dskIOPS / disk.MaxDataDiskIops);
            throughCount = Math.ceil(dskThroughput / disk.MaxDataDiskThroughputMBs);
            tmpCount = Math.max(capCount, iopsCount, throughCount);
            tmpPrice = tmpCount * disk.price;
            if (tmpPrice < dskPrice && tmpCount <= dskMaxCount) {
              dskName = disk.size;
              dskCount = tmpCount;
              dskPrice = tmpPrice;
              tmpCapacity = disk.MaxDataDiskSizeGB;
              tmpIops = disk.MaxDataDiskIops;
              tmpThroughput = disk.MaxDataDiskThroughputMBs;
              tmpTier = disk.tier;
              switch(currency.toLowerCase()) {
                case "eur":
                  currencyPrice = disk.price_EUR * tmpCount;
                  break;
                case "usd":
                  currencyPrice = disk.price_USD * tmpCount;
                  break;
                case "gbp":
                  currencyPrice = disk.price_GBP * tmpCount;
                  break;
                case "aud":
                  currencyPrice = disk.price_AUD * tmpCount;
                  break;
                case "jpy":
                  currencyPrice = disk.price_JPY * tmpCount;
                  break;
                case "cad":
                  currencyPrice = disk.price_CAD * tmpCount;
                  break;
                case "dkk":
                  currencyPrice = disk.price_DKK * tmpCount;
                  break;
                case "chf":
                  currencyPrice = disk.price_CHF * tmpCount;
                  break;
                case "sek":
                  currencyPrice = disk.price_SEK * tmpCount;
                  break;
                case "idr":
                  currencyPrice = disk.price_IDR * tmpCount;
                  break;
                case "inr":
                  currencyPrice = disk.price_INR * tmpCount;
                  break;
                default:
                  currencyPrice = disk.price_EUR * tmpCount;
                  currency = "EUR";
              }
            }
          }
        }
  
        // Check if a result was found
        if (dskName == "") {
          dskName = "No option found";
          dskCount = "";
          currencyPrice = "";
          tmpCapacity = "";
          tmpIops = "";
          tmpThroughput = "";
          tmpTier = "";
        }
  
        // Prep json output
        var responseData = {};
        responseData['Disk T-Shirt Size']  = dskName;
        responseData['Disk Type']  = tmpTier;
        responseData['Capacity (GB) - per disk']  = tmpCapacity;
        responseData['IOPS (IO/s) - per disk'] = tmpIops;
        responseData['Througput (MB/s) - per disk']  = tmpThroughput;
        responseData['Number of Disks'] = dskCount;
        responseData['Capacity (GB) - for all disks']  = tmpCapacity * dskCount;
        responseData['IOPS (IO/s) - for all disks'] = tmpIops * dskCount;
        responseData['Througput (MB/s) - for all disks']  = tmpThroughput * dskCount;
        responseData['Description'] = "A raid0 / stripe of "+dskCount+" disks of type "+dskName;
        responseData['Price / Month - for all disks']  = currencyPrice;
        responseData['Currency']  = currency;
  
        // Return output
        //context.log(responseData);
        context.res = responseData;
        context.done();
  
      });
    });
  
  }