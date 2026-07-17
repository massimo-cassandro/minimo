# Dev tools

A collection of standalone Node.js CLI utilities to help manage a web project's day-to-day chores (dependency updates, versioning/changelog, icon and favicon generation). Each tool lives in its own subfolder, works independently of the others and of the `minimo` package itself, and is documented in its own README — this page only gives a quick overview.

* [update-version](./update-version/README.md) — bumps the version in `package.json` and appends an entry to `changelog.md`
* [Svg Icons Tools](./svg-icons-tools/README.md) — optimizes SVG icons and combines/converts them into symbols, JSX, or SCSS variables
* [Create favicons](./create-favicons/README.md) — generates the full favicon set (SVG, PNG, ICO, webmanifest, HTML snippet) from a source image
* [upd@m](./upd@m/README.md) — updates all `@massimo-cassandro/*` packages installed in `node_modules`
* [starter-kit](#starter-kit) — script for installing minimo environment

## starter-kit

`starter-kit/starter-install.sh` bootstraps a new frontend project: it copies the starter config files (`package.json`, `.gitignore`, `jsconfig.json`, eslint/stylelint configs, webpack config and modules, ...) and installs all the required dev dependencies.

The script **requires zsh** (it exits with an error if launched with `sh` or `bash`). Existing files are never overwritten: root config files are copied with a `NEW-` prefix, while `package.json` and the `*.code-workspace` file are merged (template keys are appended at the end, prefixed with `_`).

### If minimo is already installed

The script is exposed as a `bin` of the package:

```bash
npx starter-kit
```

Since the installation is fully overwrite-safe, the script can also be **re-run at any time to update** an existing setup (e.g. to refresh the webpack modules or reinstall the dev dependencies): existing files are skipped or copied with the `NEW-` prefix, and the `package.json` / `*.code-workspace` merges are idempotent (running the script again neither duplicates nor overwrites anything).

### Without installing minimo

To bootstrap a project **before** (or without) installing the whole package, download only the `starter-kit` folder from the npm tarball and run the script from there:

```bash
curl -sL "$(npm view @massimo-cassandro/minimo dist.tarball)" | tar xz package/dev-tools/starter-kit
zsh package/dev-tools/starter-kit/starter-install.sh
rm -rf package
```

## SVG adn favicons tools

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
