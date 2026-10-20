import * as styles from './layout-tools.module.css';

// TODO aggiungere popup info viewport
// TODO integrare breakpoint BS5 come vecchio layout-tools

const div = document.createElement('div');
div.className = styles.mediaMonitor;
div.id = 'minimo-layout-tools';

document.body.appendChild(div);

// soluzione temporanea, al clic si deve aprire un menu con le info e con il pulsante di rimozione
div.addEventListener('click', () => {
  div.remove();
});
