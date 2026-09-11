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
    }
  }
};
