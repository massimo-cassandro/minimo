// Simula un consumer che importa layout-tools solo per i suoi side effects
// (nessun binding usato): se `sideEffects` in package.json non lo copre,
// webpack elimina l'intero modulo in produzione.
import '../../dev-tools/layout-tools/layout-tools.js';
