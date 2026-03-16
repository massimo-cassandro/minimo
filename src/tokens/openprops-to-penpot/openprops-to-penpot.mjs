import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputFile = join(__dirname, 'open-props.resolver.json');
const outputFile = join(__dirname, 'open-props.json');

async function convertTokens() {
  try {
    const rawData = await readFile(inputFile, 'utf-8');
    const resolver = JSON.parse(rawData);
    const converted = {};

    const sources = resolver.resolutionOrder?.[0]?.sources || [];

    // Lista di gruppi che sappiamo contenere colori (opzionale, per maggiore sicurezza)
    // O possiamo affidarci al $type e al contenuto del riferimento.

    for (const source of sources) {
      for (const [groupName, groupTokens] of Object.entries(source)) {

        for (const [tokenKey, tokenValue] of Object.entries(groupTokens)) {

          // COLORI

          const val = tokenValue.$value;

          // 1. Verifica se è un colore esplicito (HEX)
          const isExplicitColor = tokenValue.$type === 'color' && val?.hex;

          // 2. Verifica se è un riferimento.
          // Deve essere una stringa {...} E il token deve essere dichiarato come $type: "color"
          // Questo esclude automaticamente gli "ease" anche se hanno riferimenti.
          const isColorReference = typeof val === 'string' &&
                                   val.startsWith('{') &&
                                   tokenValue.$type === 'color';

          if (isExplicitColor || isColorReference) {

            if(converted[groupName] == null) {
              converted[groupName] = {};
            }

            const description = [
              tokenValue.$description || null,
              `[--${groupName}-${tokenKey}]`
            ].filter(i => i != null).join(' ');

            converted[groupName][tokenKey.padStart(2, '0')] = {
              "$value": isExplicitColor ? val.hex : val,
              "$type": "color",
              "$description": description
            };
          }



        }
      }
    }

    await writeFile(outputFile, JSON.stringify({openProps: converted}, null, 2), 'utf-8');
    console.log(`Successo! Creati ${Object.keys(converted).length} token colore in open-props.json.`);

  } catch (error) {
    console.error('Errore:', error.message);
  }
}

convertTokens();
