import * as styles from '../css/info-section.module.css';
import { classnames } from '@massimo-cassandro/js-utilities/index.js';

export function infoSection() {

  return [
    {
      // TODO gestire this.params.stickyInfo

      className: classnames(styles.infoOuterContainer, this.params.outerInfoExtraClassName),
      children: [
        {
          className: classnames(styles.infoContainer, this.params.infoExtraClassName),
          children: [
            {
              className: styles.resultInfo,
              callback: el => this.params.elements.info = el
            },
            {
              condition: this.params.search,

              tag: [`div.${styles.search}`, 'input'],
              className: this.params.searchInputAltClassName?? classnames(styles.searchInput, this.params.searchInputExtraClassName),
              callback: el => this.params.elements.searchInput = el,
              attrs: {
                type: 'search',
                title: this.params.searchInputTitle,
                placeholder: this.params.searchInputPlaceholder,
                'aria-label': this.params.searchInputAriaLabel
              }
            }
          ]
        }
      ]
    }
  ];

}

