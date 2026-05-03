export const breakpoints = [
  {
    name: 'xxl',
    mq: '(min-width: 1400px)',
    w: 1920,
    h: 1080,
    dpr2: false
  },
  {
    name: 'xl',
    mq: '(min-width: 1200px) and (max-width: 1399px)',
    w: 1400,
    h: 788,
    dpr2: false
  },
  {
    name: 'lg',
    mq: '(min-width: 992px) and (max-width: 1199px)',
    w: 1200,
    h: 675,
    dpr2: false
  },
  {
    name: 'md',
    ar: '16/9',
    mq: '(min-width: 768px) and (max-width: 991px)',
    w: 992,
    h: 558,
    dpr2: true
  },
  {
    name: 'sm',
    ar: '16/9',
    mq: '(min-width: 576px) and (max-width: 767px)',
    w: 768,
    h: 432,
    dpr2: true
  },
  {
    name: 'xs-portrait',
    ar: '16/9',
    mq: '(orientation: portrait) and (max-width: 575px)',
    w: 324,
    h: 576,
    dpr2: true
  },
  {
    name: 'xs-landscape',
    ar: '16/9',
    mq: '(orientation: landscape) and (max-width: 575px)',
    w: 576,
    h: 324,
    dpr2: true
  }
];
