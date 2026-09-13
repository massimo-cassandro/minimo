<?php

/*
 * iviewer.php
 * ------------------------------------------------------------------
 * Versione "plain PHP" (nessun framework) del visualizzatore immagini,
 * riscritta usando l'estensione GD al posto di Imagick.
 *
 * Uso: puntare la rotta /iviewer a questo file (con un rewrite del
 * webserver, oppure semplicemente chiamandolo come iviewer.php?src=...).
 *
 * Parametri GET accettati:
 *   src     (string) percorso dell'immagine, relativo a PUBLIC_DIR
 *   crop    (string) "x,y,w,h" - ritaglia l'immagine originale prima
 *                    dell'eventuale ridimensionamento con bb
 *   bb      (string) bounding box "WxH" che deve contenere l'immagine
 *                    ridimensionata
 *   fd      (bool)   forza le dimensioni esatte (in coppia con bb,
 *                    ritagliando l'eccedenza)
 *   q       (int)    qualità di compressione
 *   refresh (bool)   forza la rigenerazione della cache
 *   f       (string) formato di output, tra le chiavi di ALLOWED_FORMATS;
 *                    "auto" (default) sceglie il formato migliore in
 *                    base al valore di PREFERRED_AUTO_FORMATS
 *   ext     (bool)   mantiene inalterato il formato originale
 *   d       (bool)   forza il download dell'immagine
 *
 * Gestione della trasparenza:
 *   il canale alpha eventualmente presente nell'immagine di origine
 *   viene mantenuto se il formato di output lo supporta (png, webp,
 *   avif); negli altri casi (jpeg, gif) viene riempito con sfondo
 *   bianco (#fff).
 *
 * Limiti rispetto alla versione Imagick:
 *   - niente supporto TIFF in ingresso (GD non lo gestisce);
 *   - "pjpeg" viene scritto come jpeg con interlacciamento attivo,
 *     dato che GD non distingue i due formati come mimetype separati.
 * ------------------------------------------------------------------
 */

/* ==================================================================
 * CONFIGURAZIONE - da adattare all'ambiente in cui gira lo script
 * ================================================================== */

/* cartella "pubblica" a cui è relativo il parametro src */
define('PUBLIC_DIR', $_SERVER['DOCUMENT_ROOT']);

/* cartella dove vengono salvati i file di cache (deve esistere ed
   essere scrivibile dal webserver) */
define('CACHE_DIR', __DIR__ . '/cache/');

/* durata della cache dei file, in secondi (qui: 7 giorni) */
define('CACHE_LIFETIME', 604800);

/* qualità di compressione predefinita */
define('DEFAULT_COMPRESSION_QUALITY', 60);


/* ==================================================================
 * COSTANTI DI ELABORAZIONE
 * ================================================================== */

/* parametri GET accettati dal viewer */
const ALLOWED_PARAMS = ['bb', 'fd', 'q', 'refresh', 'f', 'ext', 'd', 'crop'];

/* formati di output ammessi -> relativo mime type */
const ALLOWED_FORMATS = [
  'avif'  => 'image/avif',
  'pjpeg' => 'image/jpeg',
  'jpeg'  => 'image/jpeg',
  'jpg'   => 'image/jpeg',
  'png'   => 'image/png',
  'gif'   => 'image/gif',
  'webp'  => 'image/webp',
];

/* formati che supportano il canale alpha in output */
const ALPHA_COMPATIBLE_FORMATS = ['png', 'webp', 'avif'];

/* formati preferiti per la scelta automatica, in ordine di preferenza
   (le chiavi devono coincidere con quelle di ALLOWED_FORMATS);
   in loro assenza il formato predefinito è jpeg */
const PREFERRED_AUTO_FORMATS = ['avif', 'webp'];

/* formati di input accettati in aggiunta a quelli di ALLOWED_FORMATS
   (NB: GD non supporta il TIFF, quindi qui resta solo il bmp) */
const ALLOWED_INPUT = ['bmp'];


/* ==================================================================
 * FUNZIONI DI SUPPORTO
 * ================================================================== */

/**
 * Restituisce l'elenco dei formati di OUTPUT effettivamente
 * disponibili con l'installazione di GD corrente.
 */
function getSupportedOutputFormats(): array
{
  $supported = ['jpeg', 'jpg', 'pjpeg', 'png', 'gif'];

  if (function_exists('imagewebp')) {
    $supported[] = 'webp';
  }
  if (function_exists('imageavif')) {
    $supported[] = 'avif';
  }

  return $supported;
}

/**
 * Crea una risorsa immagine GD leggendo il file indicato, in base
 * alla sua estensione.
 */
function createImageFromFile(string $filePath, string $ext): \GdImage
{
  $ext = strtolower($ext);

  $img = match ($ext) {
    'jpeg', 'jpg', 'pjpeg' => imagecreatefromjpeg($filePath),
    'png'                  => imagecreatefrompng($filePath),
    'gif'                  => imagecreatefromgif($filePath),
    'webp'                 => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($filePath) : false,
    'avif'                 => function_exists('imagecreatefromavif') ? imagecreatefromavif($filePath) : false,
    'bmp'                  => function_exists('imagecreatefrombmp') ? imagecreatefrombmp($filePath) : false,
    default                => false,
  };

  if ($img === false) {
    throw new \RuntimeException("Impossibile leggere l'immagine ($ext)");
  }

  /* mantiene canale alpha e "blend" corretti per i formati che lo supportano */
  imagealphablending($img, false);
  imagesavealpha($img, true);

  return $img;
}

/**
 * Ritaglia un'immagine secondo x, y, larghezza e altezza indicati.
 */
function cropImage(\GdImage $img, int $x, int $y, int $w, int $h): \GdImage
{
  $cropped = imagecrop($img, ['x' => $x, 'y' => $y, 'width' => $w, 'height' => $h]);

  if ($cropped === false) {
    throw new \RuntimeException('Errore durante il ritaglio dell\'immagine');
  }

  imagealphablending($cropped, false);
  imagesavealpha($cropped, true);

  return $cropped;
}

/**
 * Ridimensiona l'immagine esattamente alle dimensioni indicate
 * (equivalente a Imagick::thumbnailImage quando $w e $h sono già
 * calcolati nel rispetto delle proporzioni originali).
 */
function resizeImage(\GdImage $img, int $w, int $h): \GdImage
{
  $resized = imagecreatetruecolor($w, $h);
  imagealphablending($resized, false);
  imagesavealpha($resized, true);

  imagecopyresampled($resized, $img, 0, 0, 0, 0, $w, $h, imagesx($img), imagesy($img));

  return $resized;
}

/**
 * Ridimensiona l'immagine "a copertura" del bounding box indicato,
 * ritagliando l'eccedenza centrata (equivalente a
 * Imagick::cropThumbnailImage - stile CSS object-fit: cover).
 */
function coverResizeImage(\GdImage $img, int $w, int $h): \GdImage
{
  $ow = imagesx($img);
  $oh = imagesy($img);

  $scale = max($w / $ow, $h / $oh);
  $rw = (int) round($ow * $scale);
  $rh = (int) round($oh * $scale);

  $resized = resizeImage($img, $rw, $rh);

  $offsetX = (int) round(($rw - $w) / 2);
  $offsetY = (int) round(($rh - $h) / 2);

  return cropImage($resized, $offsetX, $offsetY, $w, $h);
}

/**
 * "Appiattisce" la trasparenza di un'immagine su sfondo bianco.
 * Usata per i formati di output che non supportano il canale alpha.
 */
function flattenImageOnWhite(\GdImage $img): \GdImage
{
  $w = imagesx($img);
  $h = imagesy($img);

  $flattened = imagecreatetruecolor($w, $h);
  $white = imagecolorallocate($flattened, 255, 255, 255);
  imagefill($flattened, 0, 0, $white);

  imagealphablending($flattened, true);
  imagecopy($flattened, $img, 0, 0, 0, 0, $w, $h);

  return $flattened;
}

/**
 * Scrive un'immagine GD su file, nel formato e con la qualità
 * indicati. Ritorna il mime type effettivamente utilizzato.
 */
function writeImage(\GdImage $img, string $format, string $destPath, int $quality): string
{
  $mimeType = ALLOWED_FORMATS[$format];

  switch ($format) {
    case 'jpeg':
    case 'jpg':
      imagejpeg($img, $destPath, $quality);
      break;

    case 'pjpeg':
      /* progressive jpeg: interlacciamento attivo prima del salvataggio */
      imageinterlace($img, true);
      imagejpeg($img, $destPath, $quality);
      break;

    case 'png':
      /* la qualità di Imagick (0-100) va convertita nel livello di
         compressione di GD (0-9, dove 9 = massima compressione) */
      $level = (int) round((100 - $quality) / 100 * 9);
      imagepng($img, $destPath, max(0, min(9, $level)));
      break;

    case 'gif':
      imagegif($img, $destPath);
      break;

    case 'webp':
      imagewebp($img, $destPath, $quality);
      break;

    case 'avif':
      /* imageavif(immagine, percorso, qualità, velocità) */
      imageavif($img, $destPath, $quality);
      break;

    default:
      throw new \RuntimeException("Formato di output non gestito: $format");
  }

  return $mimeType;
}


/* ==================================================================
 * ESECUZIONE
 * ================================================================== */

$get = $_GET;
$src = $get['src'] ?? null;

if (!$src) {
  http_response_code(404);
  exit('Parametro mancante! (src)');
}

/* formati di output disponibili con l'installazione GD corrente */
$supportedFormats = getSupportedOutputFormats();

/* formati accettati dal browser */
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';

/* formato "auto" predefinito */
if (!isset($get['f'])) {
  $get['f'] = 'auto';
}

/* formato "auto" -> sceglie il formato migliore per il browser, se disponibile */
if (strtolower($get['f']) === 'auto') {
  foreach (PREFERRED_AUTO_FORMATS as $f) {
    if (
      strpos($accept, ALLOWED_FORMATS[$f]) !== false &&
      array_key_exists($f, ALLOWED_FORMATS) &&
      in_array($f, $supportedFormats, true)
    ) {
      $get['f'] = $f;
      break;
    }
  }
}

$params = cleanParams($get);

/* parte del nome file di cache formata da tutti i parametri concatenati */
$cacheParamsStr = '';
foreach ($params as $kg => $g) {
  if ($kg !== 'refresh') {
    $cacheParamsStr .= '_' . $kg . $g;
  }
}
$cacheParamsStr = str_replace(',', '_', $cacheParamsStr);

$filePath = PUBLIC_DIR . $src;

if (!is_file($filePath)) {
  http_response_code(404);
  exit('Immagine non trovata!');
}

$fileExt = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
$fileCacheName = str_replace('/', '_', $src);

$disposition = isset($params['d']) ? 'attachment' : 'inline';

/* elaborazione immagine: solo se sono presenti parametri ed è un
   formato trattabile da GD (altrimenti viene restituito il file
   originale, ad es. per gli svg) */
if (count($params) && in_array($fileExt, array_merge(ALLOWED_INPUT, array_keys(ALLOWED_FORMATS)), true)) {

  /* scelta del formato di output */
  if (isset($params['f']) && in_array($params['f'], array_keys(ALLOWED_FORMATS), true) && in_array($params['f'], $supportedFormats, true)) {
    $format = $params['f'];
  } elseif (isset($params['ext']) && $params['ext'] && in_array($fileExt, array_keys(ALLOWED_FORMATS), true)) {
    $format = $fileExt;
  } else {
    $format = 'jpeg';
  }

  $fileCacheName .= $cacheParamsStr . '.' . ($format === 'pjpeg' ? 'jpeg' : $format);
  $cacheFile = CACHE_DIR . $fileCacheName;

  $compressionQuality = !empty($params['q']) ? (int) $params['q'] : DEFAULT_COMPRESSION_QUALITY;

  /* rigenera l'immagine se: manca la cache, è scaduta, o è richiesto il refresh */
  if (!file_exists($cacheFile) || (filemtime($cacheFile) + CACHE_LIFETIME) < time() || isset($params['refresh'])) {

    $img = createImageFromFile($filePath, $fileExt);

    if (isset($params['crop']) || isset($params['bb'])) {
      $ow = imagesx($img);
      $oh = imagesy($img);
    }

    if (isset($params['crop'])) {
      $cropParams = array_map(fn($val) => (int) trim($val), explode(',', $params['crop']));

      if (count($cropParams) !== 4 || min($cropParams) < 0) {
        http_response_code(400);
        exit('Errore di configurazione! (crop 1)');
      }

      [$x, $y, $cropW, $cropH] = $cropParams;

      if ($x + $cropW > $ow || $y + $cropH > $oh) {
        http_response_code(400);
        exit('Errore di configurazione! (crop 2)');
      }

      $img = cropImage($img, $x, $y, $cropW, $cropH);

      /* nuove dimensioni dell'immagine (corrispondono a $cropW e $cropH) */
      $ow = imagesx($img);
      $oh = imagesy($img);
    }

    $w = 0;
    $h = 0;
    $bbHasX = false;

    if (isset($params['bb'])) {
      $bbParam = strtolower($params['bb']);
      $bbHasX = strpos($bbParam, 'x') !== false;

      if ($bbHasX) {
        /* dimensioni richieste; se un parametro è mancante viene
           impostato a 0 e non ha influenza nelle elaborazioni successive */
        [$w, $h] = array_map(fn($val) => $val ? (int) $val : 0, explode('x', $bbParam));

        /* le dimensioni richieste non possono superare quelle originali */
        if ($w > $ow) $w = $ow;
        if ($h > $oh) $h = $oh;
      }
    }

    /* fd => l'immagine deve rispettare con precisione le dimensioni
       richieste (necessari entrambi i parametri di bb) */
    if (isset($params['bb']) && isset($params['fd']) && $bbHasX && $w > 0 && $h > 0) {

      if ($ow < $w && $oh < $h) {
        $nb = $ow;
        $nh = $oh;

        $r = $w > $h ? $h / $w : $w / $h;

        if ($nb > $nh) {
          $nh = $r * $nb;
        } else {
          $nb = $r * $nh;
        }

        $w = (int) round($nb);
        $h = (int) round($nh);
      }

      $img = coverResizeImage($img, $w, $h);

    } elseif (isset($params['bb']) && $bbHasX) {

      if ($w !== 0 || $h !== 0) {
        $nb = $ow;
        $nh = $oh;

        if ($w !== 0 && $w < $nb) {
          $nh = ($w / $nb) * $nh;
          $nb = $w;
        }

        if ($h !== 0 && $h < $nh) {
          $nb = ($h / $nh) * $nb;
          $nh = $h;
        }

        $w = (int) round($nb);
        $h = (int) round($nh);
      }

      $img = resizeImage($img, $w, $h);
    }

    /* trasparenza: mantenuta se il formato di output la supporta,
       altrimenti riempita con sfondo bianco */
    if (!in_array($format, ALPHA_COMPATIBLE_FORMATS, true)) {
      $img = flattenImageOnWhite($img);
    }

    $mimeType = writeImage($img, $format, $cacheFile, $compressionQuality);

    imagedestroy($img);

  } else {
    $mimeType = ALLOWED_FORMATS[$format];
  }

} else {

  /* nessuna elaborazione richiesta: restituisce il file originale */
  $cacheFile = $filePath;
  $fileCacheName = str_replace('/', '_', $src);

  $mimeType = $fileExt === 'svg' ? 'image/svg+xml' : (mime_content_type($filePath) ?: 'application/octet-stream');
}

/* invio del file al browser */
header('Content-Type: ' . $mimeType);
header('Content-Disposition: ' . $disposition . '; filename="' . $fileCacheName . '"');
header('Content-Length: ' . filesize($cacheFile));

readfile($cacheFile);
exit;


/* ==================================================================
 * cleanParams - filtra e normalizza i parametri GET
 * ================================================================== */
function cleanParams(array $params): array
{
  foreach ($params as $key => $value) {
    if (!in_array($key, ALLOWED_PARAMS, true)) {
      unset($params[$key]);
    } elseif ($value) {
      $params[$key] = trim($value);
    }
  }

  if (isset($params['f'])) {
    $params['f'] = strtolower($params['f']);
  }

  return $params;
}
