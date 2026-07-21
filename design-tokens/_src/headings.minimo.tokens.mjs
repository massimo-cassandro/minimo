export default {
  headings: {
    text: {
      align: {
        $type: 'string',
        $value: 'inherit'
      }
    },
    color: {
      $type: 'color',
      $value: '{text.color}'
    },
    font: {
      family: {
        $type: 'fontFamily',
        $value: '{font.family}'
      },
      weight: {
        $type: 'string',
        $value: '{font.weight.semibold}'
      }
    },
    'line-height': {
      $type: 'dimension',
      $value: '{line-height.xs}'
    },
    h1: {
      font: {
        weight: {
          $type: 'string',
          $value: '{headings.font.weight}'
        },
        size: {
          $type: 'dimension',
          $value: '{font.size.2xl}'
        }
      }
    },
    h2: {
      font: {
        size: {
          $type: 'dimension',
          $value: '{font.size.xl}'
        }
      }
    },
    h3: {
      font: {
        size: {
          $type: 'dimension',
          $value: '{font.size.lg}'
        }
      }
    },
    h4: {
      font: {
        size: {
          $type: 'dimension',
          $value: '{font.size.md}'
        }
      }
    },
  }
};
