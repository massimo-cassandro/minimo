# Design Tokens Builder

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
- Optionally, one or more **W3C DTCG JSON/JSONC** files, independent of any specific consuming tool (usable in Penpot, Figma via plugin, Token Studio, ...).

#### Usage

```sh
npx buildTokens --config ./path/to/tokens-config.mjs
```

#### Source files

The `source` array accepts any combination of:
- Concrete file paths: `'./tokens/colors.jsonc'`
- Glob patterns: `'./tokens/**/*.{json,jsonc,mjs}'`
- `{ src, prefix }` objects, to add a prefix to the custom properties of those files (see [Source prefixes](#source-prefixes))

**Supported formats:**
- `.json` / `.jsonc` — parsed directly as token data
- `.mjs` / `.js` — imported as ES modules; must export a W3C DTCG-compliant object as `default`

**Legacy token syntax (auto-detected, `.json` only):** `.json` source files written in the older, non-DTCG Style Dictionary syntax (`value`/`type` instead of `$value`/`$type`, references as `{group.token.value}` instead of `{group.token}` — e.g. a file exported from [Open Props](https://open-props.style/)) are converted to DTCG v5 syntax automatically at parse time, node by node. Files already using `$value`/`$type` are left untouched, so no config flag or file list is needed — mixing legacy and DTCG sources in the same `source` array just works. `.jsonc` is not covered (reserved for hand-authored DTCG sources, parsed by Style Dictionary's own loader) and these `.json` files are parsed with plain `JSON.parse` (no comments, no trailing commas). See `build-tokens-src/legacy-tokens-parser.mjs`.

Known limitation: a legacy node that is at the same time a token (own `value`/`type`) *and* a group with further nested children (e.g. Open Props' `other.ease.out`, which has its own value plus `out.1` ... `out.5`) can't be represented in DTCG v5 — a node with `$value` is always a leaf, Style Dictionary doesn't descend into its children. Only the node's own value is converted; the nested children are silently lost.

#### Source prefixes

An entry of `source` (or of a `sourceModes` mode) can be an object `{ src, prefix }` instead of a string: every custom property generated from the files matched by `src` (a path, a glob or an array of them) is rendered with the given prefix. Useful to avoid name collisions with third-party token sets, or to make their origin explicit:

```js
source: [
  './my-tokens/*.mjs',
  { src: `${node_modules_path}/open-props/open-props.style-dictionary-tokens.json`, prefix: 'op' },
],
```

With this config Open Props' `gray.0` becomes `--op-gray-0`. `prefix` accepts `'op'`, `'op-'` or `'--op-'` (all equivalent).

- Only the custom property **name** changes, not the token path: `{references}` keep working, and a token of another source referencing `{gray.0}` is rendered as `var(--op-gray-0)`.
- The JSON output (`jsonBuildPath`) is **not** prefixed: it keeps the original token tree.
- `customPropsGroups` match the prefixed name, so a group can use `prefixes: ['op']`.
- Giving two different prefixes to the same file fails the build with an error.
- `check-unresolved-custom-props.mjs` understands the same syntax. Note that `extraCustomPropsFiles` entries are plain CSS files and are never prefixed.

See `build-tokens-src/source-prefixes.mjs`.


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

#### JSON output

When `jsonBuildPath` is set, the script also generates W3C DTCG token files, independent of any specific consuming tool (e.g. importable into Penpot via the [Design Tokens plugin](https://penpot.app/penpot-files/design-tokens), into Figma via a compatible plugin, or into Token Studio).

**Single file** (`jsonDestFile` is a string):
```
jsonBuildPath/tokens.jsonc   ← all tokens in one file
```

**One file per source** (`jsonDestFile` is `null` or omitted):
```
jsonBuildPath/colors.tokens.jsonc
jsonBuildPath/spacing.tokens.jsonc
jsonBuildPath/typography.tokens.jsonc
```
All files are written flat in `jsonBuildPath`, regardless of the subdirectory structure of the source files — no subdirectories are created. If two source files with different paths would produce the same output filename, the build fails with an error listing the colliding files instead of silently overwriting one with the other.

The `jsonFormat` option controls the output:

| Value | Extension | Disclaimer header |
|---|---|---|
| `'jsonc'` | `.jsonc` | Yes |
| `'json'` | `.json` | No |

Alias references (`{color.brand.primary}`) are preserved in the output so consuming tools maintain token links between primitive and semantic tokens.

> JSON token files intentionally use a minimal set of transforms (no px→rem conversion, no shorthand expansion) because consuming tools generally expect original values and structured objects, not resolved CSS strings.

#### sourceModes (light/dark split)

`sourceModes` is an alternative to `source`, for projects that need a light/dark (or other) custom properties split. See the comments in `tokens-config-sample.mjs` for the full option reference (`sourceModes`, `sourceModesBase`).

When set, each mode has its own `source` array, and the generated CSS composes all modes into a single `destFile`:
- the base mode's props go in a top-level `:root { ... }` block, with `color-scheme: <all modes>;` prepended
- every other mode's props go in `@media (prefers-color-scheme: <mode>) { :root { ... } }`, with `color-scheme: <mode>;` prepended

Tokens of a non-base mode can reference tokens defined in the base mode (e.g. a dark token using `{color.1}` defined in light, output as `var(--color-1)`). References to a non-base mode's tokens (from the base mode or from another non-base mode) fail with a "reference not defined" error, since the target would be undefined outside its own `@media` block.

`customPropsGroups`, `mergeCustomProps`, `addLayer`, `pxToRem` etc. all apply the same way as with a single `source` (`mergeCustomProps` set to an array of strings/RegExps matches the token files of every mode). The JSON output (when `jsonBuildPath` is set) is produced once per mode, with the mode name appended to each filename (e.g. `tokens-light.jsonc` / `tokens-dark.jsonc`).

---

### `check-unresolved-custom-props.mjs`

Scans all `.css` files in `dirToCheck` (recursively) and reports:

- **unresolved properties** — `var(--...)` references that are not defined in the generated token CSS file or in any `extraCustomPropsFiles`
- **unused properties** — custom properties defined in the generated token CSS file (or an `extraCustomPropsFiles` entry) but never referenced via `var()` in any scanned CSS file. Only reported if `checkUnused: true` is set in the config, since it re-runs the Style Dictionary transform pipeline over the token sources to resolve, when possible, the `.mjs` source file for each unused property. When `ignoreUnusedInNodeModules` is true (default), properties sourced from a token file under `node_modules` (e.g. a third-party token package) are never reported as unused.

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
