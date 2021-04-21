<?php
  require 'vendor/autoload.php';

  $inputMessage = file_get_contents(getenv('inputMessage'));
  $inputMessage = rtrim($inputMessage, "\n\r");
  $array = json_decode($inputMessage);

  $inputName = $array->{'VM Name'};
  $inputRegion = $array->{'Region'};
  $inputCores = $array->{'Cores'};
  $inputMemory = $array->{'Memory (GB)'};
  $ssd = $array->{'SSD [Yes/No]'};
  $inputNics = $array->{'NICs'};
  $inputData = $array->{'Max Disk Size (TB)'};
  $inputIops = $array->{'IOPS'};
  $inputThroughput = $array->{'Throughput (MB/s)'};
  $inputTemp = $array->{'Min Temp Disk Size (GB)'};
  $inputAvgcpupeak = $array->{'Peak CPU Usage (%)'};
  $inputAvgmempeak = $array->{'Peak Memory Usage (%)'};
  $inputCsvfile = $array->{'csvfile'};
  $inputCurrency = $array->{'Currency'};
  $inputContract = $array->{'Contract'};
  $inputBurstable = $array->{'Burstable'};
  
  // Do API Call for Compute
  $apiurl = getenv('getbestmatch');
  $bcnpriceapikey = getenv('bcnpriceAPIKEY');
  $querysuffix = "?burstable=$inputBurstable&maxresults=1&region=$inputRegion&cores=$inputCores&memory=$inputMemory&iops=$inputIops&data=$inputData&temp=$inputTemp&throughput=$inputThroughput&nics=$inputNics&ssd=$ssd&avgcpupeak=$inputAvgcpupeak&avgmempeak=$inputAvgmempeak&currency=$inputCurrency&contract=$inputContract";			
  $client     = new GuzzleHttp\Client();
  $api_url = $apiurl . $querysuffix;
  $client     = new GuzzleHttp\Client(['headers' => ['Ocp-Apim-Subscription-Key' => $bcnpriceapikey]]);
    try {
    $response = $client->request( 'POST', $api_url);
    $json =  $response->getBody()->getContents();
  } catch (GuzzleHttp\Exception\BadResponseException $e) {
    $response = $e->getResponse();
    $responseBodyAsString = $response->getBody()->getContents();
    print_r($responseBodyAsString);
    echo "Something went wrong :-(";
    exit(1);
  }

  $array = json_decode($json);
  foreach ($array as $key => $value) {
     $result = json_decode(json_encode($value), true);
  }

  // Do API Call for Storage
  $apiurl = getenv('getdiskmatch');
  $inputMaxDisks=$result['MaxDisks'];
  $adjustedData = $inputData * 1024; // Convert TB to GB (convention getDiskSize)
  $querysuffix = "?region=$inputRegion&iops=$inputIops&data=$adjustedData&throughput=$inputThroughput&currency=$inputCurrency&ssd=$ssd&maxdisks=$inputMaxDisks";			
  $client     = new GuzzleHttp\Client();
  $api_url = $apiurl . $querysuffix;
  $client     = new GuzzleHttp\Client(['headers' => ['Ocp-Apim-Subscription-Key' => $bcnpriceapikey]]);
    try {
    $response = $client->request( 'POST', $api_url);
    $json =  $response->getBody()->getContents();
  } catch (GuzzleHttp\Exception\BadResponseException $e) {
    $response = $e->getResponse();
    $responseBodyAsString = $response->getBody()->getContents();
    print_r($responseBodyAsString);
    echo "Something went wrong :-(";
    exit(1);
  }

  $arraydisk = json_decode($json);
  $resultdisk = json_decode(json_encode($arraydisk), true);
  
  // Start
  $output .= '{';
  $delimiter = ',';
  // Keys
  $output .= '"partitionKey" : "'.$inputCsvfile.'"';
  $output .= $delimiter.'"rowKey" : "'.$inputName.'"';
  // Original Values
  $output .= $delimiter.'"inputRegion" : "'.$inputRegion.'"';
  $output .= $delimiter.'"inputCores" : "'.$inputCores.'"';
  $output .= $delimiter.'"inputMemory" : "'.$inputMemory.'"';
  $output .= $delimiter.'"inputSsd" : "'.$ssd.'"';
  $output .= $delimiter.'"inputNics" : "'.$inputNics.'"';
  $output .= $delimiter.'"inputData" : "'.$inputData.'"';
  $output .= $delimiter.'"inputIops" : "'.$inputIops.'"';
  $output .= $delimiter.'"inputThroughput" : "'.$inputThroughput.'"';
  $output .= $delimiter.'"inputTemp" : "'.$inputTemp.'"';
  $output .= $delimiter.'"inputName" : "'.$inputName.'"';
  $output .= $delimiter.'"inputName" : "'.$inputName.'"';
  $output .= $delimiter.'"inputAvgcpupeak" : "'.$inputAvgcpupeak.'"';
  $output .= $delimiter.'"inputAvgmempeak" : "'.$inputAvgmempeak.'"';
  $output .= $delimiter.'"inputCurrency" : "'.$inputCurrency.'"';
  $output .= $delimiter.'"inputContract" : "'.$inputContract.'"';
  $output .= $delimiter.'"inputBurstable" : "'.$inputBurstable.'"';
  
  if (empty($result)) {
    echo "Result array is empty *exiting*";
    print_r($result);
    die(404);
  }

  // Get Results - Compute
  foreach ($result as $key => $value) {
    $key = str_replace("'", "", $key);
    $key = str_replace("(", "", $key);
    $key = str_replace(")", "", $key);
    $key = str_replace("/", "", $key);
    $key = str_replace(" ", "", $key);
    $output .= $delimiter.'"'.$key.'" : "'.$value.'"';
  }

  // Get Results - Disk
  /*foreach ($resultdisk as $key => $value) {
    $key = str_replace("'", "", $key);
    $key = str_replace("(", "", $key);
    $key = str_replace(")", "", $key);
    $key = str_replace("/", "", $key);
    $key = str_replace(" ", "", $key);
    $output .= $delimiter.'"'.$key.'" : "'.$value.'"';
  }*/
  $output .= $delimiter.'"DiskType" : "'.$resultdisk['Disk Type'].'"';
  $output .= $delimiter.'"DiskConfig" : "'.$resultdisk['Description'].'"';
  $output .= $delimiter.'"DiskConfigPrice" : "'.$resultdisk['Price / Month - for all disks'].'"';

  // Close
  $output .= '}';

  $res = getenv('outTable');

  // Save to Table Storage
  file_put_contents($res, $output);
?>