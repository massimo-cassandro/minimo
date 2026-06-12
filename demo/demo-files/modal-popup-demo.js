import { domBuilder } from '@src/utilities/dom-builder/dom-builder.js';
import { modalPopup } from '@src/components/modal-popup/modal-popup.js';

export function modalPopupDemo(){
  const root = document.getElementById('root');

  domBuilder([
    {
      tag: 'button',
      attrs: {
        type: 'button',
        class: 'btn btn-primary'
      },
      content: 'Open Modal-popup (dom-builder)',
      callback: el => {
        el.addEventListener('click', () => {
          modalPopup({
            content: [
              {
                tag: 'h2',
                className: 'title',
                content: 'Modal-popup demo'
              },
              {
                tag: 'p',
                content: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae eum ducimus accusamus minima qui, aliquid quo voluptates soluta, molestias amet repudiandae mollitia! Corporis nulla quo voluptates aut ut fuga? Est laborum ipsa consectetur fuga laboriosam, pariatur perferendis. Nesciunt dolorem consectetur, tenetur animi facere, perferendis recusandae corrupti pariatur earum accusamus eveniet.'
              }
            ],
            dialogExtraClassName: 'dialogExtraClassName',
            contentExtraClassName: 'contentExtraClassName',
            headerContent: 'Header text',
            footerContent: 'Footer text',
          });
        });
      }
    }
  ], root);
}
