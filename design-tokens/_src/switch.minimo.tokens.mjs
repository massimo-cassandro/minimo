export default {
  switch: {
    width: {
      $value: '2.25em',
      $type: 'dimension'
    },

    height: {
      $value: '1.25em',
      $type: 'dimension'
    },

    thumb: {
      inset: {
        $value: '.125em',
        $type: 'dimension'
      },
    },

    transition: {
      duration: {
        $value: '.2s',
        $type: 'duration'
      },
    },

    background: {
      color: {
        $value: '{neutral.100}',
        $type: 'color'
      }
    },

    cursor: {
      background: {
        color: {
          $value: '{body.background.color}',
          $type: 'color'
        }
      },
    },

    checked: {
      background: {
        color: {
          $value: '{primary.100}',
          $type: 'color'
        }
      },
    }

  }
};
