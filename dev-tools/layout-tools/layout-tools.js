import * as styles from './layout-tools.module.css';

// TODO aggiungere popup info viewport

const div = document.createElement('div');
div.className = styles.mediaMonitor;

document.body.appendChild(div);

// soluzione temporanea, al clic si deve aprire un menu con le info e con il pulsante di rimozione
div.addEventListener('click', () => {
  div.remove();
});
