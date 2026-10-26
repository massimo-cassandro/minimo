export default {
  form: {

    label: {
      'font' : {
        size: {
          $value: '{font.size.sm}',
          $type: 'dimension'
        },
        weight: {
          $value: '{font.weight.semibold}',
          $type: 'fontWeight'
        }
      },
      color: {
        $value: '{text.color}',
        $type: 'color'
      }
    },
    group: {
      'padding-block': {
        $value: '0 {size.base}',
        $type: 'dimension'
      }
    },
    'input-group': {
      background: {
        color: {
          $value: 'transparent',
          $type: 'color'
        }
      }
    },

    control: {

      static: {
        color: {
          $value: '{form.control.text.color}',
          $type: 'color'
        },
        background: {
          color: {
            $value: 'transparent',
            $type: 'color'
          }
        }
      },

      text: {
        color: {
          $value: '{text.color}',
          $type: 'color'
        }
      },
      font: {
        style: {
          $value: 'normal',
          $type: 'string'
        },
        weight: {
          $value: '{font.weight.regular}',
          $type: 'fontWeight'
        },
        size: {
          $value: '{font.size.base}',
          $type: 'dimension'
        }
      },

      background: {
        color: {
          $value: '{body.background.color}',
          $type: 'color'
        }
      },
      'line-height': {
        $value: '1.2',
        $type: 'number'
      },

      padding: {
        inline: {
          $value: '{size.sm}',
          $type: 'dimension'
        },
        block: {
          $value: '{size.xs}',
          $type: 'dimension'
        }
      },

      border: {
        color: {
          $value: '#666',
          $type: 'color'
        },
        width: {
          $value: '1px',
          $type: 'dimension'
        },
        style: {
          $value: 'solid',
          $type: 'string'
        },
        radius: {
          $value: '{radius.xxs}',
          $type: 'dimension'
        }
      },


      placeholder: {
        color: {
          $value: '#666',
          $type: 'color'
        },
        opacity: {
          $value: 0.8,
          $type: 'number'
        },
        font: {
          size: {
            $value: '{form.control.font.size}',
            $type: 'dimension'
          },
          style: {
            $value: 'italic',
            $type: 'string'
          }
        }
      },

      disabled: {
        background: {
          color: {
            $value: '#ddd',
            $type: 'color'
          }
        },
        color: {
          $value: '#999',
          $type: 'color'
        },
        opacity: {
          $value: .7,
          $type: 'number'
        },
        font: {
          style: {
            $value: 'italic',
            $type: 'string'
          }
        }
      },
      readonly: {
        background: {
          color: {
            $value: '{form.control.background.color}',
            $type: 'color'
          }
        },
        color: {
          $value: '#666',
          $type: 'color'
        },
        opacity: {
          $value: 1,
          $type: 'number'
        },
        font: {
          style: {
            $value: 'italic',
            $type: 'string'
          }
        }
      },
      required: {
        label: {
          padding: {
            inline: {
              start: {
                $type: 'dimension',
                $value: '{size.base}',
              }
            }
          },
        },
        flag: {
          color: {
            $type: 'color',
            $value: '#c00',
          },
          content: {
            $type: 'string',
            $value: '\'\\002A\'',
          },
          top: {
            $type: 'dimension',
            $value: '-.15em',
          },
          left: {
            $type: 'dimension',
            $value: '0em',
          },
          font: {
            size: {
              $type: 'dimension',
              $value: '2em',
            }
          }
        }
      },
      focus: {
        color: {
          $value: 'hsl(205 69% 45% / .508)',
          $type: 'color'
        },
        outline: {
          width: {
            $value: '4px',
            $type: 'dimension'
          },
          offset: {
            $value: '-2px',
            $type: 'dimension'
          }
        }
      },

      xs: {
        font: {
          size: {
            $value: '{font.size.xs}',
            $type: 'dimension'
          }
        },
        padding: {
          inline: {
            $value: '{size.xxs}',
            $type: 'dimension'
          },
          block: {
            $value: '{size.xxs}',
            $type: 'dimension'
          }
        }
      },
      sm: {
        font: {
          size: {
            $value: '{font.size.sm}',
            $type: 'dimension'
          }
        },
        padding: {
          inline: {
            $value: '{size.xs}',
            $type: 'dimension'
          },
          block: {
            $value: '{size.xxs}',
            $type: 'dimension'
          }
        }
      },
      md: {
        font: {
          size: {
            $value: '{font.size.md}',
            $type: 'dimension'
          }
        },
        padding: {
          inline: {
            $value: '{size.sm}',
            $type: 'dimension'
          },
          block: {
            $value: '{size.xs}',
            $type: 'dimension'
          }
        }
      },
      lg: {
        font: {
          size: {
            $value: '{font.size.lg}',
            $type: 'dimension'
          }
        },
        padding: {
          inline: {
            $value: '{size.md}',
            $type: 'dimension'
          },
          block: {
            $value: '{size.base}',
            $type: 'dimension'
          }
        }
      },
      xl: {
        font: {
          size: {
            $value: '{font.size.xl}',
            $type: 'dimension'
          }
        },
        padding: {
          inline: {
            $value: '{size.xl}',
            $type: 'dimension'
          },
          block: {
            $value: '{size.md}',
            $type: 'dimension'
          }
        }
      },

      /*
        Icona del select: data URI di `src/icons/caret-down-bold.svg`.
        Per la dark mode basta ridefinire il token nei token dark con un SVG di colore adatto
        (vedi form.minimo.tokens-dark.mjs, che usa `src/icons/caret-down-bold-negative.svg`):
        il builder lo scrive in `@media (prefers-color-scheme: dark)`, non in light-dark(),
        che accetta solo colori.
        Limite noto: la regola segue la preferenza del sistema, non il `color-scheme`
        del singolo elemento.
      */
      select: {
        'trigger-icon': {
          $value: 'url(\'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22%23000000%22%20viewBox%3D%220%200%20256%20256%22%3E%3Cpath%20d%3D%22M216.49%2C104.49l-80%2C80a12%2C12%2C0%2C0%2C1-17%2C0l-80-80a12%2C12%2C0%2C0%2C1%2C17-17L128%2C159l71.51-71.52a12%2C12%2C0%2C0%2C1%2C17%2C17Z%22%2F%3E%3C%2Fsvg%3E\')',
          $type: 'string',
          $description: 'src/icons/caret-down-bold.svg'
        }
      }
    },

    fieldset: {
      border: {
        width: {
          $value: '1px',
          $type: 'dimension'
        }
      },
    },
    legend: {
      background: {
        color: {
          $value: 'transparent',
          $type: 'color'
        }
      },
      color: {
        $value: '{text.color}',
        $type: 'color'
      }
    },

    // blocco info finali form
    end: {
      margin: {
        block: {
          start: {
            $value: '{size.base}',
            $type: 'dimension'
          },
          end: {
            $value: '{size.base}',
            $type: 'dimension'
          }
        }
      }
    },
    'user-info': {
      font: {
        size: {
          $value: '{font.size.xs}',
          $type: 'dimension'
        }
      },
      color: {
        $value: '{text.muted}',
        $type: 'color'
      }
    }
  }
};
