/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { encode } from 'blurhash';
import cliProgress from 'cli-progress';

import { imgs } from './imgs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateHashes() {
  const tasks = [];
  for (const item of imgs) {
    if (item.desktop) tasks.push({ item, variant: 'desktop' });
    if (item.mobile) tasks.push({ item, variant: 'mobile' });
  }

  console.log(`🚀 Inizio elaborazione di ${tasks.length} varianti (rigenerazione totale)...`);

  const progressBar = new cliProgress.SingleBar({
    format: 'Elaborazione | {bar} | {percentage}% | {value}/{total} Crop | {file}',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);

  progressBar.start(tasks.length, 0);

  for (const task of tasks) {
    const { item, variant } = task;
    const imagePath = path.join(__dirname, item.img);
    const [ left, top, width, height ] = item[ variant ];

    try {
      if (fs.existsSync(imagePath)) {
        // 1. Estrazione metadati originali (solo una volta per item)
        // const metadata = await sharp(imagePath).metadata();
        // item.originalWidth = metadata.width;
        // item.originalHeight = metadata.height;

        // 2. Assegnazione dimensioni specifiche per il ritaglio
        // if (variant === 'desktop') {
        //   item.desktopWidth = width;
        //   item.desktopHeight = height;
        // } else if (variant === 'mobile') {
        //   item.mobileWidth = width;
        //   item.mobileHeight = height;
        // }

        // 3. Generazione BlurHash
        const { data, info } = await sharp(imagePath)
          .extract({ left, top, width, height })
          .raw()
          .ensureAlpha()
          .resize(32, 32, { fit: 'inside' })
          .toBuffer({ resolveWithObject: true });

        const hash = encode(
          new Uint8ClampedArray(data),
          info.width,
          info.height,
          4,
          4
        );

        item[ `blurhash_${variant}` ] = hash;
      }
    } catch (err) {
      console.log(`\n❌ Errore su ${item.img} (${variant}): ${err.message}\n`);
    }

    progressBar.increment({ file: item.img });
  }

  progressBar.stop();

  // --- FORMATTAZIONE OUTPUT ---

  // Generazione JSON base
  let output = JSON.stringify(imgs, null, 2);

  // Compattazione array numerici su una riga [x, y, w, h]
  output = output.replace(/\[\s+([\d,\s]+)\s+\]/g, (match, p1) => {
    return `[${p1.replace(/\s+/g, ' ').trim()}]`;
  });

  // Trasformazione in stile JS: chiavi senza virgolette e valori con virgolette singole
  const formattedArray = output
    .replace(/"([^"]+)":/g, '$1:') // Chiavi
    .replace(/"/g, "'");           // Stringhe

  const outputContent = `export const imgs = ${formattedArray};`;

  try {
    fs.writeFileSync(path.join(__dirname, 'imgs.js'), outputContent);
    console.log("\n✅ File 'imgs.js' salvato con tutte le dimensioni e formattazione richiesta!");
  } catch (err) {
    console.error('\n❌ Errore durante il salvataggio:', err.message);
  }
}

generateHashes();
