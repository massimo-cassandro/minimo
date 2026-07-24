// Simula un consumer che importa UN SOLO componente da index.js.
// snackbar e slide-up-down-toggle NON vengono mai importati: nel bundle
// prodotto non devono comparire (né il loro JS né il loro CSS).
import { modalPopup } from '../../index.js';

// chiamata reale (non solo un re-export): impedisce che l'intero import
// venga considerato "non usato" e quindi eliminato a priori dal tree-shaking
modalPopup({ content: 'test' });

