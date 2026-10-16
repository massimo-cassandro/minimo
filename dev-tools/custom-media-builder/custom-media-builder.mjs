#!/usr/bin/env node

/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import process from 'process';
import { pathToFileURL } from 'url';
import { styleText } from 'util';

/**
 * Genera il file css delle @custom-media.
 * Il file viene riscritto solo se il contenuto è cambiato,
 * per non attivare inutilmente il watcher di webpack.
 *
 * @param {object} [options]
 * @param {string} [options.src] modulo JS con l'export default delle custom media
 * @param {string} [options.dest] file css da generare (default: file in `src` con estensione cambiata in `.css`)
 * @returns {Promise<boolean>} `true` se il file è stato riscritto
 *
 * @example
 * await buildCustomMedia({
 *   src: './app/css/custom-media.js',
 *   dest: './app/css/custom-media.css',
 * });
 */
export async function buildCustomMedia({
  src = './app/css/custom-media.js',
  dest = null,
} = {}) {

  const srcPath = path.resolve(src),
    destPath = path.resolve(dest ?? srcPath.replace(/\.m?js$/, '.css'));


  const { default: customMedia } = await import(pathToFileURL(srcPath).href);

  if (!customMedia || typeof customMedia !== 'object') {
    throw new Error(`${src}: export default mancante o non valido`);
  }

  const rows = Object.entries(customMedia).map(([name, query]) => {
    if (typeof query !== 'string' || !query.trim()) {
      throw new Error(`${src}: valore non valido per "${name}"`);
    }
    return `@custom-media --${name.replace(/^--/, '')} ${query.trim()};`;
  });

  const content = '/* File generato da custom-media-builder.mjs a partire da ' +
    `${path.basename(srcPath)}.\nEVENTUALI MODIFICHE ANDRANNO PERDUTE */\n\n` +
    rows.join('\n') + '\n';

  if (fs.existsSync(destPath) && fs.readFileSync(destPath, 'utf8') === content) {
    return false;
  }

  fs.writeFileSync(destPath, content);
  return true;
}

// esecuzione da riga di comando
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const args = Object.fromEntries(
    process.argv.slice(2)
      .map(arg => arg.match(/^--(src|dest)=(.+)$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value])
  );

  try {
    const written = await buildCustomMedia(args);

    console.log(styleText('yellow', written ? 'custom media: file aggiornato' : 'custom media: nessuna modifica'));

  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
