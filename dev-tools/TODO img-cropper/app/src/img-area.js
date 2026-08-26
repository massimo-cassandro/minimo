// import Cropper from 'cropperjs'; // TODO importare solo alcuni moduli??
import { params } from './params.js';
import { domBuilder } from '@massimo-cassandro/minimo';
import imageDropIcon from '@icons/image-drop.svg?inline';


import * as styles from './img-area.module.css';

export function imgAreaInit(){

  params.imgArea.classList.add(styles.imgAreaWrapper);

  domBuilder([
    {
      className: styles.dropAreaBackground,
      content: imageDropIcon,
      // callback: el => params.dropAreaBackground = el
    }

  ], params.imgArea);
}
