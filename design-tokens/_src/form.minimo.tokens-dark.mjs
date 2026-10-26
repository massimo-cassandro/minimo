/*
  Token dark mode dei form (valori inversi di form.minimo.tokens.mjs)
  vedi `sourceModes` in design-tokens/tokens-config.mjs
*/
export default {
  form: {
    control: {
      border: {
        color: {
          $value: '#999',
          $type: 'color'
        }
      },
      placeholder: {
        color: {
          $value: '#999',
          $type: 'color'
        }
      },
      disabled: {
        background: {
          color: {
            $value: '#222',
            $type: 'color'
          }
        },
        color: {
          $value: '#666',
          $type: 'color'
        }
      },
      readonly: {
        color: {
          $value: '#999',
          $type: 'color'
        }
      },
      select: {
        'trigger-icon': {
          $value: 'url(\'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22%23fff%22%20viewBox%3D%220%200%20256%20256%22%3E%3Cpath%20d%3D%22M216.49%2C104.49l-80%2C80a12%2C12%2C0%2C0%2C1-17%2C0l-80-80a12%2C12%2C0%2C0%2C1%2C17-17L128%2C159l71.51-71.52a12%2C12%2C0%2C0%2C1%2C17%2C17Z%22%2F%3E%3C%2Fsvg%3E\')',
          $type: 'string',
          $description: 'src/icons/caret-down-bold-negative.svg'
        }
      }
    }
  }
};
