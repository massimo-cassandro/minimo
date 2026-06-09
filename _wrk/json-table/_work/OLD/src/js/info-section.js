import * as styles from '../css/info.module.css';

export function infoSection() {


  const searchInputClassName = this.params.searchInputClassName?? (this.params.infoAltClassName?? styles.searchInput),
    searchInput =
      `<div class="${styles.search}">` +
        '<input' +
          ` title="${this.params.searchInputTitle}"` +
          ` placeholder="${this.params.searchInputPlaceholder}"` +
          ` aria-label="${this.params.searchInputAriaLabel}"` +
          (searchInputClassName? ` class="${searchInputClassName}"` : '') +
          ' type="search"' +
        '/>' +
      '</div>';

  const infoSection = document.createElement('div');
  infoSection.className = this.params.infoAltClassName??
    styles.info + (this.params.infoExtraClassName? ` ${this.params.infoExtraClassName}` : '');

  infoSection.innerHTML = '<div' +
    (this.params.infoAltClassName? '' : ` class="${styles.resultInfo}"`) +
    '>{{TODO resultInfoText}}</div>' +
    (this.params.search? searchInput : '');

  // TODO add event listener to search input

  return infoSection;
}

