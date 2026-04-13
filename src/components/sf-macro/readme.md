# sf-macro


## Usage

```javascript
import { sf_macro } from '@minimo/components/sf-macro/sf-macro.js';

sf_macro({
  wrapper_selector: '.sf-macro-wrapper',
  row_selector: '.sf-macro-riga',
  add_callback: null,
  del_callback: null
});
```

## Twig macro

```twig
<fieldset class="sf-macro-wrapper">
  <legend>XXXXX</legend>

  {%- macro makeRow(row) -%}
    {% set anno = row.vars.value.anno %}

    <div class="sf-macro-riga">
      <div class="grid">

        {{ form_row(row.__field__, {
          label: "__label__",
          attr: {}
        }) }}

      </div> {# end .grid #}

      <button type="button" class="btn-reset sf-macro-close-btn" aria-label="Elimina riga">
        Elimina riga
      </button>
    </div> {# end .sf-macro-riga #}
  {%- endmacro -%}
  {% import _self as m %}

  <div class="my-3 sf-macro-container" data-template="{{-
    m.makeRow(form.ciclo.vars.prototype)|e('html_attr')
  -}}">
    {% for row in form.ciclo %}
      {{ m.makeRow(row) }}
    {% endfor %}
  </div>

  <div class="mt text-right">
    <button type="button" class="btn btn-outline-secondary sf-macro-riga-add">Aggiungi XXX</button>
  </div>
</fieldset>
```