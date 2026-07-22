

export default {
  'sf-macro': {

    rows: {
      padding: {
        $value: '{size.xs}',
        $type: 'dimension'
      },
      margin: {
        block: {
          end: {
            $value: '{size.base}',
            $type: 'dimension'
          }
        }
      },
      hover: {
        background: {
          color: {
            $value: 'color-mix(in srgb, {body.background.color} 95%, #000)',
            $type: 'color'

          }
        }
      },
      even: {
        background: {
          color: {
            $value: '{body.background.color}',
            $type: 'color'
          }
        }
      },
      border: {
        $type: 'border',
        $value: {
          color: '{neutral.100}',
          width: '1px',
          style: 'solid'
        }
      },
      'border-radius': {
        $value: '{radius.xs}',
        $type: 'dimension'
      }
    }, // end rows

    btn: {
      close: {
        size: {
          $value: '{btn.close.size}',
          $type: 'dimension'
        },
        background: {
          color: {
            $value: '{btn.close.background.color}',
            $type: 'color'
          }
        },
        position: {
          top: {
            $type: 'dimension',
            $value: '-0.5rem'
          },
          right: {
            $type: 'dimension',
            $value: '-0.5rem'
          },
          bottom:{
            $type: 'dimension',
            $value: 'auto'
          },
          left: {
            $type: 'dimension',
            $value: 'auto'
          },
        }
      }
    }, // end btn

  } // end sf-macro
};
