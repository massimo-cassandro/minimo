import { configManager } from './config-manager.mjs';

// remove extension and normalize filename
export function parseSvgFilename(filename) {

  const cfg = configManager.getCfg();

  let parsed_filename = filename.split('.').slice(0, -1).join('.') // remove extension
    .replaceAll(' ', '-'); // replace spaces with hyphens

  // removing filename prefixes
  cfg.remove_prefix.forEach(prefix => {
    if(parsed_filename.startsWith(prefix)) {
      parsed_filename = parsed_filename.slice(prefix.length);
    }
  });

  return parsed_filename;
}
