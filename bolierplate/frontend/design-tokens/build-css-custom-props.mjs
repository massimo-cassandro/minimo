/* eslint-disable no-console */
import * as fs from 'fs';
// import * as path from 'path';

const source_files = [
    {default: './figma/design-tokens/xxx.light.tokens.json', dark: './figma/design-tokens/xxx.dark.tokens.json' }
  ]
  ,groups_to_skip = ['figma_only']
  // ,openProps_tokens_file = new URL('../../node_modules/open-props/dist/open-props.module.js', import.meta.url).pathname
  ,dest_file = new URL('../src/config/custom-properties-figma.css', import.meta.url).pathname
;

/*
source:

i tolken che iniziano con `dark-` sono relativi al dark mode

{
  "blu-bn": {
    "$type": "color",
    "$value": "#8286a7"
  },
  "blu-bn-light": {
    "$type": "color",
    "$value": "#d4d8f8"
  },
  "dark-blue-2-medium": {
    "$type": "color",
    "$value": "#1e512b"
  },
  ...
}

*/

// console.log(dest_file);

// cancella contenuto file se esiste
fs.writeFileSync(dest_file, '');

source_files.forEach(file => {

  const default_props = JSON.parse(fs.readFileSync(new URL(file.default, import.meta.url)))
    ,dark_props = file.dark? JSON.parse(fs.readFileSync(new URL(file.dark, import.meta.url))) : null
    ,parsed = {default: {}, dark: {}}
    ,pxToRem = (px_str) => (parseFloat(px_str) / 16).toFixed(2) + 'rem'

    ,parse_prop_value = (token) => {

      let value = token.$value;

      // alias
      if(/^{.*?}$/.test(value)) {
        let alias = value.replace(/^{|}$/g, '');
        alias = /^--/.test(alias) ? alias : '--' + alias;
        return `var(${alias})`;
      }

      // pills values
      if(value === '9999px' || value === '999px') {
        value = '999rem';
      }

      // px to Rem
      if(token.$type === 'dimension' && /(px)$/.test(value)) {
        value = pxToRem(value);
      }

      return value;
    }
  ;

  Object.keys(default_props)
    .toSorted((a, b) => a.replace('--', '').localeCompare(b.replace('--', ''), 'en', {numeric: true, sensitivity: 'base'}))
    .forEach(k => {

      if(groups_to_skip.indexOf(k) === -1) {

        let varname = (/^--/.test(k) ? k : '--' + k).replace(/^(--color-)/, '--');
        const value = parse_prop_value(default_props[k]);

        // if(/^(dark\-)/.test(k)) {
        //   varname = varname.replace(/^(--dark-)/, '--');
        //   parsed.dark[varname] = value;

        // } else {
        //   parsed.default[varname] = value;
        // }
        parsed.default[varname] = value;


        if(dark_props && dark_props[k]) {
          const dark_prop_value = parse_prop_value(dark_props[k]);

          if(dark_prop_value !== parsed.default[varname]) {
            parsed.dark[varname] = dark_prop_value;
          }
        }
      }


    }); // end map

  let dest_file_text =
    '/* stylelint-disable color-hex-length */\n\n' +
    '/* File generato da frontend/design-tokens/build-css-custom-props.mjs. NON EDITARE */\n' +
    '/* Eventuali riferimenti ad altre variabili non presenti in questo file provengono da OpenProps */\n\n' +

    ':root {\n' +
    '  color-scheme: light dark;\n' +
      Object.keys(parsed.default).map(k => `  ${k}: ${parsed.default[k]};`).join('\n') +
    '\n}\n';

  if(Object.keys(parsed.dark).length) {
    dest_file_text += '\n@media (prefers-color-scheme: dark) {\n' +
      '  :root {\n' +
          Object.keys(parsed.dark).map(k => `    ${k}: ${parsed.dark[k]};`).join('\n') +
      '\n  }\n' +
    '}\n\n';
  }

  fs.writeFileSync(dest_file, dest_file_text, { flag: 'a+' } );

});

console.log('*** END css var builder ***');
