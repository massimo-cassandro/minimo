import { unsplashPage } from '@src/components/unsplash-page/unsplash-page.js';

export async function unsplashPageDemo(){

  const isLocal = window.location.origin.match('localhost') !== null,
    unsplashDataUrl = isLocal
      ? 'http://localhost:8100/demo-files/unsplash-page-demo/getUnsplashPhotosLocal.php' // local test only
      : 'https://primominuto.altervista.org/proxy/getUnsplashPhotos.php';

  // extra check, demo only: warns if the local PHP server isn't running (or another server is
  // squatting on the port) instead of leaving the loader spinning forever. Uses a HEAD request
  // so it doesn't burn an Unsplash API call just to check
  if(isLocal) {
    try {
      const response = await fetch(unsplashDataUrl, {method: 'HEAD'}),
        contentType = response.headers.get('content-type') ?? '';
      if(!response.ok || !contentType.includes('application/json')) {
        throw new Error('unexpected response from local PHP server');
      }
    } catch {
      window.alert('Il server PHP su localhost:8100 non risulta attivo: avvialo per visualizzare questa demo.');
      return;
    }
  }

  unsplashPage({
    targetElement    : document.getElementById('root'),
    unsplashDataUrl,
    utmSource        : 'unsplashPageDemo test',
    title            : 'Unsplash Page Demo',
    text             : 'This is the message <strong>text</strong>',
    backLink         : '<a href="/">Back to demo index</a>',
    hidePhotoLink    : true,
    cssModulesObj    : null
  });
}
