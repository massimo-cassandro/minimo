# Layout tools

Mostra un piccolo indicatore del breakpoint corrente.

## Uso

In uno script condiviso da tutto il progetto:

```javascript
/* global process */
if (process.env.NODE_ENV === 'development') {
  import('@massimo-cassandro/minimo/layout-tools')
    .then(({ layoutTools }) => layoutTools()); // framework di default (minimo)
}
```

Con Bootstrap 5:

```javascript
/* global process */
if (process.env.NODE_ENV === 'development') {
  import('@massimo-cassandro/minimo/layout-tools')
    .then(({ layoutTools }) => layoutTools({ framework: 'bs5' })); 
}
```
