# jsonTable

HTML table generator from Ajax or static JSON. It can also add advanced functionality to static tables.

> NB: **In this first version, the static json option is disabled**.

> NB:  **This first release only provides the json-table source code, not the compiled version. To use ikson-tabble you'll need to process the code with your own bundler, which must be able to process SVG files and CSS modules (if you want to use the default css files).**.


It allows you to create a table from a JSON file or stream, adding some extra features: search, sorting, pagination, etc.

It's inspired by [jQuery Datatable](https://datatables.net/), but has far fewer features. However, it's much easier to use, highly customizable, and doesn't require jQuery.

In most cases, you simply need to modify the configuration parameters and CSS properties.

For more advanced customizations, you'll need to use the code in the `src` directory and customize the various CSS files.


[Changelog](changelog.txt).


## Installation

```bash
npm i -D @massimo-cassandro/json-table
```

## Use

Create a *JsonTable*:

```javascript
const jt = new JsonTable(table_params, optional_custom_data_types_obj);
```

where: <!-- TODO  --> TODO


## Use with `data-*` attributes and automatic rendering

<!-- TODO --> TODO

## Customizing CSS
You can customize the default CSS setting using custom properties; for more details, see [Custom CSS Properties List](docs/custom-props-list.md).

## Generate elements params object
<!-- TODO --> TODO

## Custom events

The library dispatches a custom event `jt:ready` on the table container when the instance is ready. The event `detail` property contains an object like `{ jsonTable: instance }`.

To make the event easier to catch, the library dispatches it asynchronously using `Promise.resolve().then(...)`. This schedules the dispatch in the microtask queue (that is, the callback runs after the current call stack finishes, but before the next macrotask). As a result, listeners registered immediately after calling `new JsonTable(...)` will still be able to intercept the event.

Example — register the listener before instantiation for maximum safety:

```javascript
const container = document.getElementById('mytable');
container.addEventListener('jt:ready', e => { console.log(e.detail.jsonTable); });
new JsonTable({ container, ... });
```


## Limitations

* Only one `tr` element is allowed for `thead`

