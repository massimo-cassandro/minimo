const fs = require('fs');
const path = require('path');

const directoryPath = '/private/tmp';

try {
  // Legge il contenuto della cartella
  const files = fs.readdirSync(directoryPath, { withFileTypes: true });

  let deletedCount = 0;

  files.forEach((file) => {
    // Verifica che sia un file (non una cartella) e che inizi con '_'
    if (file.isFile() && file.name.startsWith('_')) {
      
      // Controlla se l'estensione è un'immagine comune
      const ext = path.extname(file.name).toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp', '.svg'];

      if (imageExtensions.includes(ext)) {
        const filePath = path.join(directoryPath, file.name);
        
        fs.unlinkSync(filePath);
        console.log(`Eliminato: ${file.name}`);
        deletedCount++;
      }
    }
  });

  console.log(`--- Operazione completata. File eliminati: ${deletedCount} ---`);

} catch (err) {
  console.error(`Errore durante l'accesso alla cartella: ${err.message}`);
}