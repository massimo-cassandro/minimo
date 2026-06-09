import { classnames } from '@massimo-cassandro/js-utilities/index.js';
import { domBuilder } from '@massimo-cassandro/dom-builder/index.js';

import styles from './ui-button.css?raw';

import m365Icon from '@icons/microsoft365.svg?inline';
import usersIcon from '@icons/users.svg?inline';
import gearIcon from '@icons/gear.svg?inline';
import shareIcon from '@icons/share-network.svg?inline';
import tapeIcon from '@icons/cassette-tape.svg?inline';
import booksIcon from '@icons/books.svg?inline';
import noteIcon from '@icons/note.svg?inline';


const icons = {
  m365: m365Icon,
  users: usersIcon,
  settings: gearIcon,
  share: shareIcon,
  log: tapeIcon,
  dict: booksIcon,
  reports: noteIcon
};


class UiButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // commentare per light dom
  }

  // implementare se necessario modificare gli attributi nel runtime
  /*
  static get observedAttributes() {
    return ['icon', 'variant', 'size', 'url'];
  }

  attributeChangedCallback() {}
  */

  connectedCallback() {
    this.shadowRoot.innerHTML = '';
    this.render();
  }

  // approccio per eventuale modifica degli attributi nel runtime
  // set variant(val) {this.setAttribute('variant', val);} get variant(val) {return this.getAttribute('variant')}


  render() {
    const url = this.getAttribute('url') || null

      // default primo valore
      ,allowed_params = {
        variant: ['primary', 'login', 'primary-outline'], // 'secondary',
        size: [null, 'sm', 'lg', 'xl'],
        icon: [null, ...Object.keys(icons)]
      }
    ;

    const params = {};

    for (const [attr, allowed] of Object.entries(allowed_params)) {
      const value = this.getAttribute(attr);

      if (value && !allowed.includes(value)) {
        // eslint-disable-next-line no-console
        console.error(`[IconButton] Valore non corretto per “${attr}” (${value}). Reset a: ${allowed[0]}`);
        params[attr] = allowed[0];

      } else {
        params[attr] = value || allowed[0];
      }
    }

    const iconSVG = params.icon? icons[params.icon] : null;

    // impostazioni predefinite per login
    if(params.variant === 'login') {
      params.size = 'xl';
    }

    domBuilder([
      {
        ...(url
          ? { tag: 'a', attrs: { href: url } }
          : { tag: 'button', attrs: { type: 'button' } }
        ),

        className: classnames(
          'ui-btn',
          `variant-${params.variant}`,
          params.size? `size-${params.size}` : null
        ),
        children: [
          {
            tag: 'style',
            content: styles,
          },
          {
            tag: 'slot',
            attrs: {
              name: 'custom-icon'
            },
            children: [
              {
                tag: 'span',
                className: 'ui-btn-icon',
                content: iconSVG?? '',
                condition: !!iconSVG
              }
            ]
          },
          {
            tag: 'span',
            className: 'ui-btn-label',
            children: [
              {
                tag: 'slot'
              }
            ]
          }
        ]
      }
    ], this.shadowRoot); // <- this.innerHTML per light DOM

  }
}

if (!customElements.get('ui-button')) {
  customElements.define('ui-button', UiButton);
}
