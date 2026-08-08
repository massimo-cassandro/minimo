import * as styles from './breakpoints.module.css';

// init
const currentScript = document.currentScript
  ,framework = currentScript.dataset.fw || 'bs5'
  ,position = (currentScript.dataset.position || 'top left')

  ,breakpoints_tags = {

    bs3 : '<span class="visible-xs-inline">xs</span>' +
      '<span class="visible-sm-inline">sm</span>' +
      '<span class="visible-md-inline">md</span>' +
      '<span class="visible-lg-inline">lg</span>',

    bs4 : '<span class="d-sm-none">xs</span>' +
      '<span class="d-none d-sm-inline d-md-none">sm</span>' +
      '<span class="d-none d-md-inline d-lg-none">md</span>' +
      '<span class="d-none d-lg-inline d-xl-none">lg</span>' +
      '<span class="d-none d-xl-inline">xl</span>',

    bs5 : '<span class="d-sm-none">xs</span>' +
      '<span class="d-none d-sm-inline d-md-none">sm</span>' +
      '<span class="d-none d-md-inline d-lg-none">md</span>' +
      '<span class="d-none d-lg-inline d-xl-none">lg</span>' +
      '<span class="d-none d-xl-inline d-xxl-none">xl</span>' +
      '<span class="d-none d-xxl-inline">xxl</span>',

    foundation6 : '<span class="show-for-small-only">small</span>' +
      '<span class="show-for-medium-only">medium</span>' +
      '<span class="show-for-large-only">large</span>' +
      '<span class="show-for-xlarge">xlarge</span>'
  }
;

const wrapper_classes = [
  styles.wrapper,
  ...(position.split(' ').map(p => styles[p]))
].join(' ');

document.body.insertAdjacentHTML('beforeend',
  `<div class="${wrapper_classes}">${breakpoints_tags[framework]}</div>`
);

const wrapper = document.querySelector(`.${styles.wrapper}`);

wrapper.addEventListener('click', () => {
  wrapper.classList.toggle(styles.hidden);
}, false);
