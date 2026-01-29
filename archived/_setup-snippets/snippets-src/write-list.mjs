/* eslint-disable no-console */

import snippets_list from './snippets-list.mjs';
// https://nodejs.org/api/util.html#utilstyletextformat-text-options
import { styleText } from 'node:util';

import { writeFileSync } from 'fs';
import * as path from 'path';
import * as fs from 'fs';


const default_obj = {
  label: null,
  descr: [],              // renderizzati come '* ...'
  snippets: [],           // renderizzati come '* `...`'

  packages: [],           // renderizzati come `npm i --S ...` o `--D ...`, se presenti dei subarray
  dev_packages: [],       // vengono renderizati come `npm i` distinti
  addConfigFile: [],      // files in `config_files` da riprodurre con `echo` e `>>`

  uninstall: [],          // i pacchetti indicati vengono renderizzati come `npm uninstall ...`

  fav: false,             // se true, il pacchetto viene considerato tra i preferiti e messo in cima alla lista
};

// chiavi da escludere dalla risoluzione


const __dirname = new URL('.', import.meta.url).pathname
  ,target_file = path.resolve(__dirname, '../README.md')

  ,md_code_block = (code, flag='') => code? '```bash\n' + flag + code + '\n```\n\n' : null

  ,md_descr_block = (descr_array) => {
    return (descr_array && descr_array.length)
      ? descr_array.map( i => '* ' + i ).join('\n')
      : null;
  }
  ,md_label = (text) => {
    return text
      ? `\n**${text}:**\n`
      : null;
  }

  ,makeInstallString = (packageArray, isDev) => {
    return `npm i ${isDev? '-D' : '-S'} ${packageArray.join(' ')}`;
  }
;




const content = snippets_list
  .toSorted((a, b) => Number(b.fav?? 0) - Number(a.fav?? 0) || a.label.localeCompare(b.label))
  .map( item => {
    item = {...default_obj, ...item};

    const temp = [], install_string = [];

    const parsed_item = [
      '## ' + (item.label?? '???'),
      md_descr_block(item.descr)
    ];

    if(item.snippets && item.snippets.length) {
      parsed_item.push( item.snippets.map(i => '* `' + i + '`').join('\n') );

    }

    if(item.uninstall && item.uninstall.length) {
      parsed_item.push(
        md_label('uninstall'),
        md_code_block( 'npm uninstall ' + item.uninstall.join(' '))
      );
    }


    ['packages', 'dev_packages'].forEach( packageType => {

      const isDev = packageType === 'dev_packages';

      if(item[packageType] && item[packageType].length) {

        // se il primo elemento è un array si tratta di un array di array
        if(Array.isArray(item[packageType][0])) {
          temp.push(
            item[packageType].map( pp => makeInstallString(pp, isDev)).join(' && ')
          );

        } else {
          temp.push(makeInstallString(item[packageType], isDev));
        }

      }
    });

    install_string.push(...temp);

    if(install_string.length) {
      parsed_item.push(
        md_label('install'),
        md_code_block(install_string.join(' && '))
      );
    }

    (item.addConfigFile??[]).forEach( configFile => {

      const filePath = path.resolve(__dirname, `../config_files/${configFile}`),
        file_content = fs.readFileSync(filePath, 'utf8').replace(/\n/g, '\\n').replace(/"/g, '\\"');

      parsed_item.push(
        '*' + configFile.replace(/^_/, '.') + '*:\n\n' +
        md_code_block('echo "' + file_content +`" > ${configFile.replace(/^_/, '.')}`)
      );
    });


    return parsed_item.filter(i => i !== null).join('\n');
  });

writeFileSync(target_file, '# Setup snippets\n\n' + content.join('\n\n'), 'utf-8');
console.log('');
console.log( styleText(['bgGreen', 'bold'], ` Done -> ${target_file} ` ) );
console.log('');
