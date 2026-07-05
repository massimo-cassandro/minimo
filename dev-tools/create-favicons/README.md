# Create favicons

Create favicon files as described in [How to Favicon in 2024](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs).

The files to be processed must be in SVG format, while the generated files are in SVG (favicon), PNG (apple-touch-icon and other Android files), and ICO (another favicon for compatibility with older browsers). The `manifest.webmanifest` files are also generated, along with an optional HTML snippet with `link` tags for inserting the generated elements.

Images are generated with [Sharp](https://sharp.pixelplumbing.com/), [SVGO](https://github.com/svg/svgo), and [sharp-ico](https://github.com/ssnangua/sharp-ico).

## Installation

```bash
npm i -D @massimo-cassandro/create-favicons
```

## Creating template config files (see below)

```bash
npx create-favicons init
```

## Usage

```bash
npx create-favicons [--dir=./path/to/dir]
```

The script normally runs in the current directory, but using the optional `--dir` parameter,
you can specify an alternative directory (path relative to the execution directory).

The script first searches the working directory for the `create-favicons-cfg.mjs` file, which contains an object
with all the necessary parameters (see below).

If it's missing, it searches for the `favicon-src.svg` file to use as the source for all images, assuming the default values ​​(see below) for all other parameters.

Among others, you can specify the `small_src_img` parameter if you need to specify an image optimized for small dimensions (32px).

The best format for source files is SVG, or alternatively PNG.

If both files are missing, an error is returned.

The default parameters are listed in detail in the file `src/create-favicons/src/default-params.mjs`,
and can be customized in the configuration file, which must have this form:

```javascript
// file create-favicons-cfg.mjs
const params = [{ /* ... */ }];

export default params;
```

`params` can be an object or an array. In the latter case, each element of the array corresponds to a different set of favicons.

To create a sample cfg file **in the current directory** (with all default values ​​and their descriptions),
use the command:

```bash
npx create-favicons init
```

## Remote Use

The commands can also be run without first installing the package:

```
npx --package=@massimo-cassandro/dev-utilities create-favicons init
npx --package=@massimo-cassandro/dev-utilities create-favicons [--dir=...]
```

## Execution

The script produces the various png and svg images, the `manifest.webmanifest` file, and an HTML snippet (or in the language specified in the `snippet_language` parameter).
All images are optimized with [SVGO](https://github.com/svg/svgo) and [imagemin](https://github.com/imagemin/imagemin).

All files are saved in the directory specified in `output_dir` (default: current directory).

Optionally, the snippet file can be saved in a different directory (`snippet_path`) or you can choose not to create it,
by setting the `snippet_name` value to `null`.

In the configuration file, you can also set the `webmanifest_extra` parameter, which allows you to add additional entries to the *manifest* file.
For more info: <https://developer.mozilla.org/en-US/docs/Web/Manifest>

Files generated:

```html
<link rel="icon" href="/favicon.ico" sizes="any"> <!-- 32×32 + 16x16 -->
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png"> <!-- 180×180 -->
<link rel="manifest" href="/manifest.webmanifest">
```

```javascript
// manifest.webmanifest
{ 
  "icons": [ 
    { "src": "/icon-192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "/icon-512.png", "type": "image/png", "sizes": "512x512" }
  ]
}
```

See also demo files
