// TODO aggiungere neutral e accent

const makeBtnObj = theme => {

  return {
    background: {
      color: {
        $value: `{${theme}.100}`,
        $type: 'color'
      }
    },
    color: {
      $value: `{${theme}.100-fg}`,
      $type: 'color'
    },

    border: {
      color: {
        $value: `{btn.${theme}.background.color}`,
        $type: 'color'
      }
    },

    focus: {
      outline: {
        color: {
          $value: `color-mix(in srgb, {btn.${theme}.background.color} 60%, transparent)`,
          $type: 'color'
        }
      }
    },

    hover: {
      background: {
        color: {
          $value: `{btn.${theme}.color}`,
          $type: 'color'
        }
      },
      color: {
        $value: `{btn.${theme}.background.color}`,
        $type: 'color'
      },

      border: {
        color: {
          $value: `{btn.${theme}.hover.color}`,
          $type: 'color'
        }
      }
    },

    active: {
      background: {
        color: {
          $value: `color-mix(in srgb, {btn.${theme}.background.color} 60%, #000)`,
          $type: 'color'
        }
      },
      color: {
        $value: `{btn.${theme}.color}`,
        $type: 'color'
      },

      border: {
        color: {
          $value: `{btn.${theme}.active.background.color}`,
          $type: 'color'
        }
      },
    },

    hollow: {
      background: {
        color: {
          $value: `{btn.${theme}.color}`,
          $type: 'color'
        }
      },
      color: {
        $value: `{btn.${theme}.background.color}`,
        $type: 'color'
      },

      hover: {
        background: {
          color: {
            $value: `{btn.${theme}.background.color}`,
            $type: 'color'
          }
        },
        color: {
          $value: `{btn.${theme}.color}`,
          $type: 'color'
        }

      },

    } // end hollow
  };
};

const btns = {};

['primary', 'secondary']
  .forEach(theme => btns[theme] = makeBtnObj(theme));

export default {btn: btns};
