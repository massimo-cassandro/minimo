

import { params } from './params.js';
import { domBuilder, classnames } from '@massimo-cassandro/minimo';

import * as styles from './layout.module.css';

domBuilder([
  {
    tag: 'article',
    className: styles.mainWrapper,
    attrs: {
      style: `--_thumb-size:${params.thumbnailSize}px`
    },
    callback: el => params.mainWrapper = el,
    children: [
      {
        tag: 'h1',
        className: styles.title,
        content: 'Image Cropper'
      },
      {
        tag: 'section',
        className: styles.imgControlPanel,
        callback: el => params.imgControlsWrapper = el
      },
      {
        tag: 'section',
        className: styles.imgArea,
        callback: el => params.imgArea = el
      },
      {
        tag: 'section',
        className: classnames(styles.panel, styles.imgInfoPanel),
        callback: el => params.imgInfoPanelWrapper = el
      },
      {
        tag: 'section',
        className: classnames(styles.panel, styles.appControlPanel),
        callback: el => params.appControlPanelWrapper = el
      },
      {
        tag: 'section',
        className: classnames(styles.panel, styles.imgsList),
        callback: el => params.imgsListWrapper = el
      },

      {
        tag: 'section',
        className: styles.codePanel,
        callback: el => params.codePanelWrapper = el
      }
    ]
  }
], params.root);

