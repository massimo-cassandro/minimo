import sharp from 'sharp';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// In ESM dobbiamo definire manualmente la directory corrente se necessario
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supportedExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.gif'];
const targetQuality = 85;
const directoryPath = './';

async function convertImages() {
    try {
        const files = await readdir(directoryPath);

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            const fileNameNoExt = path.parse(file).name;

            if (supportedExtensions.includes(ext)) {
                const inputPath = path.join(directoryPath, file);
                const outputPath = path.join(directoryPath, `${fileNameNoExt}.webp`);

                await sharp(inputPath)
                    .webp({ quality: targetQuality })
                    .toFile(outputPath);

                console.log(`✅ Convertito: ${file} -> ${fileNameNoExt}.webp`);
            }
        }
        console.log('--- Conversione completata ---');
    } catch (err) {
        console.error('Errore durante l\'elaborazione:', err);
    }
}

convertImages();