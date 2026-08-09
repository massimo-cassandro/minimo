export default {
  font: {
    family: {
      $type: 'fontFamily',
      $value: 'sans-serif',
    },
    'family-mono': {
      $value: '\'Monaspace Neon Var\', \'Monaspace Neon\', \'Aptos Mono\', \'Roboto Mono\', \'SFMono-Regular\', \'Menlo\', \'Monaco\', \'Consolas\', \'Liberation Mono\', \'Andale Mono\', \'Courier New\', monospace',
      $type: 'fontFamily'
    },

    size: {
      base: {
        $value: 'clamp(.9rem, .6538rem + .3846vw, 1rem)',
        $type: 'string',
        $description: '64 to 90 rem: https://clamp.font-size.app/?config=eyJyb290IjoiMTYiLCJtaW5XaWR0aCI6IjY0cmVtIiwibWF4V2lkdGgiOiI5MHJlbSIsIm1pbkZvbnRTaXplIjoiLjlyZW0iLCJtYXhGb250U2l6ZSI6IjFyZW0ifQ%3D%3D'
      },
      xxs: {
        $value: 'clamp(.6rem, .3538rem + .3846vw, .7rem)',
        $type: 'string',
        $description: '64-90rem: https://clamp.font-size.app/?config=eyJyb290IjoiMTYiLCJtaW5XaWR0aCI6IjY0cmVtIiwibWF4V2lkdGgiOiI5MHJlbSIsIm1pbkZvbnRTaXplIjoiLjZyZW0iLCJtYXhGb250U2l6ZSI6Ii43cmVtIn0%3D'
      },
      xs: {
        $value: 'clamp(.7rem, .4538rem + .3846vw, .8rem)',
        $type: 'string',
        $description: '64-90rem: https://clamp.font-size.app/?config=eyJyb290IjoiMTYiLCJtaW5XaWR0aCI6IjY0cmVtIiwibWF4V2lkdGgiOiI5MHJlbSIsIm1pbkZvbnRTaXplIjoiLjdyZW0iLCJtYXhGb250U2l6ZSI6Ii44cmVtIn0%3D'
      },
      sm: {
        $value: 'clamp(.8rem, .5538rem + .3846vw, .9rem)',
        $type: 'string',
        $description: '64-90rem: https://clamp.font-size.app/?config=eyJyb290IjoiMTYiLCJtaW5XaWR0aCI6IjY0cmVtIiwibWF4V2lkdGgiOiI5MHJlbSIsIm1pbkZvbnRTaXplIjoiLjhyZW0iLCJtYXhGb250U2l6ZSI6Ii45cmVtIn0%3D'
      },

      md: {
        $value: 'clamp(1.05rem, .6808rem + .5769vw, 1.2rem)',
        $type: 'string',
        $description: '64-90rem: https://clamp.font-size.app/?config=eyJyb290IjoiMTYiLCJtaW5XaWR0aCI6IjY0cmVtIiwibWF4V2lkdGgiOiI5MHJlbSIsIm1pbkZvbnRTaXplIjoiMS4wNXJlbSIsIm1heEZvbnRTaXplIjoiMS4ycmVtIn0%3D'
      },
      lg: {
        $value: 'clamp(1.2rem, .7077rem + .7692vw, 1.4rem)',
        $type: 'string',
        $description: '64-90rem: https://clamp.font-size.app/?config=eyJyb290IjoiMTYiLCJtaW5XaWR0aCI6IjY0cmVtIiwibWF4V2lkdGgiOiI5MHJlbSIsIm1pbkZvbnRTaXplIjoiMS4ycmVtIiwibWF4Rm9udFNpemUiOiIxLjRyZW0ifQ%3D%3D'
      },
      xl: {
        $value: 'clamp(1.6rem, 1.1077rem + .7692vw, 1.8rem)',
        $type: 'string',
        $description: '64-90rem: https://clamp.font-size.app/?config=eyJyb290IjoiMTYiLCJtaW5XaWR0aCI6IjY0cmVtIiwibWF4V2lkdGgiOiI5MHJlbSIsIm1pbkZvbnRTaXplIjoiMS42cmVtIiwibWF4Rm9udFNpemUiOiIxLjhyZW0ifQ%3D%3D'
      },
      '2xl': {
        $value: 'clamp(2rem, .7692rem + 1.9231vw, 2.5rem)',
        $type: 'string',
        $description: '64-90rem: https://clamp.font-size.app/?config=eyJyb290IjoiMTYiLCJtaW5XaWR0aCI6IjY0cmVtIiwibWF4V2lkdGgiOiI5MHJlbSIsIm1pbkZvbnRTaXplIjoiMnJlbSIsIm1heEZvbnRTaXplIjoiMi41cmVtIn0%3D'
      },
      '3xl': {
        $value: 'clamp(2.2rem, .2308rem + 3.0769vw, 3rem)',
        $type: 'string',
        $description: '64-90rem: https://clamp.font-size.app/?config=eyJyb290IjoiMTYiLCJtaW5XaWR0aCI6IjY0cmVtIiwibWF4V2lkdGgiOiI5MHJlbSIsIm1pbkZvbnRTaXplIjoiMi4ycmVtIiwibWF4Rm9udFNpemUiOiIzcmVtIn0%3D'
      }
    },

    style: {
      base: {
        $value: 'normal',
        $type: 'string'
      }
    },

    weight: {
      xxlight: {
        $value: '100',
        $type: 'string',
        $description: ''
      },
      xlight: {
        $value: '200',
        $type: 'string',
        $description: ''
      },
      light: {
        $value: '300',
        $type: 'string',
        $description: ''
      },
      regular: {
        $value: '400',
        $type: 'string',
        $description: ''
      },
      medium: {
        $value: '500',
        $type: 'string',
        $description: ''
      },
      semibold: {
        $value: '600',
        $type: 'string',
        $description: ''
      },
      bold: {
        $value: '700',
        $type: 'string',
        $description: ''
      },
      xbold: {
        $value: '900',
        $type: 'string',
        $description: ''
      }
    }
  }, // end font

  // Rhythm in Web Typography | Better Web Type <https://betterwebtype.com/articles/2018/10/15/rhythm-in-web-typography/>
  // The good line-height <https://www.thegoodlineheight.com/>

  'line-height': {
    base: {
      $value: 1.5,
      $type: 'number'
    },
    sm: {
      $value: 1.4,
      $type: 'number'
    },
    xs: {
      $value: 1.25,
      $type: 'number'
    }
  },
};
