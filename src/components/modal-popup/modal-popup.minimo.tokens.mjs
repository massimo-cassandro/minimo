export default {
  'mpopup': {

    width: {
      $type: 'dimension',
      $value: 'max-content',
    },
    'min-width': {
      $type: 'dimension',
      $value: '400px',
    },
    'max-width': {
      $type: 'dimension',
      $value: '98dvw',
    },
    height: {
      $type: 'dimension',
      $value: 'max-content',
    },
    'min-height': {
      $type: 'dimension',
      $value: '300px',
    },
    'max-height': {
      $type: 'dimension',
      $value: '90dvh',
    },

    background: {
      color: {
        $type: 'color',
        $value: '{body.background.color}',
      }
    },

    'drop-shadow': {
      $type: 'shadow',
      $value: [
        {
          offsetX: '0',
          offsetY: '0',
          blur: '12px',
          spread: '2px',
          color: 'rgb(0 0 0 / .25)'
        }
      ]
    },
    'backdrop-color': {
      $value: 'rgb(0 0 0 / .6)',
      $type: 'color',
    },
    border: {
      radius: {
        $type: 'dimension',
        $value: '{size.base}',
      }
    },

    'btn-close': {
      size: {
        $type: 'dimension',
        $value: '1.6rem'
      }

    },
    content: {
      padding: {
        $type: 'dimension',
        $value: '{size.base} {size.sm} {size.sm}',
      },
      scrollbar: {
        padding: {
          i: {
            end: {
              $type: 'dimension',
              $value: '{size.md}',
            }
          }
        }
      }
    },
    header: {
      padding: {
        $type: 'dimension',
        $value: '{size.xs}',
      },
      color: {
        $type: 'color',
        $value: '{text.color}'
      },
      background: {
        color: {
          $type: 'color',
          $value: '#ddd'
        }
      },
      font: {
        size: {
          $type: 'dimension',
          $value: '{font.size.xl}'
        }
      }
    },
    footer: {
      padding: {
        $type: 'dimension',
        $value: '{size.xs}',
      },
      color: {
        $type: 'color',
        $value: '{text.color}'
      },
      background: {
        color: {
          $type: 'color',
          $value: '#ddd'
        }
      },
      font: {
        size: {
          $type: 'dimension',
          $value: '{font.size.base}'
        }
      }
    }
  }
};
