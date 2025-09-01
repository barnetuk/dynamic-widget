<?php
// Base URL of .NET site
$baseUrl = "https://booking.londontaxis247.co.uk/OurVehicle/OurVehicle";

// Collect query params dynamically
$queryString = http_build_query($_GET);

// Final target URL
$url = $baseUrl . "?" . $queryString;

// Fetch content using cURL (better than file_get_contents)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

// Output directly
echo $response;
?>
