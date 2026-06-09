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


## Properties
| Property | Default value | Description |
| :--- | :--- | :--- |
| `--jt-bool-false-color` | `#c00` | color for _false_ boolean values icon |
| `--jt-bool-icon-size` | `1.3em` | boolean icons size |
| `--jt-bool-true-color` | `#0a7202` | color for _true_ boolean values icon |
| `--jt-placeholder-color` | `#999` | color for placeholder text |
| `--jt-search-input-bg-color` | `transparent` | background color for search input element |
| `--jt-search-input-border-color` | `#999` | border color for search input element |
| `--jt-search-input-font-size` | `clamp(.85rem, 6vw, 1rem)` | font size for search input element |
| `--jt-search-input-padding-x` | `.75rem` | left and right padding for search input element |
| `--jt-search-input-padding-y` | `.375rem` | top and bottom padding for search input element |
| `--jt-search-input-text-color` | `currentColor` | text color for search input element |
| `--jt-table-border-color` | `#999` | table `border-color` |
| `--jt-table-border-style` | `solid` | table `border-style` |
| `--jt-table-border-width` | `1px` | table `border-width` |
| `--jt-table-caption-side` | `bottom` | table `caption-side` (`top` or `bottom`) |
| `--jt-table-cell-bg-color` | `#fff` | td `background-color` |
| `--jt-table-cell-border-color` | `#999` | td `border-color` |
| `--jt-table-cell-border-style` | `solid` | td `border-style` |
| `--jt-table-cell-border-width` | `1px` | td `border-width` |
| `--jt-table-cell-padding-x` | `.5rem` | left and right padding for td |
| `--jt-table-cell-padding-y` | `.5rem` | top and bottom padding for td |
| `--jt-table-cell-vertical-border-width` | `1px` | td `border-width` for vertical borders |
| `--jt-table-margin-block` | `1rem` | top and bottom margins for table |
| `--jt-table-tfoot-cell-bg-color` | `#f4f4f4` | background color for tfoot cells |
| `--jt-table-tfoot-cell-border-color` | `#666` | border color for tfoot cells (applied to the bottom border of the first tr of tfoot) |
| `--jt-table-tfoot-cell-border-width` | `3px` | border width for tfoot cells (applied to the bottom border of the first tr of tfoot) |
| `--jt-table-thead-cell-bg-color` | `#e4e4e4` | background color for thead cells |
| `--jt-table-thead-cell-border-color` | `#666` | border color for thead cells (applied to the bottom border of the last tr of thead) |
| `--jt-table-thead-cell-border-width` | `3px` | border width for thead cells (applied to the bottom border of the last tr of thead) |
| `--jt-wrapper-margin-block` | `1rem` | top and bottom margins for main wrapper element |

## Notes
* `--jt-search-input-*`: you'll need that custom properties only if the `search`
  parameter is set to `true` (default) and the `searchInputClassName`
  (custom classname for search input, default `true`) parameter is not set.
