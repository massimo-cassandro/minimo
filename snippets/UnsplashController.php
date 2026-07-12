<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UnsplashController extends AbstractController
{

  #[Route('/get-unsplash', name: 'get_unsplash')]
  public function get(Request $request)
  {
    // $get = $request->query->all();
    // $src = $get['src'];
    $orientation = $request->query->get('orientation', 'landscape'); // landscape, portrait, squarish, null

    $allowed = ['landscape', 'portrait', 'squarish', null];
    if (!in_array($orientation, $allowed)) {
      $orientation = 'landscape';
    }

    $unsplash_access_key = 'xxxxxxx';
    $collections_ids = '3660951'; // comma separated list
    $count = null;

    $url = 'https://api.unsplash.com/photos/random' .
      "?client_id={$unsplash_access_key}" .
      "&collections={$collections_ids}" .
      ($orientation? "&orientation={$orientation}" : '') .
      ($count != null? "&count={$count}" : '');

    $json = file_get_contents($url);


    $response = new Response();
    $response->headers->set('Content-Type', 'application/json; charset=utf-8');
    $response->setContent($json);

    $env = $this->getParameter('kernel.environment');

    return $response;

  }

  #[Route('/unsplash-browser', name: 'unsplash_browser')]
  public function browse(Request $request)
  {
    $unsplash_access_key = 'xxxxxxx';

    $get = $request->query->all();

    $url = 'https://api.unsplash.com/search/photos' .
      "?client_id={$unsplash_access_key}";

    foreach($get as $key => $value) {
      $url .= '&' . rawurlencode($key) . '=' . rawurlencode($value);
    }

    $json = file_get_contents($url);

    $response = new Response();
    $response->headers->set('Content-Type', 'application/json; charset=utf-8');
    $response->setContent($json);

    $env = $this->getParameter('kernel.environment');

    return $response;

  }

}
