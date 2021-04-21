<?php
require 'vendor/autoload.php';

function getbestmatch($apiurl, $vm) {
	$result = "";
	$vmdetail = explode(",", $vm);
	
	/*
		* [0] => VM Name
		* [1] => Cores
		* [2] => Memory (GB)
		* [3] => SSD [Y/N]
		* [4] => NICs
		* [5] => Max Disk Size (TB)
		* [6] => IOPS
		* [7] => Throughput (MB/s)
		* [8] => Min Temp Disk Size (GB)
		* [9] => Peak CPU Usage (%)
		* [10] => Peak Memory Usage (%)
		* [11] => Region (all for any)
	*/
	
	$name = $vmdetail[0];
	$inputRegion = $vmdetail[1];
	$inputCores = $vmdetail[2];
	$inputMemory = $vmdetail[3];
	$ssd = $vmdetail[4];
	$inputNics = $vmdetail[5];
	$inputData = $vmdetail[6];
	$inputIops = $vmdetail[7];
	$inputThroughput = $vmdetail[8];
	$inputTemp = $vmdetail[9];
	$inputAvgcpupeak = $vmdetail[10];
	$inputAvgmempeak = $vmdetail[11];
	$inputCurrency = $vmdetail[12];
	
	// Do API Call
	$querysuffix = "?maxresults=1&region=$inputRegion&cores=$inputCores&memory=$inputMemory&iops=$inputIops&data=$inputData&temp=$inputTemp&throughput=$inputThroughput&nics=$inputNics&ssd=$ssd&avgcpupeak=$inputAvgcpupeak&avgmempeak=$inputAvgmempeak&currency=$inputCurrency";			
	$client     = new GuzzleHttp\Client();
	$api_url = $apiurl . $querysuffix;
	$bcnpriceapikey = getenv('bcnpriceAPIKEY');
	$client     = new GuzzleHttp\Client(['headers' => ['Ocp-Apim-Subscription-Key' => $bcnpriceapikey]]);
	try {
		$response = $client->request( 'POST', $api_url);
		$json =  $response->getBody()->getContents();
	} catch (GuzzleHttp\Exception\BadResponseException $e) {
		$response = $e->getResponse();
		$responseBodyAsString = $response->getBody()->getContents();
		print_r($responseBodyAsString);
		echo "Something went wrong :-(";
	}

	$array = json_decode($json);
	/*
	* Array
		* (
		* [0] => stdClass Object
		* (
		* [Name] => Basic_A1
		* [Region] => asia-pacific-east
		* ['Price (&euro;/Hour)'] => 0.023
		* ['Price (&euro;/200h)'] => 4.6
		* ['Price (&euro;/Month)'] => 17.112
		* [ACU] => 50
		* [SSD] => No
		* [Cores] => 1
		* ['Memory (GB)'] => 1.75
		* [NICs] => 2
		* [Bandwidth] => unknown
		* ['Max Disks'] => 2
		* ['Max Capacity (TB)'] => 8
		* ['Max IOPS'] => 600
		* ['Max Throughput (MB/s)'] => 120
		* ['Temp Disk (GB)'] => 40
		* )
	*/
	$result = json_decode(json_encode($array[0]), true);
	/*
		*  Array
		*  (
		*  [Name] => Basic_A1
		*  [Region] => asia-pacific-east
		*  ['Price (&euro;/Hour)'] => 0.023
		*  ['Price (&euro;/200h)'] => 4.6
		*  ['Price (&euro;/Month)'] => 17.112
		*  [ACU] => 50
		*  [SSD] => No
		*  [Cores] => 1
		*  ['Memory (GB)'] => 1.75
		*  [NICs] => 2
		*  [Bandwidth] => unknown
		*  ['Max Disks'] => 2
		*  ['Max Capacity (TB)'] => 8
		*  ['Max IOPS'] => 600
		*  ['Max Throughput (MB/s)'] => 120
		*  ['Temp Disk (GB)'] => 40
		*  )
	*/
	return trim($vmdetail[0]).",".trim($vmdetail[1]).",".trim($vmdetail[2]).",".trim($vmdetail[3]).",".trim($vmdetail[4]).",".trim($vmdetail[5]).",".trim($vmdetail[6]).",".trim($vmdetail[7]).",".trim($vmdetail[8]).",".trim($vmdetail[9]).",".trim($vmdetail[10]).",".trim($vmdetail[11]).",".trim($vmdetail[12]).",".trim($result['Name']).",".trim($result['ACU']).",".trim($result['\'Price (USD/Hour)\'']).",".trim($result['\'Price (USD/200h)\'']).",".trim($result['\'Price (USD/Month)\''])."\n";
}


$apiurl = getenv('getbestmatch');
$tmpfile = getenv('myBlob');
$input = file_get_contents($tmpfile);
$convert = explode("\n", $input);

$output = "";
$header = "";
$count=0;
foreach ( $convert as $vmcheck ) {
	if ($count > 0) {
		$output .= getbestmatch($apiurl, $vmcheck);
	} else {
		$header = $vmcheck;
		$header = str_replace("\n", "", $header);
		$output = trim($header).",VM Size,ACU,Price per Hour,Price for 100 hours,Price per 744 hours (~Month)\n";
	}
	$count++;
}

file_put_contents(getenv('outputBlob'), $output);
?>