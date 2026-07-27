export default {
  'uspg': {
    bg: {
      color: {
        $type: 'color',
        $value: 'hsl(0deg 0% 0% / .7)'
      }
    },
    text: {
      color: {
        $type: 'color',
        $value: '#fff'

      }
    },
    'line-height': {
      $type: 'number',
      $value: '{line-height.sm}'
    },
    font: {
      family: {
        $type: 'fontFamily',
        $value: '{font.family}'
      },
      size: {
        $type: 'dimension',
        $value: '{font.size.base}'

      },
      weight: {
        $type: 'fontWeight',
        $value: '{font.weight.regular}'
      },
      'variation-settings': {
        $type: 'string',
        $value: 'unset'
      }
    }, // end base setup

    // title
    h1: {
      color: {
        $type: 'color',
        $value: '{uspg.text.color}'
      },
      font: {
        size: {
          $type: 'dimension',
          $value: '{font.size.xl}'
        },
        weight: {
          $type: 'fontWeight',
          $value: '{font.weight.bold}'
        },
        'variation-settings': {
          $type: 'string',
          $value: 'unset'
        }
      },
      'line-height': {
        $type: 'number',
        $value: '{line-height.xs}'
      },
    }, // end h1


    // links
    link: {
      color: {
        $type: 'color',
        $value: '#fc0'
      },
      decoration: {
        $type: 'string',
        $value: 'none'
      },
      visited: {
        color: {
          $type: 'color',
          $value: '#C711FF'
        }
      },
      hover: {
        color: {
          $type: 'color',
          $value: '{uspg.bg.color}'
        },
        background: {
          color: {
            $type: 'color',
            $value: 'transparent'
          }
        },
        decoration: {
          $type: 'string',
          $value: 'underline'
        },
      },
      active: {
        color: {
          $type: 'color',
          $value: '#F49C29'
        }
      },
      focus: {
        outline: {
          width: {
            $value: '2px',
            $type: 'dimension'
          },
          style: {
            $value: 'solid',
            $type: 'string'
          },
          color: {
            $value: '{uspg.link.color}',
            $type: 'color'
          },
          offset: {
            $value: '2px',
            $type: 'dimension'
          },
        }
      }

    },

    // credit box
    credits: {
      font: {
        size: {
          $type: 'dimension',
          $value: '{font.size.xs}'
        },
        weight: {
          $type: 'fontWeight',
          $value: '{font.weight.regular}'
        },
      },
      'line-height': {
        $type: 'number',
        $value: '{line-height.xs}'
      },
    }, // end credits


    // icons
    icon: {
      box: {
        bg: {
          $type: 'color',
          $value: '{uspg.link.color}'
        }
      },
      fill: {
        color: {
          $type: 'color',
          $value: '#333'
        }
      },
      hover: {
        box: {
          bg: {
            $type: 'color',
            $value: '#fff'
          }
        },
      }
    }, // end icons

    // loader
    loader: {
      color: {
        $type: 'color',
        $value: 'hsl(0deg 0% 100% / .6)'
      }
    } // end loader

  } // end up
};
