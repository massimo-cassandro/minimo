import { configManager } from './config-manager.mjs';

// rimuove l'estensione e normalizza il nome del file
export function parseSvgFilename(filename) {

  const cfg = configManager.getCfg();

  let parsed_filename = filename.split('.').slice(0, -1).join('.') // rimuove l'estensione
    .replaceAll(' ', '-'); // sostituisce gli spazi con trattini

  // removing filename prefixes
  cfg.remove_prefix.forEach(prefix => {
    if(parsed_filename.startsWith(prefix)) {
      parsed_filename = parsed_filename.slice(prefix.length);
    }
  });

  return parsed_filename;
}
