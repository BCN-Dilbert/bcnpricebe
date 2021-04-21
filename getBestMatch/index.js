module.exports = function(context, trigger) {
    var region = trigger.query.region;
    region = (typeof region !== 'undefined') ?  region : "%";
    if (region == "all") { region = "%"; }

    var tier = trigger.query.tier;
    tier = (typeof tier !== 'undefined') ?  tier : "standard";

    var ht = trigger.query.ht;
    ht = (typeof ht !== 'undefined') ?  ht : "all";
    if (ht == "yes") { ht = "Yes"; }
    if (ht == "no") { ht = "No"; }
	if (!ht.trim()) { ht = "%"; }
    if (ht == "all") { ht = "%"; }
    if (ht == "All") { ht = "%"; }

    var acu = trigger.query.acu;
    acu = (typeof acu !== 'undefined') ?  acu : 1;
    if ( acu <= 1 ) { acu = 1; }

    var cores = trigger.query.cores;
    cores = (typeof cores !== 'undefined') ?  cores : 0.1;
    if ( cores <= 0 ) { cores = 0.1; }

    var pcores = trigger.query.pcores;
    pcores = (typeof pcores !== 'undefined') ?  pcores : 0.1;
    if ( pcores <= 0 ) { pcores = 0.1; }

    var memory = trigger.query.memory;
    memory = (typeof memory !== 'undefined') ?  memory : 0.1;
    if ( memory <= 0 ) { memory = 0.1; }
    //memory = memory * 1024; //calculate MB from GB

    var iops = trigger.query.iops;
    iops = (typeof iops !== 'undefined') ?  iops : 1;
    if ( iops <= 1 ) { iops = 1; }

    var data = trigger.query.data;
    data = (typeof data !== 'undefined') ?  data : 1;
    if ( data <= 1 ) { data = 1; }
    data = data * 1024; //calculate GB from TB

    var temp = trigger.query.temp;
    temp = (typeof temp !== 'undefined') ?  temp : 1;
    if ( temp <= 1 ) { temp = 1; }

    var throughput = trigger.query.throughput;
    throughput = (typeof throughput !== 'undefined') ?  throughput : 1;
    if ( throughput <= 1 ) { throughput = 1; }

    var nics = trigger.query.nics;
    nics = (typeof nics !== 'undefined') ?  nics : 1;
    if ( nics <= 1 ) { nics = 1; }

    var maxresults = trigger.query.maxresults;
    maxresults = (typeof maxresults !== 'undefined') ?  maxresults : 5;
    if ( maxresults < 1 ) { maxresults = 5; }
    if ( maxresults > 100 ) { maxresults = 100; }

    var ssd = trigger.query.ssd;
    ssd = (typeof ssd !== 'undefined') ?  ssd : "No";
    if (ssd == "yes") { ssd = "Yes"; }
    if (ssd == "no") { ssd = "No"; }
	if (!ssd.trim()) { ssd = "%"; }
    if (ssd == "All") { ssd = "%"; }

    var avgcpupeak = trigger.query.avgcpupeak;
    avgcpupeak = (typeof avgcpupeak !== 'undefined') ?  avgcpupeak : 100;
    if (avgcpupeak > 0) { cores = cores * (avgcpupeak/100); }

    var avgmempeak = trigger.query.avgmempeak;
    avgmempeak = (typeof avgmempeak !== 'undefined') ?  avgmempeak : 100;
    if (avgmempeak > 0) { memory = memory * (avgmempeak/100); }
    
    if (cores < 0 ) { cores = 0.1; }
    if (memory < 0 ) { memory = 0.1; }

    var alasql = require('alasql');
	
	var csvdatafile = process.env.azurevmsizescsv;
	
    var query = "SELECT TOP " + maxresults + " name as Name, region as Region, price as 'Price (USD/Hour)', price * 200 as 'Price (USD/200h)', price * 744 as 'Price (USD/Month)', ACU, SSD, cores as Cores, pcores as pCores, mem as 'Memory (GB)', MaxNics as NICs, Bandwidth as 'Bandwidth (Mbps)', MaxDataDiskCount as 'Max Disks', MaxVmIops as 'Max IOPS', MaxVmThroughputMBs as 'Max Throughput (MB/s)' FROM CSV('" + csvdatafile + "', {headers:true}) WHERE " + cores + " <= cores AND " + pcores + " <= pcores AND " + memory + " <= mem AND SSD LIKE '" + ssd + "' AND region LIKE '" + region + "' AND (" + nics + " <= MaxNics OR MaxNics LIKE 'Unknown') AND (" + data + " <= MaxDataDiskSizeGB OR MaxDataDiskSizeGB LIKE 'Unknown') AND (" + iops + " <= MaxVmIops OR MaxVmIops LIKE 'Unknown') AND (" + throughput + " <= MaxVmThroughputMBs OR MaxVmThroughputMBs LIKE 'Unknown') AND (" + temp + " <= TempDiskSizeInGB OR TempDiskSizeInGB LIKE 'Unknown') AND price != 'Unknown' AND tier LIKE '" + tier + "' AND (" + acu + " <= ACU OR ACU LIKE 'Unknown') AND Hyperthreaded LIKE '" + ht + "' ORDER BY price ASC";
    
    var res = alasql.promise(query)
            .then(function(data){
                 context.res = data;
                 context.done();
            }).catch(function(err){
                 context.log('Error:', err);
            });
}