#!/usr/bin/env node

/* eslint-disable no-console */

// rivela eventuale custom props css nei file della dir data non presenti nel file css di definizione
// uso: node check-unresolved-custom-props.mjs --config ./path/to-config.mjs

import path from 'path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import { glob } from 'node:fs/promises';
import { styleText, parseArgs } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Configurazione e parsing dei flag
const options = {
  config: {
    type: 'string',
    short: 'c',
  },
  // Qui in futuro potrai aggiungere altri flag, es:
  // verbose: { type: 'boolean', short: 'v' }
};

const { values } = parseArgs({ options });

if (!values.config) {
  console.error(styleText(['red'], 'Errore: Devi fornire il percorso del config con il flag --config o -c'));
  console.log('Esempio: node check-unresolved-custom-props.mjs --config ./config.mjs');
  process.exit(1);
}

const absoluteConfigPath = path.resolve(process.cwd(), values.config);
const configDir = path.dirname(absoluteConfigPath);

async function run() {
  try {

    const { default: config } = await import(pathToFileURL(absoluteConfigPath).href);
console.log(config);
    const custom_prop_file_path = path.resolve(configDir, path.join(config.buildPath, config.destFile));
    const custom_prop_filename = path.basename(custom_prop_file_path);
    const checkdir = path.resolve(configDir, config.dir_to_check);
    const exclude = config.exclude_pattern;

    const files = [];
    for await (const entry of glob(path.join(checkdir, '/**/*.css'))) {
      if (!entry.endsWith(custom_prop_filename)) {
        files.push(entry);
      }
    }

    if (!fs.existsSync(custom_prop_file_path)) {
      throw new Error(`File delle proprietà non trovato: ${custom_prop_file_path}`);
    }

    // lista custom props definiti
    const cssContent = fs.readFileSync(custom_prop_file_path, 'utf-8');
    const regex = /--([a-z0-9-]+)(?=\s*:)/g;
    const propertyNamesList = [...cssContent.matchAll(regex)].map(match => `--${match[1]}`);
    // extra_custom_props_files 

    (config.extra_custom_props_files??[]).forEach(extraCustomePropsFile => {
      
      const extraCustomPropsContent = fs.readFileSync(
        path.resolve(configDir, extraCustomePropsFile), 
      'utf-8');

      const extraMatches = [...extraCustomPropsContent.matchAll(regex)].map(match => `--${match[1]}`);
      propertyNamesList.push(...extraMatches);
    });

  

    // rilevamento custom props nei vari file css
    const regex2 = /var\(\s*(--[a-z0-9-]+)\s*(,.*?)?\)/g;
    const unresolved_props = [];
    const check = []; // per controllo aggiuntivo esecuzione

    files.forEach(file => {
      const fileContent = fs.readFileSync(file, 'utf-8');
      // const filename = path.relative(checkdir, file);
      const filename = path.relative(configDir, file);
      const matches = [...fileContent.matchAll(regex2)];

      matches.forEach(match => {
        const cprop = match[1];
        const isExcluded = exclude.some(exRegex => exRegex.test(cprop));
        const isDefined = propertyNamesList.includes(cprop);

        const lineNumber = fileContent.substring(0, match.index).split('\n').length;
        if (!isExcluded && !isDefined) {
          // unresolved_props.push(`${filename}:${lineNumber} -> var(${cprop})`);
          unresolved_props.push({file: filename, line: lineNumber, prop: cprop});
        }

        check.push(`${filename}:${lineNumber} - ${cprop} - unresolved: ${(!isExcluded && !isDefined) ? 'Y' : 'N'}`);
      });
    });

    unresolved_props.sort((a,b) => a.file.localeCompare(b.file));


    const result_file = path.resolve(configDir, 'unresolved-props.md');

    console.log(styleText(['green'], 
      `${unresolved_props.length} custom properties non impostate ` +
      `-> ${path.relative(process.cwd(), result_file)}`)
    );

    // Output
    fs.writeFileSync(result_file, unresolved_props
      .map(item => `* [${path.basename(item.file)} :: ${item.line}](${item.file}#L${item.line}) -> var(${item.prop})`)
      .join('\n'), 'utf-8');
    
    // fs.writeFileSync(path.resolve(configDir, 'full-result.txt'), check.join('\n'), 'utf-8');


    console.log(styleText(['green'], '**** FINE ****'));

  } catch (err) {
    console.log(styleText(['redBright'], err.stack));
    // console.error(styleText(['red'], `Errore: ${err.message}`));
    process.exit(1);
  }
}

run();
