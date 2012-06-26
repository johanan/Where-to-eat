<?php
// Initialize session and set URL.
if(isset($_GET['query']))
{
	$query = $_GET['query'];
}else{
	$query = 'restaurant';
}
$fsConfig = array();
$fsConfig['apiKey'] = 'NQNF2JL2VKJHXETAOND5TPJ23A2SWGZC4TXJEMLGJBXYMIJM';
$fsConfig['apiSecret'] = 'TF1CC0HZVBJ0TM50CRNJNTWSOWZMIKQ30V4DEB4GC2UWZ3KM';
$url = 'https://api.foursquare.com/v2/venues/search?ll=' . $_GET['ll'] . '&client_id=' . $fsConfig['apiKey'] . '&client_secret=' . $fsConfig['apiSecret'] . '&query=' . $query . '&limit=50';
$ch = curl_init($url);
//curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// Set so curl_exec returns the result instead of outputting it.
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Get the response and close the channel.
$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>