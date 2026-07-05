// rimuove la porzione homedir da un path e la sostituisce con '~'

import {homedir} from 'os';

export function homedir_path_to_tilde(path) {
  const homeDirRegex = new RegExp('^' + homedir());

  return path.replace(homeDirRegex, '~');
}
