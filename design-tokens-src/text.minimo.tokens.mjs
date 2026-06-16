export default {
  accent: {
    color: {
      $value: '{accent.100}',
      $type: 'color'
    }
  },
  text: {
    muted: {
      $type: 'color',
      $value: '{neutral.100}'
    },
    dim: {
      $type: 'color',
      $value: '{text.muted}'
    },
    negative: {
      $type: 'color',
      $value: '#ffffff'
    },
    color: {
      $type: 'color',
      $value: '#000'
    },
    selected: {
      background: {
        color: {
          $type: 'color',
          $value: '#ddd'
        }
      },
      color: {
        $type: 'color',
        $value: '{body.text}'
      }
    }
  }
};
