# MinimoCharts test

## browser

run (dalla root Ada):

```bash
# open -n -a "Google Chrome" --args --profile-directory="Profile 1" # facoltativo, scelta profilo chrome
NODE_ENV=development npx webpack serve --config ./ada-frontend/ada-charts/test/webpack/webpack-MinimoChartsTest.config.mjs
```


## node

Per il test node è necessario scaricare il font indicato nel file di `node-test.mjs`

Il percorso dei font va quindi inserito in `./node-test.mjs` (nella variabile `fontFolder`).

Per avviare il test:

```bash
node node-test.mjs
```
