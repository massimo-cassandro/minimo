// rimuove la porzione homedir da un path e la sostituisce con '~'

import {homedir} from 'os';

export function remove_homedir_string(path) {
  const homeDirRegex = new RegExp('^' + homedir());

  return path.replace(homeDirRegex, '~');
}
