export default {
  jt: {
    wrapper: {
      margin: {
        block: {
          $type: 'dimension',
          $value: '{size.md}'
        }
      }
    },

    info: {
      gap: {
        $type: 'dimension',
        $value: '{size.sm}'
      },
      font: {
        size: {
          $type: 'dimension',
          $value: '{font.size.sm}'
        }
      },
      color: {
        $type: 'color',
        $value: '{text.color}'
      },
      outer: {
        padding: {
          block: {
            end: {
              $type: 'dimension',
              $value: '{size.xs}'
            }
          }
        }
      }
    },

    search: {
      max: {
        width: {
          $type: 'dimension',
          $value: '20rem'
        }
      }
    },

    // colonne ordinabili (thead)
    thead: {
      hover: {
        background: {
          color: {
            $type: 'color',
            $value: 'color-mix(in srgb, {table.thead.background.color} 90%, {accent})'
          }
        }
      }
    },

    sort: {
      // il pulsante di ordinamento riempie l'intero th: stesso padding/line-height delle celle tabella di minimo
      btn: {
        padding: {
          block: {
            $type: 'dimension',
            $value: '{table.cell.padding.block}'
          },
          inline: {
            $type: 'dimension',
            $value: '{table.cell.padding.inline}'
          }
        },
        'line-height': {
          $type: 'number',
          $value: '{table.cell.line-height}'
        }
      },
      icon: {
        size: {
          $type: 'dimension',
          $value: '1em'
        },
        gap: {
          $type: 'dimension',
          $value: '.4em'
        },
        // opacità dell'icona quando non c'è alcun ordinamento attivo
        none: {
          opacity: {
            $type: 'number',
            $value: '.4'
          }
        }
      }
    },

    // celle booleane
    bool: {
      icon: {
        size: {
          $type: 'dimension',
          $value: '1.1em'
        }
      },
      true: {
        color: {
          $type: 'color',
          $value: '{status.success.color}'
        }
      },
      false: {
        color: {
          $type: 'color',
          $value: '{status.danger.color}'
        }
      }
    },

    // opacità della tabella mentre è in corso una richiesta server-side
    busy: {
      opacity: {
        $type: 'number',
        $value: '.5'
      }
    },

    // barra del footer sotto la tabella (caption + paginazione)
    'table-footer': {
      padding: {
        block: {
          start: {
            $type: 'dimension',
            $value: '{size.xs}'
          }
        }
      }
    },

    caption: {
      font: {
        size: {
          $type: 'dimension',
          $value: '{font.size.sm}'
        }
      },
      color: {
        $type: 'color',
        $value: '{text.muted}'
      }
    },

    pagination: {
      border: {
        width: {
          $type: 'dimension',
          $value: '1px'
        },
        color: {
          $type: 'color',
          $value: '{table.border.color}'
        }
      },
      radius: {
        $type: 'dimension',
        $value: '{radius.xxs}'
      },
      font: {
        size: {
          $type: 'dimension',
          $value: '{font.size.sm}'
        }
      },
      'line-height': {
        $type: 'number',
        $value: '{table.cell.line-height}'
      },
      btn: {
        'min-width': {
          $type: 'dimension',
          $value: '2.2em'
        },
        padding: {
          block: {
            $type: 'dimension',
            $value: '{table.cell.padding.block}'
          },
          inline: {
            $type: 'dimension',
            $value: '{table.cell.padding.inline}'
          }
        }
      },
      icon: {
        size: {
          $type: 'dimension',
          $value: '1em'
        }
      },
      current: {
        background: {
          color: {
            $type: 'color',
            $value: '{table.thead.background.color}'
          }
        },
        font: {
          weight: {
            $type: 'fontWeight',
            $value: '{font.weight.semibold}'
          }
        }
      },
      hover: {
        background: {
          color: {
            $type: 'color',
            $value: '{table.body.tr.hover-bg-color}'
          }
        }
      },
      disabled: {
        opacity: {
          $type: 'number',
          $value: '.5'
        }
      }
    },

    // "no rows" cell
    empty: {
      color: {
        $type: 'color',
        $value: '{text.muted}'
      },
      padding: {
        block: {
          $type: 'dimension',
          $value: '{size.sm}'
        }
      }
    }
  }
};
