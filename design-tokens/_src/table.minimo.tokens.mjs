export default {
  table: {
    thead: {
      background: {
        color: {
          $type: 'color',
          $value: '#ddd'
        }
      },
      border: {
        width : {
          $type: 'dimension',
          $value: '3px'
        }
      },
      'vertical-align': {
        $type: 'string',
        $value: 'middle',
      },
    },
    tfoot: {
      background: {
        color: {
          $type: 'color',
          $value: '{table.thead.background.color}'
        }
      },
      border: {
        width : {
          $type: 'dimension',
          $value: '{table.thead.border.width}'
        }
      },
      font: {
        weight: {
          $type: 'fontWeight',
          $value: '{font.weight.semibold}',
        }
      },
      'vertical-align': {
        $type: 'string',
        $value: 'middle',

      }
    },

    tbody: {
      background: {
        color: null
      },
      border: {
        'width' : {
          $type: 'dimension',
          $value: '1px'
        }
      },
      'vertical-align': {
        $type: 'string',
        $value: 'middle',

      },
      tr: {
        'alt-bg-color': {
          $type: 'color',
          $value: '#efefef'
        },
        'hover-bg-color': {
          $type: 'color',
          $value: '#cbcbcb'
        }
      }
    },

    border: {
      'color' : {
        $type: 'color',
        $value: '#333'
      }
    },

    cell: {
      'padding' : {
        block: {
          $type: 'dimension',
          $value: '.3rem'
        },
        inline: {
          $type: 'dimension',
          $value: '.6rem'
        }
      },
      'line-height': {
        $type: 'number',
        $value: '1.3'
      }
    }


  }
};
