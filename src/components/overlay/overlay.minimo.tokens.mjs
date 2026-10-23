export default {
  overlay: {
    color: {
      $type: 'color',
      $value: 'color-mix(in srgb, {text.color} 20%, transparent)'
    },
    'z-index': {
      $type: 'number',
      $value: '{z-index.overlay}'
    }
  }
};
