/*
  Token di vanilla-cookie-consent.

  Generano le custom properties `--vcc-*`, che `cookie-consent.css` assegna alle omonime
  variabili native di vanilla-cookieconsent (es. `--vcc-bg` → `--cc-bg`).
  Il prefisso `vcc` (e non `cc`) è necessario: la libreria definisce le proprie `--cc-*` su `:root`,
  e token con gli stessi nomi entrerebbero in conflitto (con esito dipendente dall'ordine dei CSS).

  Elenco completo delle variabili della libreria:
  https://cookieconsent.orestbida.com/advanced/ui-customization.html#color-schemes
*/
export default {
  vcc: {
    'font-family': {
      $type: 'fontFamily',
      $value: '{font.family}'
    },
    bg: {
      $type: 'color',
      $value: '{body.background.color}'
    },
    'primary-color': {
      $type: 'color',
      $value: '{text.color}'
    },
    'secondary-color': {
      $type: 'color',
      $value: '{text.muted}'
    },
    'link-color': {
      $type: 'color',
      $value: '{link.color}'
    },
    'modal-border-radius': {
      $type: 'dimension',
      $value: '{radius.md}'
    },
    'btn-border-radius': {
      $type: 'dimension',
      $value: '{btn.border.radius}'
    },
    'btn-primary-bg': {
      $type: 'color',
      $value: '{btn.primary.background.color}'
    },
    'btn-primary-color': {
      $type: 'color',
      $value: '{btn.primary.color}'
    },
    'btn-primary-border-color': {
      $type: 'color',
      $value: '{btn.primary.border.color}'
    },
    'btn-primary-hover-bg': {
      $type: 'color',
      $value: '{btn.primary.hover.background.color}'
    },
    'btn-primary-hover-color': {
      $type: 'color',
      $value: '{btn.primary.hover.color}'
    },
    'btn-primary-hover-border-color': {
      $type: 'color',
      $value: '{btn.primary.hover.border.color}'
    },
    'btn-secondary-bg': {
      $type: 'color',
      $value: '{btn.secondary.background.color}'
    },
    'btn-secondary-color': {
      $type: 'color',
      $value: '{btn.secondary.color}'
    },
    'btn-secondary-border-color': {
      $type: 'color',
      $value: '{btn.secondary.border.color}'
    },
    'btn-secondary-hover-bg': {
      $type: 'color',
      $value: '{btn.secondary.hover.background.color}'
    },
    'btn-secondary-hover-color': {
      $type: 'color',
      $value: '{btn.secondary.hover.color}'
    },
    'btn-secondary-hover-border-color': {
      $type: 'color',
      $value: '{btn.secondary.hover.border.color}'
    },
    'toggle-on-bg': {
      $type: 'color',
      $value: '{btn.primary.background.color}'
    },
  }
};
