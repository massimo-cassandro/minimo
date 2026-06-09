# AdaCharts test

## browser

run (dalla root Ada):

```bash
open -n -a "Google Chrome" --args --profile-directory="Profile 1" 
cd ./ada-frontend/ada-charts/test/browser-test
NODE_ENV=development npx webpack serve --config ./webpack/webpack.config.cjs
```


## node

Per il test node è necessario scaricare il font Roboto Condended da Google Font

Il percorso dei font va quindi inserito in `./node-test/node-test.mjs` (nella variabile `fontFile`).

Per avviare il test:

```bash
node node-test.mjs
```
