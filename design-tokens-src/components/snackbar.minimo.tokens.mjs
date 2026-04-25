// tokens utitilizzati sia da snackaber che da toast
export default{
  snackbar: {
    outer: {
      'drop-shadow': {
        $type: 'shadow',
        $value: '{box-shadow.base}'
      },
      background: {
        color: {
          $type: 'color',
          $value: '{secondary.100}'
        }
      },
      border: {
        $value: 'none',
        $type: 'string'
      },
      'border-radius': {
        $value: '{radius.xs}',
        $type: 'color'
      },
      padding: {
        block: {
          $type: 'dimension',
          $value: 0
        },
        inline: {
          $type: 'dimension',
          $value: 0
        },
      }
    },

    text: {
      color: {
        $type: 'color',
        $value: '{secondary.100-fg}'
      }
    },
    background: {
      color: {
        $type: 'color',
        $value: '{secondary.100}'
      }
    },
    border: {
      radius: {
        $value: '{radius.xs}',
        $type: 'color'
      }
    },
    font: {
      size: {
        $value: '{font.size.sm}',
        $type: 'dimension'
      },
    },

    'btn-close': {

      size: {
        $value: '1rem',
        $type: 'dimension'
      },
      icon: {
        color: {
          $value: '{snackbar.text.color}',
          $type: 'color'
        }
      },

      hover: {
        background: {
          color: {
            $value: 'color-mix(in srgb, {snackbar.text.color} 40%, transparent)',
            $type: 'color'
          }
        },
        border: {
          color: {
            $value: 'transparent',
            $type: 'color'
          }
        },
        icon: {
          color: {
            $value: '{snackbar.background.color}',
            $type: 'color'
          }
        }
      },

      focus: {
        outline: {
          width: {
            $value: '2px',
            $type: 'dimension'
          },
          offset: {
            $value: '2px',
            $type: 'dimension'
          },
          color: {
            $value: 'color-mix(in srgb, {snackbar.text.color} 50%, transparent)',
            $type: 'color'
          }
        }
      },
      active: {
        background: {
          color: {
            $value: 'transparent',
            $type: 'color'
          }
        },
        icon: {
          color: {
            $value: '{snackbar.text.color}',
            $type: 'color'
          }
        }
      }
    } // end btn-close
  } // end snackbar

};
