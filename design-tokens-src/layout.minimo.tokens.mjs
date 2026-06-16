export default {

  // TODO unificare questo valore con quelli in custom-media
  layout: {
    container: {
      'max-width': {
        $type: 'dimension',
        $value: '80rem'
      }
    }
  },

  body: {
    background: {
      color: {
        $type: 'color',
        $value: '#fff'
      }
    },
    text: {
      $type: 'color',
      $value: '{text.color}'
    }
  },
};
