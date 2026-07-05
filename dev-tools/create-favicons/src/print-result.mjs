import { printFrame } from './print-frame.mjs';
import { remove_homedir_string } from './remove-homedir-string.mjs';
import * as fs from 'fs';


export function printResult(params) {

  function printSize(size) {
    if(size > 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${size} B`;

    }
  }

  // print result
  let extra_strings = [];

  // immagini generate e dimensioni
  [
    'apple-touch-icon.png',
    'favicon.ico',
    'favicon.svg',
    'icon-192.png',
    'icon-512.png',
    params.manifest_file_name
  ].forEach(item => {
    const stats = fs.statSync(`${params.output_dir}/${item}`);
    extra_strings.push({string: `${item}: ${printSize(stats.size)}`, color: 'greenBright'});
  });

  if(params.snippet_path  !== params.output_dir && params.snippet_name !== null) {
    extra_strings.push(
      {string: ''},
      {string: `Il file snippet '${params.snippet_name}' è stato salvato nella directory:`, color: 'green'},
      {string: remove_homedir_string(params.snippet_path ), color: 'yellow'},
    );

  } else if(params.snippet_name === null) {
    extra_strings.push(
      {string: ''},
      {string: 'Il file snippet non è stato generato', color: 'magentaBright'},
    );
  }


  printFrame({
    strings: [
      {string: '** Creazione favicons completata **', color: 'bgGreen'},
      {string: ''},
      {string: 'I file generati sono nella directory:', color: 'green'},
      {string: remove_homedir_string(params.output_dir), color: 'yellow'},
      {string: ''},
      ...extra_strings
    ],
    frameColor: 'green',
    frameType: 'single'
  });
}
