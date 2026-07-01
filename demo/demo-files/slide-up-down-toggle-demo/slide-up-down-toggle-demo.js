import { domBuilder } from '@src/utilities/dom-builder/dom-builder.js';
import { slideToggle, slideUp, slideDown } from '@src/components/slide-up-down-toggle/slide-up-down-toggle.js';
import * as styles from './slide-up-down-toggle-demo.module.css';

export function slideUpDownToggleDemo(){
  const root = document.getElementById('root')
    ,content = 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. At veritatis accusamus id tenetur, quasi, placeat itaque, rem error minus quis aspernatur nemo molestiae. Non, cum amet enim molestias fugit maiores laudantium id dolore. Quo et pariatur quas, aliquid qui modi ipsa quam dolorem consequuntur, nulla rem, obcaecati repellat ipsum ratione?'
  ;

  let target1, target2, target3;
  domBuilder([
    'h2 wrap: true',
    {
      attrs: {
        class: styles.slide
      },
      content: content,
      callback: el => {
        target1 = el;
      }
    },
    {
      className: styles.btnsWrapper,
      children: [
        ...['slide-up', 'slide-down', 'slide-toggle'].map(btn_text => {

          return {
            tag: 'button',
            attrs: {
              type: 'button',
              class: 'btn btn-primary'
            },
            content: btn_text,
            callback: el => {
              let handler;
              switch (btn_text) {
                case 'slide-up':
                  handler = slideUp;
                  break;

                case 'slide-down':
                  handler = slideDown;
                  break;

                default:
                  handler = slideToggle;
              }

              el.addEventListener('click', () => {

                handler(target1);
              });
            }
          };
        }),
      ]
    },

    'h2 wrap: false (container musta not have padding)',
    {
      // outer container without padding and with display: block
      callback: el => {
        target2 = el;
      },
      children: [
        // inner container with any styling
        {
          attrs: {
            class: styles.slide
          },
          content: content,
        }
      ]
    },
    {
      tag: 'button',
      attrs: {
        type: 'button',
        class: 'btn btn-primary'
      },
      content: 'toggle',
      callback: el => {

        el.addEventListener('click', () => {

          slideToggle(target2, {wrap: false});
        });
      }
    },


    'h2 Starting with display none (wrap: false)',
    {
      // outer container without padding and with display: block
      callback: el => {
        target3 = el;
      },
      attrs: {
        style: 'display:none'
      },
      children: [
        // inner container with any styling
        {
          attrs: {
            class: styles.slide
          },
          content: content,
        }
      ]
    },
    {
      tag: 'button',
      attrs: {
        type: 'button',
        class: 'btn btn-primary'
      },
      content: 'toggle',
      callback: el => {

        el.addEventListener('click', () => {

          slideToggle(target3, {wrap: false});
        });
      }
    },

  ], root);
}
