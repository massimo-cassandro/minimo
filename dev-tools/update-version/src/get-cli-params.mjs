/* global process */

import { params } from './params.mjs';

export function getCliParams() {
  const args = process.argv.slice(2);

  args.forEach(arg => {

    // Percorso package.json
    if (arg.startsWith('--pkg=')) {
      params.packageJsonFile = arg.split('=')[1].trim();
    }

    // Percorso file di log
    if (arg.startsWith('--log-file=')) {
      params.logFile = arg.split('=')[1].trim();
      // Se il file finisce in .txt, disabilita markdownLog
      if (params.logFile.endsWith('.txt')) params.markdownLog = false;
    }

    // Abilita log anche per le patch
    if (arg === '--log-patch') {
      if (!params.toLog.includes('patch')) params.toLog.push('patch');
    }

  });
}
