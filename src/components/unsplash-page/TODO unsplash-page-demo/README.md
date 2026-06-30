# Unsplash page

> This repository will soon be integrated with [minimo](https://github.com/massimo-cassandro/minimo)

**demo:** <https://massimo-cassandro.github.io/unsplash-page/demo>

Single page with random photo from [Unsplash](https://unsplash.com/) to display some messages (useful for error pages).

This component comes from some experiments I did with the Unsplash API. The initial purpose was to display more appealing error pages, but you can use it for any use.

For best results, it is advisable to display images from a photo collection prepared on Unsplash. The demos in this repository use my collection ["World"](https://unsplash.com/collections/3660951/world).

You need to create a server script to retrieve the JSON data of a random image from Unsplash (see [Get a Random Photo](https://unsplash.com/documentation#get-a-random-photo) on Unsplash API docs).

The script also implements [BlurHash](https://blurha.sh/), to show a placeholder of the image until it loads.

For more details and examples take a look at:

* <https://unsplash.com/developers>
* [A Random Image Slideshow With Unsplash and React](https://betterprogramming.pub/a-random-image-slideshow-with-unsplash-and-react-1b6aee698652)
* [Unsplash Random Photo 1](https://github.com/massimo-cassandro/area-test/tree/main/2023-03-unsplash-random-photo-1)
* [Random Unsplash Photos Slideshow](https://github.com/massimo-cassandro/area-test/tree/main/2023-05-unsplash-random-photo-2)
* [A Split Image Effect in React](https://medium.com/better-programming/a-split-image-effect-in-react-beb2baa3fe5f) and [split image](https://github.com/massimo-cassandro/area-test/tree/main/2023-07-split-image)


The SVG icons used in the script are from [Phosphor Icon](https://phosphoricons.com/). At the moment it is not possible to use different ones without modifying the source code.

## Installation

Install from NPM:

```bash
npm i -S  @massimo-cassandro/unsplash-page blurhash
```

Fro info about **blurhash**: <https://www.npmjs.com/package/blurhash>.

## Running a local demo

Launch a php server (php needed for data proxy), then go to the `demo` dir:

```bash
php -S localhost:8000
```

and then open `http://localhost:8000/demo/`.

## Use

Demo: <https://massimo-cassandro.github.io/unsplash-page/demo/vanilla-js/index.html>


Add to your script:

```javascript
import { unsplashPageJS } from '@massimo-cassandro/unsplash-page';


unsplashPageJS({
  targetElement    : document.getElementById('root'),
  className        : 'class',
  unsplashDataUrl  : 'url',
  utmSource        : 'source',
  title            : 'Message title',
  text             : 'This is the message <strong>text</strong>',
  backLink         : '<a href="link/to/home">Back to home</a>',
  hidePhotoLink    : true,
  cssModules       : false,
  cssModulesObj    : null
});
```

where:

* `className`, `unsplashDataUrl`, `utmSource` and `hidePhotoLink` correspond exactly to what is described in the React version
* `title`, `text` and `backLink` are like the previous ones, but in this case they are always strings
* `targetElement`: The DOM element in which to insert the necessary markup
* `cssModules`: Set to true if your bundler uses CSS Modules (default `false`)
* `cssModulesObj`: If you are using CSS Modules, assign to these parameter the imported styles object (see below).

### CSS
The JS file does not include any CSS, to maintain maximum flexibility of use.

Then you can plug your CSS into the html (like I did in the demo) or manage it with Rollup, Webpack etc.

If you are using CSS modules, you need to share the parsed CSS object with the script so that the processed class names can be used:


```javascript
import styles from '@massimo-cassandro/unsplash-page/src/unsplash-page.module.css';

unsplashPageJS({
  /* ... */
  cssModules       : true,
  cssModulesObj    : styles
});
```

### SVG icons

SVG icons are imported into the script, both in the React and Vanilla JS versions.

In the latter, they need to be managed by your bundler to ensure they load correctly. In the demo, I used [@rollup/plugin-image](https://www.npmjs.com/package/@rollup/plugin-image) to import them as base64. Since they are very small, this seems to be the simplest solution.


## CSS customization

You can customize the CSS (fonts, colors, etc.) using some CSS custom properties.

You need to provide them as a separate CSS file to change the default settings.

Below you can see the list of properties set with their default values: simply reset the ones you want to change and ignore the others.

You can do this by setting variables in the `:root` element, or you can narrow their scope to the component container by assigning it a class (thru the `className` parameter) and then using it in you CSS.

For a complete list of all custom properties see `src/unsplash-page.modules.css`;

```css
/* needed if your script doesn't embed the css file */
@import '@massimo-cassandro/unsplash-page/src/unsplash-page.module.css';

.your-custom-class { /* or :root */

  /* your css custom props */
}
```

## Using http error codes

Using HTTP Error Codes from your server can be a clever way to use this component.

First, get the error code from your server (404, 500, etc.), for example by setting it as a `data` attribute somewhere, then pass it to the script that implements UnsplashPage.
Matching the errorCode with an object of predefinited titles and text, can do the trick:


```javascript
const myErrorCode = +document.body.dataset.errorCode || 500;

const errorTypes = {
  403: {
    title: 'Oops… You can’t access this page', 
    // title: 'Ops… Non puoi accedere a questa pagina',
    text: null
  },
  404: {
    title: 'Oops… This page does not exist', 
    // title: 'Ops… Questa pagina non esiste',
    text: null
  },
  500: {
    title: 'Oops… An error has occurred', 
    // title: 'Ops… Si è verificato un errore',
    text: null
  },
  503: {
    title: 'Sorry, this site is temporarily under maintenance', 
    // title: 'Siamo spiacenti, il sito è temporaneamente in manutenzione',
    text: null
  }
};

unsplashPageJS({
  /* ... */
  title: errorTypes[myErrorCode].title,
  text: errorTypes[myErrorCode].text,
  backLink: myErrorCode !== 503? <a href="link/to/home">Back to home</a> : null

});
```

## Use with React
The previous version of UP contained a React version of the script, but, to simplify maintenance and achieve maximum flexibility of use, I now prefer to use a React wrapper of the Vanilla JS script: you can find a template of the file in the `react` folder.

The sample uses [React Router](https://reactrouter.com) to display error messages based on server results.

In the same folder, you can find the previous, unmantained, React version,

## Images breakpoints & sizes

Images are uploaded at different sizes using the [Unsplash API](https://unsplash.com/documentation#dynamically-resizable-images). Other than a few differences, CSS media query breakpoints are the same as those in [Bootstrap 5](https://getbootstrap.com/docs/5.3/layout/breakpoints/).

The following table reports the image size for each breakpoint:


| BS5 breakpoint               |   xs  |    sm    |     md    |     lg     |      xl     |   xxl  |
|------------------------------|:-----:|:--------:|:---------:|:----------:|:-----------:|:------:|
| Page width                   | < 576 | 576 -767 | 768 - 991 | 992 - 1199 | 1200 - 1399 | >=1400 |
| img width                    |  576  |    768   |    992    |    1200    |     1400    |  1920  |
| img height (16/9)            |  324  |    432   |    558    |     675    |     788     |  1080  |
| img height (4/3)             |  432  |    576   |    744    |     900    |     1050    |  1440  |
| img height (9/21, portrait)  |  1344 |          |           |            |             |        |
| img height (21/9, landscape) |  247  |          |           |            |             |        |

Sizes and breakpoints are defined in the `img-breakpoints.js` file.
