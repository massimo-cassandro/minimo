# Design Tokens

<!-- TODO intro  -->

## Using design tokens

<!-- TODO modalità d'uso (da tokens penpots o figma, con o snza merge css ecc...) -->

## Design Token Utilities

<!-- TODO rivedere e semplificare -->

A set of Node.js scripts for managing CSS design tokens in a project. Built on top of [Style Dictionary v5](https://styledictionary.com/).

### Scripts

| Script | Purpose |
|---|---|
| `build-tokens.mjs` | Generates a CSS custom properties file from design token source files |
| `check-unresolved-custom-props.mjs` | Scans CSS files and reports any `var(--...)` references not found in the generated token file |

Both scripts share the same config file, passed via `--config`.

### Setup

The scripts are intended to be used as npm scripts. Add them to your `package.json`:

```json
{
  "scripts": {
    "build tokens": "npx buildTokens --config ./path/to/tokens-config.mjs",
    "check unresolved props": "npx checkUnresolvedProps --config ./path/to/tokens-config.mjs"
  }
}
```

### Dependencies

The following packages must be present in your project:

```json
{
  "style-dictionary": "^5",
  "stylelint": "^16"
}
```

### Configuration file

Both scripts read a shared config file passed with `--config`. Use `tokens-config-sample.mjs` as a starting point.

Read comments inside the sample file for more info.


### `build-tokens.mjs`

Reads design token source files and generates:
- A **CSS file** containing all tokens as custom properties inside `:root { ... }`
- Optionally, one or more **W3C DTCG JSON/JSONC** files to import into Penpot/Figma (use in Figma requires a plugin).

#### Usage

```sh
npx buildTokens --config ./path/to/tokens-config.mjs
```

#### Source files

The `source` array accepts any combination of:
- Concrete file paths: `'./tokens/colors.jsonc'`
- Glob patterns: `'./tokens/**/*.{json,jsonc,mjs}'`

**Supported formats:**
- `.json` / `.jsonc` — parsed directly as token data
- `.mjs` / `.js` — imported as ES modules; must export a W3C DTCG-compliant object as `default`


#### Token file format (JS example)

When using `.mjs` source files, export a default object following the [W3C Design Token Community Group format](https://design-tokens.github.io/community-group/format/):

```js
// colors.tokens.mjs
export default {
  color: {
    brand: {
      primary: { $type: 'color', $value: '#0057FF' },
      secondary: { $type: 'color', $value: '#FF6B00' },
    },
    neutral: {
      '100': { $type: 'color', $value: '#F5F5F5' },
      '900': { $type: 'color', $value: '#1A1A1A' },
    },
  },
  semantic: {
    color: {
      text: {
        primary: { $type: 'color', $value: '{color.neutral.900}' }, // alias
      },
    },
  },
};
```

The main advantage of `.mjs` over `.json` is the ability to use JavaScript variables, comments, and computed values within the token definition.

Values can be expressions like `"{size.base} * .25"`, see `tokens-config-sample.mjs` for more info.

#### Custom transforms

The following transforms are registered on top of Style Dictionary's built-ins:

| Name | Type | Description |
|---|---|---|
| `shadow/css` | value | Converts shadow objects (single or array) to a `box-shadow` CSS string. px values are converted to rem. |
| `size/pxToRem-smart` | value | Converts `dimension` token values from px to rem. Skips values already in rem. |
| `color/css-modern` | value | Color passthrough with transitive alias support. |
| `gradient/css` | value | Converts gradient objects to CSS `linear-gradient`, `radial-gradient` or `conic-gradient`. |
| `composite/css` | value | Converts `border`, `outline`, `transition` and `animation` objects to their CSS shorthand. |
| `typography/css` | value | Typography passthrough — the format handles exploding the value into individual properties. |

#### CSS output

All tokens are output as CSS custom properties inside `:root`, sorted alphabetically.

Typography tokens are expanded into multiple properties:
- `--token-name-font` — a `font` shorthand (when both `fontSize` and `fontFamily` are present)
- `--token-name-letter-spacing`, `--token-name-text-transform`, `--token-name-text-decoration` — individual properties

The generated file is linted and auto-fixed with stylelint using the config specified in `stylelintConfigPath`.

#### Penpot output

When `penpotBuildPath` is set, the script also generates W3C DTCG token files for import into Penpot via the [Design Tokens plugin](https://penpot.app/penpot-files/design-tokens).

**Single file** (`penpotDestFile` is a string):
```
penpotBuildPath/tokens.jsonc   ← all tokens in one file
```

**One file per source** (`penpotDestFile` is `null` or omitted):
```
penpotBuildPath/colors.tokens.jsonc
penpotBuildPath/spacing.tokens.jsonc
penpotBuildPath/typography.tokens.jsonc
```

The `penpotFormat` option controls the output:

| Value | Extension | Disclaimer header |
|---|---|---|
| `'jsonc'` | `.jsonc` | Yes |
| `'json'` | `.json` | No |

Alias references (`{color.brand.primary}`) are preserved in the output so Penpot maintains token links between primitive and semantic tokens.

> Penpot token files intentionally use a minimal set of transforms (no px→rem conversion, no shorthand expansion) because Penpot expects original values and structured objects, not resolved CSS strings.

---

### `check-unresolved-custom-props.mjs`

Scans all `.css` files in `dirToCheck` (recursively) and reports:

- **unresolved properties** — `var(--...)` references that are not defined in the generated token CSS file or in any `extraCustomPropsFiles`
- **unused properties** — custom properties defined in the generated token CSS file (or an `extraCustomPropsFiles` entry) but never referenced via `var()` in any scanned CSS file. Only reported if `checkUnused: true` is set in the config, since it re-runs the Style Dictionary transform pipeline over the token sources to resolve, when possible, the `.mjs` source file for each unused property.

Results are written to `unresolved-unused-props.md` in the same directory as the config file.

#### Usage

```sh
npx checkUnresolvedProps --config ./path/to/tokens-config.mjs
```

#### Output

The script creates a `unresolved-unused-props.md` file next to the config file (only if there is at least one unresolved or unused property). Each unresolved entry links to the file and line number where the property is used; each unused entry links to its `.mjs` token source file when it can be resolved, otherwise just the property name is reported:

```markdown
## Unresolved custom properties

* [components.css](../src/components.css#L42) -> `--color-action-hover`
* [layout.css](../src/layout.css#L17) -> `--spacing-missing`

## Unused custom properties

* [colors.minimo.tokens.mjs](../_src/colors.minimo.tokens.mjs) -> `--color-legacy-accent`
* `--manually-added-prop`
```

In VS Code, Option/Alt-clicking on the URL opens the file at the required line.


#### Excluding properties

Use `excludePattern` to suppress false positives — for example, internal/private custom properties that are defined dynamically or inline:

```js
// skips all custom props starting with `--_` or `--js-`
excludePattern: [
  /^--_/,          
  /^--js-/,        
]
```
