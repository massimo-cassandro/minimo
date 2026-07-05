# Dev tools

A collection of standalone Node.js CLI utilities to help manage a web project's day-to-day chores (dependency updates, versioning/changelog, icon and favicon generation). Each tool lives in its own subfolder, works independently of the others and of the `minimo` package itself, and is documented in its own README — this page only gives a quick overview.

* [update-version](./update-version/README.md) — bumps the version in `package.json` and appends an entry to `changelog.md`
* [Svg Icons Tools](./svg-icons-tools/README.md) — optimizes SVG icons and combines/converts them into symbols, JSX, or SCSS variables
* [Create favicons](./create-favicons/README.md) — generates the full favicon set (SVG, PNG, ICO, webmanifest, HTML snippet) from a source image
* [upd@m](./upd@m/README.md) — updates all `@massimo-cassandro/*` packages installed in `node_modules`


## Usage of SVG adn favicons tools

```bash
## SVG Icons Tools
npx svgIconsTools --config ./path/to/svg-icons-tools.config.mjs

# create favicons
npx create-favicons init
npx create-favicons [--dir=./path/to/dir]
```

## Adding frequently used tools in the script section of the `package.json` file:

```json
{
  "scripts": {
    "update-version": "npx update-version # optional: --config=./dev-utilities.config.mjs",
    "upd@m": "npx upd@m"
  }
}
```
