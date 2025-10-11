module.exports = {
  "connector": {
    "name": "local",
    "options": {
      "pattern": ["./build/**/*.html"] // Analizza i file HTML generati nella directory di build
    }
  },
  "extends": [
    "development", // Configurazione base per lo sviluppo
    "accessibility", // Regole per l'accessibilità
    "performance", // Regole per le prestazioni
    "security", // Regole per la sicurezza
    "html-checker" // Controllo della validità HTML
  ],
  "hints": {
    "axe": "error", // Controlla l'accessibilità con axe-core
    "content-type": "error", // Verifica i tipi di contenuto corretti
    "disown-opener": "warning", // Consiglia di usare `rel="noopener"`
    "http-cache": ["warning", { "maxAge": 31536000 }], // Suggerisce una cache HTTP ottimale
    "image-optimization-cloudinary": "off", // Disattiva l'ottimizzazione delle immagini
    "meta-viewport": "error", // Verifica la presenza del meta tag viewport
    "no-vulnerable-javascript-libraries": "error", // Controlla librerie JS vulnerabili
    "performance-budget": [
      "warning",
      {
        "resourceTypes": {
          "script": 250, // Limite di 250 KB per gli script
          "image": 500 // Limite di 500 KB per le immagini
        }
      }
    ],
    "strict-transport-security": "error", // Suggerisce l'uso di HSTS
    "validate-set-cookie-header": "error" // Controlla l'uso corretto dell'header Set-Cookie
  }
};
