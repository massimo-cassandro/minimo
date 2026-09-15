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
        $value: '{text.muted}'
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

    // sortable columns (thead)
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
      // the sort button fills the whole th: same padding/line-height of minimo table cells
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
        // opacity of the icon when no sort is active
        none: {
          opacity: {
            $type: 'number',
            $value: '.4'
          }
        }
      }
    },

    // boolean cells
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

    // opacity of the table while a server-side request is in progress
    busy: {
      opacity: {
        $type: 'number',
        $value: '.5'
      }
    },

    // footer bar below the table (caption + pagination)
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
