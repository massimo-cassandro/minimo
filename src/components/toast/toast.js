// forked from https://github.com/argyleink/gui-challenges/tree/main/toast
// https://web.dev/articles/building/a-toast-component?hl=en

// TODO rivedere

import * as styles from './toast.module.css';


const init = () => {
  const toastWrapper = document.createElement('section');
  toastWrapper.classList.add(styles.toastWrapper);

  // document.firstElementChild.insertBefore(toastWrapper, document.body);
  document.body.append(toastWrapper);
  return toastWrapper;
};

const createToast = text => {
  const thisToast = document.createElement('output');

  thisToast.innerHTML = text;
  thisToast.classList.add(styles.toast);
  thisToast.setAttribute('role', 'status');
  thisToast.setAttribute('aria-live', 'polite');

  return thisToast;
};

const addToast = toast => {
  const { matches:motionOK } = window.matchMedia(
    '(prefers-reduced-motion: no-preference)'
  );

  toastWrapper.children.length && motionOK
    ? flipToast(toast)
    : toastWrapper.appendChild(toast);
};

const Toast = text => {
  let toast = createToast(text);
  addToast(toast);

  return Promise.allSettled(
    toast.getAnimations().map( animation => animation.finished )
  ).then(() => {
    toastWrapper.removeChild(toast);
  });
};

// https://aerotwist.com/blog/flip-your-animations/
const flipToast = toast => {
  // FIRST
  const first = toastWrapper.offsetHeight;

  // add new child to change container size
  toastWrapper.appendChild(toast);

  // LAST
  const last = toastWrapper.offsetHeight;

  // INVERT
  const invert = last - first;

  // PLAY
  const animation = toastWrapper.animate([
    { transform: `translateY(${invert}px)` },
    { transform: 'translateY(0)' }
  ], {
    duration: 150,
    easing: 'ease-out',
  });

  animation.startTime = document.timeline.currentTime;
};

const toastWrapper = init();
export { Toast };
