# Svg Icons Tools

Svg Icons Tools provides some utilities for manage and optimize SVG icons:

* optimize all files with [SVGO](https://svgo.dev/)
* combine svg files into a single file, where each icon is wrapped within a `<symbol>` element (inspired from [svgstore](https://github.com/svgstore/svgstore)) 
* convert svg files to JSX
* copy optimized svg files to target directory
* removes *pallets* from the icon markups (see config file for more details).
* create a scss file with svg icons converted to sass variables
* jsx and optimized icons only: ability to manage both icons with `fill` and `stroke` adding optional classes to apply different css properties

These tools are pretty useless if you download your icons from one of the libraries you can find on the web, but if you design them yourself, *svg-icons-tools* can save you a lot of time in cleaning up and optimizing icons drawn with Illustrator, Figma, Sketch etc.

Also, most (or all) libraries only allow you to download icons with a fixed thickness, but you can often download "working" versions where thickness is defined by the stroke attribute. In these cases there is often a *pallet* that you can easily remove.

Read more in my [Building an Icon System in React](https://medium.com/better-programming/building-an-icon-system-in-react-16757d73cc35) article.

## Installation

```bash
npm i -D @massimo-cassandro/svg-icons-tools
```

## Setup

First, create a config file for you project, you can run:

```bash
npx iconsTools init
```

This creates a `svg-icons-tools` directory which contains the `svg-icons-tools.config.mjs` configuration file.

Rename the folder as you like and move it where you need. Then open and customize the `svg-icons-tools.config.mjs` file.

## Run

To launch the script, open your terminal and use the command:

```bash
npx iconsTools --config ./path/to/svg-icons-tools.config.mjs
```

where `--config` must contain the path, relative to the current dir, to the config file.

If the `--config` parameter is not set, the script will look for the configuration file in the current directory; if the file is not found, an error will be thrown.


## Configuration details

See [src/default-config.mjs](src/default-config.mjs) for more info.

## Demo

See [demo/readme](demo/readme.md).

## TODO
* documentation to jsdoc
* prettify the jsx output (update docs)
* SVG attributes to jsx (upd doc)
* option to clean-up dest folder for jsx and optimized (?)
* auto changelog


## Changelog / Breaking Changes

### 1.1
* added default jsx icon builder function

#### Breaking Changes
* in config file, `config.jsx.icon_builder` becomes `config.jsx.custom_icon_builder`, if not defined the default icon builder is used for jsx files.

### 1.0
* First production release
