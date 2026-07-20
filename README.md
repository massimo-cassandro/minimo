# Minimo

My light framework + utilities

## Install

```bash
npm i @massimo-cassandro/minimo

# optional:
npm i -D @massimo-cassandro/eslint-config
npm i -D @massimo-cassandro/stylelint-config
```

> Note: **minimo** is designed to be used with WebPack using the configuration you can find in the [starter-kit folder](./dev-tools/starter-kit/) of this repository. If changes are made (for example, to how SVG files are imported), things may not work as expected.
>

For a complete install of all required webpack modules, use the install script at `./dev-tools/starter-kit/starter-install.sh` launching:

```bash
zsh ./node_modules/@massimo-cassandro/minimo/dev-tools/starter-kit/starter-install.sh
```

To bootstrap a project **before** installing the whole package, download only the `starter-kit` folder from the npm tarball and run the script from there:

```bash
curl -sL "$(npm view @massimo-cassandro/minimo dist.tarball)" | tar xz package/dev-tools/starter-kit
zsh package/dev-tools/starter-kit/starter-install.sh
rm -rf package
```

---

## Dev Tools

The [`dev-tools`](./dev-tools/README.md) directory contains a set of standalone Node.js CLI utilities for managing a web project — updating dependencies, bumping the version and changelog, and generating/optimizing SVG icons and favicons. They are published as part of the `minimo` package and exposed via the `bin` entries in `package.json` (`update-version`, `upd@m`, `svgIconsTools`, `create-favicons`); see the [Dev Tools README](./dev-tools/README.md) for the full list and usage.


## Docs & Demo

[Docs](docs)

[Demo](demo-build)
