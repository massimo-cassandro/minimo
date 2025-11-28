export default {
  // Estende la configurazione base e quella specifica per Tailwind
  extends: [
    '@massimo-cassandro/stylelint-config',
    'stylelint-config-standard', // Consigliato per le regole standard moderne
    'stylelint-config-tailwindcss' // Configurazione specifica per Tailwind CSS
  ],
  
  // File da ignorare durante l'analisi
  ignoreFiles: [
    'node_modules/**/*.{css,scss}',
    'vendor/**/*.{css,scss}',
    'templates/**/*.{css,scss}',
    'dist/**/*.css',
    'build/**/*.css',
    'public/**/*.css',
    'test/**/*.css'
  ],

  // Override delle regole specifiche
  rules: {
    // Disabilita le regole che potrebbero entrare in conflitto con la sintassi di Tailwind
    // Queste sono spesso coperte da 'stylelint-config-tailwindcss' ma è una buona pratica
    // mantenerle se si notano falsi positivi.
    'at-rule-no-unknown': [
      true, 
      {
        // Permette le direttive Tailwind come @apply, @tailwind, ecc.
        ignoreAtRules: [
          'tailwind', 
          'apply', 
          'variants', 
          'responsive', 
          'screen'
        ]
      }
    ],

    // Regole che erano presenti nel tuo config originale (se vuoi riattivarle)
    // 'value-keyword-case': null,
    // 'number-no-trailing-zeros': null,
  }
};