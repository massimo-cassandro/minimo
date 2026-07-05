import { printResult } from './print-result.mjs';
import { rm, mkdir } from 'fs/promises';

export async function create_dest_folder(folder_path, removeIfExists = true) {
  try {
    if (removeIfExists) {
      // Rimuovi la cartella se esiste
      await rm(folder_path, { recursive: true, force: true });
      printResult(`dir ${folder_path} cleared`, 'infoDim');
    }
    // Ricrea la cartella (se già esiste non dà errore grazie a recursive: true)
    await mkdir(folder_path, { recursive: true });
    printResult(`dir ${folder_path} created`, 'infoDim');

  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    throw err;
  }
}
