# Demo

To run the demo, clone this repository and install all dependencies, then call the `demo run` script:

```bash
# clone the repository
git clone https://github.com/massimo-cassandro/svg-icons-tools.git

# install all dependencies
cd path/to/install/folder
npm install

## run the script
npm run 'demo run'
```

All the the generated files will be saved in the `demo/demo-output` directory.

Alternatively, download and save only the demo directory (you can use [download-directory.github.io](https://download-directory.github.io/), this is a direct download link: <https://download-directory.github.io/?url=https%3A%2F%2Fgithub.com%2Fmassimo-cassandro%2Fsvg-icons-tools%2Ftree%2Fmain%2Fdemo>), then install *svg-icons-toools* with **npm** (`npm i @massimo-cassandro/svg-icons-tools`), move the demo directory to the same folder as your installation and run:

```bash
npx iconsTools --config ./demo/svg-icons-tools.config.mjs
```

**About demo files**

Some icons comes from [Phosphor Icons](https://phosphoricons.com/), [Remix Icon](https://remixicon.com/) and [heroicons](https://heroicons.com/).

File prefixes (heroicons, phosphoricons, etc.) are used to identify their origin and are removed during processing.

The `-w-pallet` suffix means that the file has a “pallet” (see config file) to be removed.
Likewise, duotone icons are indicated by the suffix `-duotone`.
