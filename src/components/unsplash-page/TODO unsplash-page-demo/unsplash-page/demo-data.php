<?php
// proxy to bypass cors limitation in local testing

header('Access-Control-Allow-Origin: *');
header("Content-Type: application/json; charset=utf-8");
echo file_get_contents('https://primominuto.altervista.org/proxy/getUnsplashPhotos.php');
