nelle funzioni dei singoli grafici aggiungere `const chartInstance = this;` e sostituire i `this` riferiti ad `adaChart` con `chartInstance`


****

Tutte le funzioni condivise, ad eccezione di `createSvgCanvas`, sono ora standalone e vanno importate dove necessario. 

`chartUtils`, `textToSvgPath` e `parseStdAxisOpts` vanno importate e utilizzate direttamente, rimuovendo `this.` o `this.utils.` nel caso di quelle in `chart-utils.js`

* `import { parseContainer, truncateDecimal, toRadians, polarToCartesian, classnames, classnamesNull, calcArcCoords, calcAttrD, getElementFromContainer } from '../chart-utils.js';`
* `import { textToSvgPath } from '../svg-text-to-path.js'`;
* `import { parseStdAxisOpts } from '../parse-std-axis-opts.js'`;


`cartesianAxis`, `createTextEl`, `legenda`, vanno invocate passando come primo parametro l'istanza della classe, esempio:

* `import { cartesianAxis } from '../cartesian-axis.js';`
* `import { createTextEl } from '../create-text-element.js';`
* `import { legenda } from '../legenda.js';`

```javascript
const titleEl = await createTextEl (chartInstance, {
  text: yAxisTitle,
  textFill: yAxisTitleAttrs.fill?? '#000',
  fontAttr: yAxisTitleAttrs,
  fontFilePath: yAxisTitleFontFilePath,
  parentElement: titleGroup
});
```

****

`createTextEl` non restituisce più bbox ed elemento ma solo quest'ultimo.

```javascript
// Cambiare 

const [labelBbox, labelEl] = await chartInstance.createTextEl({...})

// in 

const labelEl = await createTextEl(chartInstance, {...}),
  labelBbox = labelEl.bbox()
```

****

L'argomento di parseContainer è ora un oggetto (`function parseContainer({container = null, width = null, height = null, emptyContainer = true}) {...}`), la funzione va quindi invocata specificando i parametri

parseContainer ora non svuota più l'elemento
****

gli argomenti di polarToCartesian non utilizzano più un oggetto per x e y
