export default {
  'malert': {
    background: {
      color: {
        $type: 'color',
        $value: '#fff'
      }
    },
    border: {
      radius: {
        $type: 'dimension',
        $value: '{radius.xs}'
      },
    },
    'box-shadow-color': {
      $type: 'color',
      $value: '#000'
    },
    // https://www.joshwcomeau.com/shadow-palette/
    'box-shadow': {
      $type: 'shadow',
      $value: [
        {
          offsetX: '0',
          offsetY: '.4px',
          blur: '4px',
          spread: '0',
          color: 'color-mix(in srgb, {malert.box-shadow-color} 15%, transparent)'
        },
        {
          offsetX: '-.3px',
          offsetY: '3px',
          blur: '3.3px',
          spread: '-.5px',
          color: 'color-mix(in srgb, {malert.box-shadow-color} 15%, transparent)'
        },
        {
          offsetX: '-.5px',
          offsetY: '6.1px',
          blur: '6.6px',
          spread: '-.9px',
          color: 'color-mix(in srgb, {malert.box-shadow-color} 14%, transparent)'
        },
        {
          offsetX: '-.9px',
          offsetY: '11.2px',
          blur: '12.1px',
          spread: '-1.4px',
          color: 'color-mix(in srgb, {malert.box-shadow-color} 14%, transparent)'
        },
        {
          offsetX: '-1.6px',
          offsetY: '19.5px',
          blur: '21.1px',
          spread: '-1.9px',
          color: 'color-mix(in srgb, {malert.box-shadow-color} 13%, transparent)'
        },
        {
          offsetX: '-2.7px',
          offsetY: '32.7px',
          blur: '35.4px',
          spread: '-2.3px',
          color: 'color-mix(in srgb, {malert.box-shadow-color} 13%, transparent)'
        },
        {
          offsetX: '-4.3px',
          offsetY: '52px',
          blur: '56.4px',
          spread: '-2.8px',
          color: 'color-mix(in srgb, {malert.box-shadow-color} 12%, transparent)'
        }
      ]
    },
    backdrop: {
      $type: 'color',
      $value: 'rgb(0 0 0 / .7)'
    },

    success: {
      bg: {
        $type: 'color',
        $value: '{status.success.background.color}'
      },
      fg: {
        $type: 'color',
        $value: '{status.success.fg}'
      }
    },
    info: {
      bg: {
        $type: 'color',
        $value: '{status.info.background.color}'
      },
      fg: {
        $type: 'color',
        $value: '{status.info.fg}'
      }
    },
    warning: {
      bg: {
        $type: 'color',
        $value: '{status.warning.background.color}'
      },
      fg: {
        $type: 'color',
        $value: '{status.warning.fg}'
      }
    },
    error: {
      bg: {
        $type: 'color',
        $value: '{status.danger.background.color}'
      },
      fg: {
        $type: 'color',
        $value: '{status.danger.fg}'
      }
    },

    confirm: {
      bg: {
        $type: 'color',
        $value: 'hsl(277deg 72% 45%)'
      },
      fg: {
        $type: 'color',
        $value: '#fff'
      },

      // =>> settings for confirm button
      btn: {
        bg: {
          $value: '{malert.confirm.bg}',
          $type: 'color'
        },
        fg: {
          $value: '{malert.confirm.fg}',
          $type: 'color'
        },

        border: {
          color: {
            $value: '{malert.confirm.bg}',
            $type: 'color'
          }
        },

        focus: {
          outline: {
            color: {
              $value: 'color-mix(in srgb, {malert.confirm.bg} 60%, transparent)',
              $type: 'color'
            },
            width: {
              $type: 'dimension',
              $value: '{btn.focus.outline.width}'
            }
          }
        },

        hover: {
          bg: {
            $value: '{malert.confirm.fg}',
            $type: 'color'
          },
          fg: {
            $value: '{malert.confirm.bg}',
            $type: 'color'
          },

          border: {
            color: {
              $value: '{malert.confirm.btn.hover.fg}',
              $type: 'color'
            }
          }
        },

        active: {
          bg: {
            $value: 'color-mix(in srgb, {malert.confirm.bg} 60%, #000)',
            $type: 'color'
          },
          fg: {
            $value: '{malert.confirm.fg}',
            $type: 'color'
          },

          border: {
            color: {
              $value: '{malert.confirm.btn.active.bg}',
              $type: 'color'
            }
          },
        },

        hollow: {
          bg: {
            $value: '{malert.confirm.fg}',
            $type: 'color'
          },
          fg: {
            $value: '{malert.confirm.bg}',
            $type: 'color'
          },

          hover: {
            bg: {
              $value: '{malert.confirm.bg}',
              $type: 'color'
            },
            fg: {
              $value: '{malert.confirm.fg}',
              $type: 'color'
            }

          },
        } // end hollow
      } // end confirm button

    },

    heading: {
      font: {
        family: {
          $type: 'fontFamily',
          $value: '{headings.font.family}'
        },
        size: {
          $type: 'dimension',
          $value: '{headings.h2.font.size}'
        },
        weight: {
          $type: 'dimension',
          $value: '{headings.font.weight}'
        },
      },
      'line-height': {
        $type: 'dimension',
        $value: '{headings.line-height}'
      }
    },
    text: {
      font: {
        family: {
          $type: 'fontFamily',
          $value: '{font.family}'
        },
        size: {
          $type: 'dimension',
          $value: '{font.size.base}'
        },
      }
    },
  }
};

