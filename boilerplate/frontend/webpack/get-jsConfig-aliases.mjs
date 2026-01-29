import path from 'path';
import fs from 'fs';

/**
 * Funzione per ottenere gli alias direttamente leggendo il file jsconfig.json
 * @param {string} jsconfigAbsPath - Il percorso assoluto del file jsconfig.json
 * @returns {Record<string, string>}
 */

export function getJsConfigAliases(jsconfigAbsPath) {

  const baseDir = path.dirname(jsconfigAbsPath);

  // 3. Leggiamo il file in modo sincrono e lo convertiamo in oggetto
  const fileContent = fs.readFileSync(jsconfigAbsPath, 'utf-8');
  const jsconfig = JSON.parse(fileContent);

  const aliases = {};
  const paths = jsconfig.compilerOptions?.paths || {};

  for (const item in paths) {
    // Rimuove la wildcard /* alla fine della chiave (alias)
    const key = item.replace(/(\/\*)$/, '');

    // Prende il primo valore (path) e rimuove la wildcard /*
    const targetPath = paths[item][0].replace(/(\/\*)$/, '');

    const absolutePath = path.resolve(baseDir, targetPath);

    aliases[key] = absolutePath;
  }

  return aliases;
}
