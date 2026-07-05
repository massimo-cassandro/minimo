import { params } from './params.mjs';

export function updateSemver() {
  // Se stiamo solo inizializzando il log, la nuova versione è uguale alla vecchia
  if (params.updateMode === 'init') {
    params.newSemver = params.oldSemver;
    return;
  }

  // ... logica esistente per major, minor, patch ...
  if (params.semverArray.length < 3) while (params.semverArray.length < 3) params.semverArray.push(0);

  switch (params.updateMode) {
    case 'major':
      params.semverArray[0]++;
      params.semverArray[1] = 0;
      params.semverArray[2] = 0;
      break;
    case 'minor':
      params.semverArray[1]++;
      params.semverArray[2] = 0;
      break;
    case 'patch':
      params.semverArray[2]++;
      break;
  }

  params.newSemver = params.semverArray.join('.');
}
