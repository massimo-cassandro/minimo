import * as styles from './spinner.module.css';

// NB la classe spinner è legata al tipo di spinner che si decide di usare, il cui file va incluso
// TODO sistema per coinfigurare il tipo di spinner da utilizzare, per permettere l'uso di più tipi di spinner nello stesso progetto

export function spinner() {
  return `<div class="${styles.spinnerWrapper}"><div class="spinner">Loading...</div></div>`;
}
