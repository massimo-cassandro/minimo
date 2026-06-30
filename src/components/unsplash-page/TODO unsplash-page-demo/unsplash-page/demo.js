import { unsplashPageJS } from '../src/unsplash-page.js';

unsplashPageJS({
  targetElement    : document.getElementById('root'),
  unsplashDataUrl  : window.location.origin.match('localhost')!== null ?
    'http://localhost:8000/demo/demo-data.php' // local test
    : 'https://primominuto.altervista.org/proxy/getUnsplashPhotos.php'
  ,
  utmSource        : 'vanilla-js-test',
  title            : 'Message title',
  text             : 'This is the message <strong>text</strong>',
  backLink         : '<a href="https://github.com/massimo-cassandro/unsplash-page">Back to repository home</a>',
  hidePhotoLink    : true,
  cssModulesObj    : null
});
