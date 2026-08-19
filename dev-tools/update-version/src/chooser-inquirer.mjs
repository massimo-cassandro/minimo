import select from '@inquirer/select';
import input from '@inquirer/input';
import * as fs from 'fs';
import { params } from './params.mjs';

export async function chooser() {
  const choices = [
    { name: 'Update Patch version', value: 'patch' },
    { name: 'Update Minor version', value: 'minor' },
    { name: 'Update Major version', value: 'major' }
  ];

  // Se il file di log non esiste, proponi l'inizializzazione
  if (!fs.existsSync(params.logFile)) {
    choices.unshift({
      name: `Initialize Changelog (v${params.oldSemver})`,
      value: 'init'
    });
  }

  choices.push({ name: 'Cancel', value: null });

  const answer = await select({
    message: `What do you want to update?${params.oldSemver ? ` (current version ${params.oldSemver})` : ''}`,
    choices: choices
  });

  params.addLog = params.toLog.indexOf(answer) !== -1 || answer === 'init';

  // Se noLogV0 è true e la major version (prospettica) è 0, il log non viene registrato (eccetto per l'inizializzazione)
  if (params.addLog && params.noLogV0 && answer !== 'init') {
    const newMajor = answer === 'major' ? params.semverArray[0] + 1 : params.semverArray[0];
    if (newMajor === 0) params.addLog = false;
  }

  if (answer && params.addLog) {
    const descr = await input({
      message: 'Description (optional): ',
      default: answer === 'init'
        ? 'Setup'
        : answer === 'patch'
          ? 'Fix / Dependencies upd'
          : ''
    });
    params.logRow.descr = descr.trim() || null;
  }

  return answer;
}
