// Config minimale usata da run-test.mjs per verificare che aggiungere
// `sideEffects: true` alla rule dei CSS Modules in
// dev-tools/starter-kit/webpack-modules/css-rules.mjs non riesumi il vecchio
// problema (import di un solo componente da index.js che portava con sé
// il JS/CSS di TUTTI gli altri componenti).
//
// Riusa il vero css-rules.mjs dello starter-kit (non una copia) e i loader
// già installati in demo/node_modules. Il toggle SIDE_EFFECTS_FIX=1 applica
// la modifica candidata alla rule .module.css prima di passarla a webpack.

import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

import { cssRules } from '../../dev-tools/starter-kit/webpack-modules/css-rules.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const demoNodeModules = path.resolve(rootDir, 'demo/node_modules');

const applyFix = process.env.SIDE_EFFECTS_FIX === '1';
const variant = process.env.VARIANT ?? (applyFix ? 'fixed' : 'baseline');

const rules = cssRules({
  isDevelopment: false,
  postcssConfig_path: path.resolve(rootDir, 'demo/postcss.config.mjs'),
});

if (applyFix) {
  const cssModulesRule = rules.find(r => r.test instanceof RegExp && r.test.test('x.module.css'));
  if (!cssModulesRule) {
    throw new Error('rule .module.css non trovata in cssRules(): verificare css-rules.mjs');
  }
  cssModulesRule.sideEffects = true;
}

export default {
  mode: 'production',
  entry: path.resolve(__dirname, './fixture-entry.js'),
  context: __dirname,
  output: {
    path: path.resolve(__dirname, `./dist/${variant}`),
    filename: 'bundle.js',
    clean: true,
  },
  resolveLoader: {
    modules: [demoNodeModules, 'node_modules'],
  },
  resolve: {
    modules: [demoNodeModules, 'node_modules'],
    extensions: ['.js', '.mjs', '.css'],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin(),
    ],
  },
  module: { rules },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'bundle.css' }),
  ],
};
