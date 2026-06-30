# CSS Custom Properties List

List of all CSS custom properties used in css files.

If you don't want to use a new CSS, you can use the default one, just by customizing the values ​​of the custom properties.

You can set the custom values ​​in the `:root` element, or directly in the json-table wrapper by assigning it a specific class:

In the json-table config:

```javascript
new jsonTable({
  container: '...',
  mainWrapperExtraClassName: 'my-custom-classname',
  
  /* other config parameters */
});
```

In your css:

```css
.my-custom-classname {
  --jt-search-input-bg-color: #efefef;
  --jt-search-input-border-color: #666;

  /* other custom properties */
}

```
