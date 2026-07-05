#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-env node */

// run npm update for all packeges inside `node_modules/@massimo-cassandro` folder

import * as fs from 'fs';
import {execSync} from 'child_process';
// https://nodejs.org/api/util.html#utilstyletextformat-text-options
import { styleText } from 'node:util';

const folder = './node_modules/@massimo-cassandro',
  packages = {};

try {

  if(!fs.existsSync(folder)) {
    throw `${folder} non presente.`;
  }

  let maxLength = [];

  fs.readdirSync(folder).forEach(item => {
    let stats = fs.statSync(`${folder}/${item}`); // stats.isFile() / stats.isDirectory()
    if(stats.isDirectory()) {

      const packageJsonFile = `${folder}/${item}/package.json`;

      if(!fs.existsSync(packageJsonFile)) {
        throw `File 'package.json' in '${item}' non presente.`;
      }

      const packageJsonContent = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));

      packages[packageJsonContent.name] = {
        file    : packageJsonFile,
        oldVers : packageJsonContent.version
      };

      maxLength = Math.max(maxLength, packageJsonContent.name.length);
    }
  });

  if(Object.keys(packages).length) {
    execSync(`npm update --save ${Object.keys(packages).join(' ')}`, {stdio: 'inherit'});
  }

  // lettura versioni aggiornate
  Object.keys(packages).forEach(p => {
    const packageJsonContent = JSON.parse(fs.readFileSync(packages[p].file, 'utf8'));
    packages[p].newVers = packageJsonContent.version;
  });


  console.log( '\n' +
    Object.keys(packages).map(p =>
      styleText(
        [packages[p].oldVers === packages[p].newVers? 'green' : 'yellow'],
        `  • ${p.padEnd(' ', maxLength)}` +
        ' : ' +
        `${packages[p].oldVers} => ${packages[p].newVers}`
      )
    ).join('\n')
  );

  console.log( '\n' + styleText(['bold', 'bgGreen'], ' Aggiornamento completato. ' ) + '\n');

} catch(e) {

  console.log( styleText(['red'], `\n${e}\n` ) );
}
