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


## Properties template
Use this template to easily customize the css properties.
Uncomment and customize the properties you need. The value assigned is the default one.

```css
.your-selector {
  /* --jt-bool-false-color: #c00; */                                                /* color for _false_ boolean values icon */
  /* --jt-bool-icon-size: 1.3em; */                                                 /* boolean icons size */
  /* --jt-bool-true-color: #0a7202; */                                              /* color for _true_ boolean values icon */
  /* --jt-info-font-size: clamp(0.85rem, 0.6824rem + 0.3529vw, 1rem); */            /* font size for info section */
  /* --jt-outer-info-bg: #fff; */                                                   /* background color for info external wrapper */
  /* --jt-outer-padding-block-end: 1rem; */                                         /*  */
  /* --jt-placeholder-color: #999; */                                               /* color for placeholder text */
  /* --jt-search-input-bg-color: transparent; */                                    /* background color for search input element */
  /* --jt-search-input-border-color: #999; */                                       /* border color for search input element */
  /* --jt-search-input-font-size: clamp(0.85rem, 0.6824rem + 0.3529vw, 1rem); */    /* font size for search input element */
  /* --jt-search-input-padding-x: .75rem; */                                        /* left and right padding for search input element */
  /* --jt-search-input-padding-y: .375rem; */                                       /* top and bottom padding for search input element */
  /* --jt-search-input-text-color: currentColor; */                                 /* text color for search input element */
  /* --jt-sort-arrows-active-fill: #33ef15; */                                      /* Sort arrows fill color when in active state */
  /* --jt-sort-arrows-btn-active-bg: #33ef15; */                                    /*  */
  /* --jt-sort-arrows-btn-active-color: #000; */                                    /*  */
  /* --jt-sort-arrows-fill: #fff; */                                                /* default sort arrows fill color */
  /* --jt-sort-arrows-hover-bg: #fff; */                                            /* background color for sort arrows button when in hover state */
  /* --jt-sort-arrows-hover-fill: #000; */                                          /* sort arrows fill color when in hover state */
  /* --jt-sort-arrows-size: .9rem; */                                               /* sort arrows size */
  /* --jt-sort-arrows-wrapper-bg-color: #000; */                                    /* background color for the div around the sort arrows */
  /* --jt-sort-arrows-wrapper-border: 1px solid #666; */                            /* border property for the div around the sort arrows */
  /* --jt-sort-arrows-wrapper-box-shadow: 0 0 5px rgb(0 0 0 / .4); */               /* `box-shadow` property for the div around the sort arrows */
  /* --jt-sort-arrows-wrapper-hover-box-shadow: 0 2px 1rem rgb(0 0 0 / .6); */      /*  */
  /* --jt-sort-arrows-wrapper-padding: 3px; */                                      /* `padding` for the div around the sort arrows */
  /* --jt-sort-asc-arrow-rotate: 180deg; */                                         /* rotation angle for sort asc arrow. You need it if your are using the same icon both for ASC and DESC */
  /* --jt-sort-asc-arrow-svg-vertical-adjust: 3px; */                               /* Asc icon vertical position adjustment value */
  /* --jt-sort-desc-arrow-rotate: 0; */                                             /* rotation angle for sort desc arrow. You need it if your are using the same icon both for ASC and DESC */
  /* --jt-sort-desc-arrow-svg-vertical-adjust: -3px; */                             /* desc icon vertical position adjustment value */
  /* --jt-thead-sort-overlay-bg: rgb(0 0 0 / .1); */                                /*  */
  /* --jt-wrapper-margin-block: 1rem; */                                            /* top and bottom margins for main wrapper element */
};
```


> NB: mobile and desktop breakpoints are defined in `src/css/custom-media.css`.
> If you want to change them, you'll have to rebuild **jsonTable** and you'll need [postcss-custom-media](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-custom-media).
