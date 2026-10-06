import * as styles from './spinner.module.css';

// La classe dello spinner dipende dal tipo di spinner in uso; deve essere incluso il file CSS corrispondente.
// TODO: sistema per configurare il tipo di spinner, così da consentire più tipi di spinner nello stesso progetto

/**
 * Restituisce il markup HTML di uno spinner di caricamento.
 * @returns {string}
 */
export function spinner() {
  return `<div class="${styles.spinnerWrapper}"><div class="spinner">Loading...</div></div>`;
}
