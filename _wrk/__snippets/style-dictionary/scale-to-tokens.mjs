/* global process */

import readline from 'node:readline';
import { execSync } from 'node:child_process';


function copyToClipboard(text) {
  try {
    const platform = process.platform;
    if (platform === 'win32') {
      execSync('clip', { input: text });
    } else if (platform === 'darwin') {
      execSync('pbcopy', { input: text });
    } else {
      // Linux (richiede xclip o xsel installato)
      execSync('xclip -selection clipboard', { input: text });
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Configurazione dell'interfaccia
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

const input = [];

// --- Testo iniziale di spiegazione ---
// --- Testo iniziale di spiegazione ---
console.log("====================================================");
console.log("Converte scala css in tokens");
console.log(" Ogni riga un codice colore. Aggiungi `100:` al colore base.");
console.log(" Scrivi 'fine' o 'end' per elaborare");
console.log("====================================================");


// Impostiamo il prompt visivo
rl.setPrompt('>> ');
rl.prompt();

rl.on('line', (line) => {
  const check = line.trim().toLowerCase();

  if (check === "fine" || check === "end") {
    rl.close();
    return;
  }

  if (line.trim()) {
    input.push(line.trim());
  }

  rl.prompt();
});

rl.on('close', () => {
  console.log("\n--- Elaborazione completata ---");

  // indice riga colore di riferimento
  const idx100 = input.findIndex(line => line.includes('100:'));;


  if (input.length === 0) {
    console.log("Nessun dato inserito");

  } else if (idx100 === -1) {
    console.log("Colore di riferimento non indicato (devi segnarlo con `100:`");

  } else {
    const result = input.map((line, idx) => {
      let colorName = '';
      const idx10 = idx100 + 9; // indice del colore 10

      // i colori più scuri hanno il nome incrementato di 50 ad ogni step
      if (idx < idx100) {
        colorName = 100 + (50 * (idx100 - idx))

        // colori inferiori a 10
      } else if (idx > idx10) {
        colorName = '0' + String(10 - (2 * (idx - idx10)));

        // colori 90-10
      } else if (idx > idx100) {
        colorName = 100 - (10 * (idx - idx100));

      } else {
        colorName = 100;
      }

      const colore = line.replace('100:', '').trim().toLowerCase();

      return `"${colorName}": {"$value": "${colore}", "$type": "color", "$description": ""}`;

    }).join(',\n');





    console.log("========================");
    console.log(result);
    console.log("========================");

    // Copia il risultato
    const success = copyToClipboard(result);
    if (success) {
        console.log("\n✅ Risultato copiato negli appunti!");
    } else {
        console.log("\n❌ Errore durante la copia negli appunti.");
    }
  }

  process.exit(0);
});
