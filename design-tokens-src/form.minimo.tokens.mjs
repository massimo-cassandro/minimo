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
        'flag-color': {
          $value: '#c00',
          $type: 'color'
        },
        'flag-content': {
          $value: '\'\\002A\'',
          $type: 'string'
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

      // /* TODO importazione automatica SVG (NB problemi con svgo) */
      // /* url('./css/forms/select-indicator.svg?cssInline'); */
      select: {
        'trigger-icon': {
          $value: 'url(\'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20fill%3D%22none%22%20stroke%3D%22rgb(5%2C%2048%2C%2056)%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22m2%205%206%206%206-6%22%2F%3E%3C%2Fsvg%3E\')',
          $type: 'string'
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
