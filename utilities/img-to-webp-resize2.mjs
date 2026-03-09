/* eslint-disable no-console */
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import path from 'path';

const supportedExtensions = [ '.jpg', '.jpeg', '.png', '.tiff', '.gif' ];
const targetQuality = 85;

// Parametri di soglia: ridimensiona solo se l'originale è superiore a ENTRAMBI
const width = 1600;

const sourcePath = './jpeg/';
const destPath = './webp/';

async function convertImages() {
  try {
    const files = await readdir(sourcePath);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const fileNameNoExt = path.parse(file).name;

      if (supportedExtensions.includes(ext)) {
        const inputPath = path.join(sourcePath, file);
        const outputPath = path.join(destPath, `${fileNameNoExt}.webp`);

        const image = sharp(inputPath);
        const metadata = await image.metadata();

        let pipeline = image.webp({ quality: targetQuality });

        // LOGICA: Ridimensiona solo se l'immagine è > 3000px di larghezza E > 1560px di altezza
        if (metadata.width > width) {
          pipeline = pipeline.resize({
            width: width,
            fit: 'outside', // Mantiene le proporzioni garantendo i minimi
            withoutEnlargement: true
          });
          console.log(`↔️ Ridimensionato: ${file}`);
        } else {
          console.log(`🖼️ Solo conversione (dimensioni originali ${metadata.width}x${metadata.height}): ${file}`);
        }

        await pipeline.toFile(outputPath);
        console.log(`✅ Completato: ${fileNameNoExt}.webp`);
      }
    }
    console.log('--- Elaborazione terminata ---');
  } catch (err) {
    console.error('Errore durante l\'elaborazione:', err);
  }
}

convertImages();
