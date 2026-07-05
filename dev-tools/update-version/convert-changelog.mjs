#!/usr/bin/env node

/* global process */
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

// crea un file `changelog-converted.md` dal precedente `changelog.txt`

const changelogPath = path.join(process.cwd(), 'changelog.txt');

// Verifica se il parametro --include-patch è stato passato
// se presente vengono conservati anche i log delle patch
const includePatch = process.argv.includes('--include-patch');

let changelogContent;

if (fs.existsSync(changelogPath)) {
  changelogContent = fs.readFileSync(changelogPath, 'utf-8');

  // Processa ogni riga del changelog
  const md = changelogContent.trim().split('\n').reduce((prev, curr) => {
    // Splitta la riga in tre parti (timestamp | versione | descrizione)
    const parts = curr.split('|').map(part => part.trim());

    if (parts.length !== 3) {
      return prev;
    }

    const [timestamp, version, description] = parts;

    // Estrae i numeri di major, minor, patch dalla versione semver (es: 1.0.1)
    const versionParts = version.split('.').map(Number);
    const [,, patch] = versionParts;

    // Determina il tipo di update
    // Se patch è 0, è un major/minor update e va sempre incluso
    // Se patch > 0, è un patch update e va incluso solo con --include-patch
    const isPatchUpdate = patch > 0;
    const shouldInclude = !isPatchUpdate || includePatch;

    if (shouldInclude) {
      // Aggiunge alla lista la versione e la descrizione
      prev.push(
        `* ${version} (${new Date(timestamp).toLocaleString('it-IT', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
          })})` +
          `${description? ' - ' + description: ''}`
      );
    }

    return prev;
  }, []);

  fs.writeFileSync(path.join(process.cwd(), 'changelog-converted.md'),
    '# Changelog\n\n' +
    md.join('\n') + '\n')
  ;

} else {
  console.log('File changelog.txt non trovato nella directory attuale');
  process.exit(1);
}

