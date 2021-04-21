module.exports = function(context, trigger) {
  var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

  var url = process.env.bcnpricedb;

  var contract = trigger.query.contract;
  contract = (typeof contract !== 'undefined') ?  contract : "payg";
  contract = contract.toLowerCase();

  var currency = trigger.query.currency;
  currency = (typeof currency !== 'undefined') ?  currency : "EUR";
  if (currency == "") { var currency = "EUR"; }
  var price = "price_"+currency;

  var region = trigger.query.region;
  region = (typeof region !== 'undefined') ?  region : "europe-north";
  if (region == "all") { var region = ""; }
  if (region == "All") { var region = ""; }

  var tier = trigger.query.tier;
  tier = (typeof tier !== 'undefined') ?  tier : "standard";

  var ht = trigger.query.ht;
  ht = (typeof ht !== 'undefined') ?  ht : "all";
  if (!ht.trim()) { ht = "all"; }
  switch(ht.toLowerCase()) {
    case "yes":
      var ht1 = "Yes";
      var ht2 = "Yes";
      break;
    case "no":
      var ht1 = "Yes";
      var ht2 = "No";
      break;
    default:
      var ht1 = "Yes";
      var ht2 = "No";
  }

  var acu = trigger.query.acu;
  acu = (typeof acu !== 'undefined') ?  acu : -127;
  if ( acu == '' ) { acu = -127; }
  acu = parseInt(acu);

  var cores = trigger.query.cores;
  cores = (typeof cores !== 'undefined') ?  cores : 0;
  if ( cores <= 0 ) { cores = 0; }
  cores = parseInt(cores);

  var pcores = trigger.query.pcores;
  pcores = (typeof pcores !== 'undefined') ?  pcores : 0;
  if ( pcores <= 0 ) { pcores = 0; }
  pcores = parseInt(pcores);

  var memory = trigger.query.memory;
  memory = (typeof memory !== 'undefined') ?  memory : 0;
  if ( memory <= 0 ) { memory = 0; }
  memory = parseInt(memory);

  var iops = trigger.query.iops;
  iops = (typeof iops !== 'undefined') ?  iops : -127;
  if ( iops == '' ) { iops = -127; }
  iops = parseInt(iops);

  var data = trigger.query.data;
  data = (typeof data !== 'undefined') ?  data : -127;
  if ( data == '' ) { data = -127; }
  data = data * 1024; //calculate GB from TB
  data = parseInt(data);
  
  var temp = trigger.query.temp;
  temp = (typeof temp !== 'undefined') ?  temp : -127;
  if ( temp == '' ) { temp = -127; }
  temp = parseInt(temp);

  var throughput = trigger.query.throughput;
  throughput = (typeof throughput !== 'undefined') ?  throughput : -127;
  if ( throughput == '' ) { throughput = -127; }
  throughput = parseInt(throughput);

  var nics = trigger.query.nics;
  nics = (typeof nics !== 'undefined') ?  nics : -127;
  if ( nics == '' ) { nics = -127; }
  nics = parseInt(nics); 

  var maxresults = trigger.query.maxresults;
  maxresults = (typeof maxresults !== 'undefined') ?  maxresults : 5;
  if ( maxresults < 1 ) { maxresults = 5; }
  if ( maxresults > 100 ) { maxresults = 100; }
  maxresults = parseInt(maxresults);

  var ssd = trigger.query.ssd;
  ssd = (typeof ssd !== 'undefined') ?  ssd : "All";
  switch(ssd.toLowerCase()) {
    case "yes":
      var ssd1 = "Yes";
      var ssd2 = "Yes";
      break;
    case "no":
      var ssd1 = "No";
      var ssd2 = "No";
      break;
    default:
      var ssd1 = "Yes";
      var ssd2 = "No";
  }

  var burstable = trigger.query.burstable;
  burstable = (typeof burstable !== 'undefined') ? burstable : "All";
  switch(burstable.toLowerCase()) {
    case "yes":
      var burst1 = "Yes";
      var burst2 = "Yes";
      break;
    case "no":
      var burst1 = "No";
      var burst2 = "No";
      break;
    default:
      var burst1 = "Yes";
      var burst2 = "No";
    }

    var isolated = trigger.query.isolated;
    isolated = (typeof isolated !== 'undefined') ? isolated : "All";
    switch (isolated.toLowerCase()) {
        case "yes":
            var iso1 = "Yes";
            var iso2 = "Yes";
            break;
        case "no":
            var iso1 = "No";
            var iso2 = "No";
            break;
        default:
            var iso1 = "Yes";
            var iso2 = "No";
    }

  var avgcpupeak = trigger.query.avgcpupeak;
  avgcpupeak = (typeof avgcpupeak !== 'undefined') ?  avgcpupeak : 100;
  if ( avgcpupeak == '' ) { avgcpupeak = 100; }
  avgcpupeak = parseInt(avgcpupeak);
  if (avgcpupeak > 0) { cores = cores * (avgcpupeak/100); }

  var avgmempeak = trigger.query.avgmempeak;
  avgmempeak = (typeof avgmempeak !== 'undefined') ?  avgmempeak : 100;
  if ( avgmempeak == '' ) { avgmempeak = 100; }
  avgmempeak = parseInt(avgmempeak);
  if (avgmempeak > 0) { memory = memory * (avgmempeak/100); }
    
  if (cores < 0 ) { cores = 0; }
  if (memory < 0 ) { memory = 0; }

  var sort = "price";
  var index = 0;
  var output = {};

  var findVms = function(db, callback) {
    var cursor = db.collection('bcnpricedb').find( 
      { $and: 
        [ 
          { "tier": tier, 
            "type": 'vm',
            "region": new RegExp('^' + region),
            "contract": contract,
            "cores": { $gte: cores },
            "pcores": { $gte: pcores }, 
            "mem": { $gte: memory }, 
            "SSD": { $in: [ssd1, ssd2] },
            "Hyperthreaded": { $in: [ht1, ht2] },
            "burstable": { $in: [burst1, burst2] },
            "isolated": { $in: [iso1, iso2] },
            "MaxNics": { $gte: nics },
            "ACU": { $gte: acu },
            "MaxDataDiskSizeGB": { $gte: data },
            "MaxVmIops": { $gte: iops },
            "MaxVmThroughputMBs": { $gte: throughput },
            "TempDiskSizeInGB": { $gte: temp }
          } 
        ] 
      } ).sort({'price': 1}).limit(maxresults);
    cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
        db.command({getLastRequestStatistics:1}).then(result => {
          context.log.metric("RequestCharge", result.RequestCharge); 
          context.log("RequestCharge:"+result.RequestCharge); 
        })
        .catch(error => {
          context.log(error);
        });
        index++;
        var filtered = { };
        filtered["Name"] = doc["name"];
        filtered["Region"] = doc["region"];
        filtered["Contract"] = doc["contract"];
        filtered["Price ("+currency+"/Hour)"] = doc[price];
        filtered["Price ("+currency+"/200h)"] = doc[price] * 200;
        filtered["Price ("+currency+"/Month)"] = doc[price] * 730;
        filtered["ACU"] = doc["ACU"];
        filtered["SSD"] = doc["SSD"];
        filtered["Cores"] = doc["cores"];
        filtered["pCores"] = doc["pcores"];
        filtered["Memory (GB)"] = doc["mem"];
        filtered["NICs"] = doc["MaxNics"];
        filtered["Bandwidth (Mbps)"] = doc["Bandwidth"];
        filtered["Max Disks"] = doc["MaxDataDiskCount"];
        filtered["Max IOPS"] = doc["MaxVmIops"];
        filtered["Max Throughput (MB/s)"] = doc["MaxVmThroughputMBs"];
        output[index] = filtered;
      } else {
        callback();
      }
    });
  };

  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    findVms(db, function() {
      db.close();
      //context.log(output);
      context.res = output;
      context.done();
    });
  });
}