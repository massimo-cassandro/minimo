<?php

$mode = isset($_GET['m'])? $_GET['m'] : null;

$UNSPLASH_ACCESS_KEY='gdZ1NlNlt35SPnTfe2ycJYqPUMB0eMF59MVYqV3HgOQ'; // mgm

// demo key
// $UNSPLASH_ACCESS_KEY='VPIzDRE8xBLZf77qo9_nHs1pBQIm8P1PGqu3qHRVUNU'; // mgm ???
// 'MfLQb0hbg-7o4dAcbRCczGFmGeHXdMAme-lbUmi_t9g'; // mbn

switch ($mode) {

  case 'fjh6uhck': // food
    // comma separated list
    $COLLECTIONS_IDS = 'OASjmaGzTus'; // https://unsplash.com/it/collezioni/OASjmaGzTus/cibi-e-bevande
    $orientation = null;
    $count = 8;
    break;

  case 'tfc4lmFw': // world
  default:
    // comma separated list
    $COLLECTIONS_IDS = '3660951'; // https://unsplash.com/it/collezioni/3660951/world
    $orientation = null;
    $count = null;
    break;
}

// $orientation override
if(isset($_GET['orientation'])) {
  $orientation = $_GET['orientation'];
}
// $COLLECTIONS_IDS override
if(isset($_GET['collection_ids'])) {
  $COLLECTIONS_IDS = $_GET['collection_ids'];
}

$url = 'https://api.unsplash.com/photos/random' .
  "?client_id={$UNSPLASH_ACCESS_KEY}" .
  "&collections={$COLLECTIONS_IDS}" .
  ($orientation? "&orientation={$orientation}" : '') . // landscape, portrait, squarish
  ($count != null? "&count={$count}" : '');


// $json = file_get_contents($url);

$ch = curl_init();
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_URL, $url);
$json = curl_exec($ch);
curl_close($ch);


//header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Origin: https://massimo-cassandro.github.io');
header("Content-Type: application/json; charset=utf-8");
echo $json;
