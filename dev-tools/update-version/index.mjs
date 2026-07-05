#!/usr/bin/env node

/* eslint-disable no-console */
/* global process */

import * as fs from 'fs';
import * as path from 'path';

import { params } from './src/params.mjs';
import { chooser } from './src/chooser-inquirer.mjs';
import { getCliParams } from './src/get-cli-params.mjs';
import { updateSemver } from './src/update-semver.mjs';
import { createLogRow } from './src/create-log-row.mjs';
import { updateLogFile } from './src/update-log-file.mjs';
import { updatePackageJson } from './src/update-packageJson.mjs';

import clipboard from 'clipboardy';

// https://nodejs.org/api/util.html#utilstyletextformat-text-options
import { styleText } from 'node:util';

async function run() {
  // parametri da riga di comando
  getCliParams();

  // risoluzione percorsi assoluti rispetto alla dir corrente
  params.packageJsonFile = path.resolve(process.cwd(), params.packageJsonFile);
  params.logFile = path.resolve(process.cwd(), params.logFile);

  // check package.json
  if (!fs.existsSync(params.packageJsonFile)) {
    console.error( styleText(['red'], `Errore: ${params.packageJsonFile} non trovato.` ));
    process.exit(1);

  }

  params.packageJsonObj = JSON.parse(fs.readFileSync(params.packageJsonFile, 'utf8'));
  params.oldSemver = params.packageJsonObj.version;

  if(!params.oldSemver) {
    console.error( styleText(['red'], `Proprietà 'version' di '${params.cfg.packageJsonFile}' non presente` ));

  } else {
    console.log( styleText(['white', 'dim'], `Versione package.json attuale: ${params.oldSemver}` ) );
    params.semverArray = params.oldSemver.split('.').map(i => isNaN(i) ? i : +i);
  }

  //
  const choice = await chooser();

  if(choice) {
    params.updateMode = choice; // modalità scelta (init, major, minor o patch)
    updateSemver();

    params.logRow.vers = params.newSemver;

    // Scrive il log, se richiesto
    if(params.addLog) {
      createLogRow();

      if(!params.debug) {
        updateLogFile();
      }
    }

    // Aggiorna package.json SOLO se non è una inizializzazione
    if (params.updateMode !== 'init' && !params.debug) {
      updatePackageJson();
    }

    // END

    if(params.debug) {
      console.log(params);
    }

    clipboard.writeSync(
      ('v.' + params.newSemver) +
      (params.logRow.descr
        ? ' - ' + params.logRow.descr
        : params.updateMode === 'patch'
          ? ' - Upd / Fix / Dependencies upd'
          : '')
    );


    const setOutputRow = (text, rowLength, dim = false) =>
        styleText(['yellow'], '│ ') +
        styleText(['yellow', ...(dim? ['dim'] : [])], text) +
        ' '.repeat(rowLength - text.length - 1) +
        styleText(['yellow'], '│'),

      outputString1 = `👍 Versione aggiornata: ${params.oldSemver} → ${params.newSemver}`,
      outputString2 = params.logRow.fullText? `Log: ${params.logRow.fullText}` : '',
      outputLenght = Math.max(outputString1.length, outputString2.length ) + 2, // 2 = spazi esterni
      frameLine = '─'.repeat(outputLenght);

    console.log( styleText(['yellow'], '\n┌' + frameLine + '┐' ));

    console.log( setOutputRow(outputString1, outputLenght));

    if(outputString2) {
      console.log( setOutputRow(outputString2, outputLenght, true));
    }

    console.log( styleText(['yellow'], '└' + frameLine + '┘\n' ));
  }
}

run().catch(console.error);
