module.exports = function(context, trigger) {

    var cores = trigger.query.cores;
    cores = (typeof cores !== 'undefined') ?  cores : 1;
    if ( cores <= 1 ) { cores = 1; }

    var memory = trigger.query.memory;
    memory = (typeof memory !== 'undefined') ?  memory : 1;
    if ( memory <= 1 ) { memory = 1; }
    memory = memory * 1024; //calculate MB from GB

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
    maxresults = (typeof maxresults !== 'undefined') ?  maxresults : 3;
    if ( maxresults <= 1 ) { maxresults = 1; }

    var ssd = trigger.query.ssd;
    ssd = (typeof ssd !== 'undefined') ?  ssd : "All";
    if (ssd == "yes") { ssd = "Yes"; }
    if (ssd == "no") { ssd = "No"; }
    if (ssd == "All") { ssd = "%"; }

    var avgcpupeak = trigger.query.avgcpupeak;
    avgcpupeak = (typeof avgcpupeak !== 'undefined') ?  avgcpupeak : 100;
    if (avgcpupeak > 0) { cores = cores * (avgcpupeak/100); }

    var avgmempeak = trigger.query.avgmempeak;
    avgmempeak = (typeof avgmempeak !== 'undefined') ?  avgmempeak : 100;
    if (avgmempeak > 0) { memory = memory * (avgmempeak/100); }

    var hana = trigger.query.hana;
    hana = (typeof hana !== 'undefined') ?  hana : "All";
    if (hana == "yes") { hana = "Yes"; }
    if (hana == "All") { hana = "%"; }

    var saps2t = trigger.query.saps2t;
    saps2t = (typeof saps2t !== 'undefined') ?  saps2t : 1;
    if ( saps2t <= 1 ) { saps2t = 1; }

    var saps3t = trigger.query.saps3t;
    saps3t = (typeof saps3t !== 'undefined') ?  saps3t : 1;
    if ( saps3t <= 1 ) { saps3t = 1; }

    var alasql = require('alasql');
	
	var csvdatafile = process.env.azurevmsizescsv;
   
    var query = "SELECT TOP " + maxresults + " Name, Type, SAPS2T as 'SAPS 2-Tier', SAPS3T as 'SAPS 3-Tier', HANA as 'HANA Supported?', ACU, SSD, NumberOfCores as Cores, MemoryInMB / 1024 as 'Memory (GB)', MaxNics as NICs, Bandwidth, MaxDataDiskCount as 'Max Disks', MaxDataDiskSizeGB / 1024 as 'Max Capacity (TB)', MaxVmIops as 'Max IOPS', MaxVmThroughputMBs as 'Max Throughput (MB/s)', TempDiskSizeInGB as 'Temp Disk (GB)' FROM CSV('" + csvdatafile + "', {headers:true}) WHERE " + cores + " <= NumberOfCores AND " + memory + " <= MemoryInMB AND SAPS2T NOT LIKE 'Not Supported' AND (" + nics + " <= MaxNics OR MaxNics LIKE 'Unknown') AND (" + data + " <= MaxDataDiskSizeGB OR MaxDataDiskSizeGB LIKE 'Unknown') AND (" + iops + " <= MaxVmIops OR MaxVmIops LIKE 'Unknown') AND (" + throughput + " <= MaxVmThroughputMBs OR MaxVmThroughputMBs LIKE 'Unknown') AND SSD LIKE '" + ssd + "' AND HANA LIKE '" + hana + "' AND (" + saps2t + " <= SAPS2T OR SAPS2T LIKE 'Unknown') AND (" + saps2t + " <= SAPS3T OR SAPS3T LIKE 'Unknown') ORDER BY SAPS2T, MemoryInMB ASC";

    var res = alasql.promise(query)
            .then(function(data){
                 context.res = data;
                 context.done();
            }).catch(function(err){
                 context.log('Error:', err);
            });
}