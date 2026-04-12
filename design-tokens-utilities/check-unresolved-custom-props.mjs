#!/usr/bin/env node

/* eslint-disable no-console */

// check-unresolved-custom-props.mjs
// Scans CSS files in the configured directory and reports any custom property
// references (var(--...)) that are not defined in the generated token file.
//
// Usage: node check-unresolved-custom-props.mjs --config ./path/to/config.mjs

import path from 'path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import { glob } from 'node:fs/promises';
import { styleText, parseArgs } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ---------------------------------------------------------------------------
// 1. Parse flags
// ---------------------------------------------------------------------------
const options = {
  config: {
    type: 'string',
    short: 'c',
  },
};

const { values } = parseArgs({ options });

if (!values.config) {
  console.error(styleText(['red'], 'Error: you must provide the config path with --config or -c'));
  console.log('Example: node check-unresolved-custom-props.mjs --config ./config.mjs');
  process.exit(1);
}

const absoluteConfigPath = path.resolve(process.cwd(), values.config);
const configDir = path.dirname(absoluteConfigPath);

// ---------------------------------------------------------------------------
// 2. Main
// ---------------------------------------------------------------------------
async function run() {
  try {
    const { default: config } = await import(pathToFileURL(absoluteConfigPath).href);

    // Path of the generated CSS file containing all custom property definitions
    const custom_prop_file_path = path.resolve(configDir, path.join(config.buildPath, config.destFile));
    const custom_prop_filename  = path.basename(custom_prop_file_path);

    // Directory to scan for CSS files
    const checkdir = path.resolve(configDir, config.dir_to_check);

    // Patterns for custom properties to exclude from the unresolved check
    const exclude = config.exclude_pattern ?? [];

    // Collect all .css files in the scan directory, excluding the token file itself
    const files = [];
    for await (const entry of glob(path.join(checkdir, '/**/*.css'))) {
      if (!entry.endsWith(custom_prop_filename)) {
        files.push(entry);
      }
    }

    if (!fs.existsSync(custom_prop_file_path)) {
      throw new Error(`Token CSS file not found: ${custom_prop_file_path}`);
    }

    // ---------------------------------------------------------------------------
    // 3. Build the list of defined custom properties
    // ---------------------------------------------------------------------------
    const cssContent = fs.readFileSync(custom_prop_file_path, 'utf-8');
    const definitionRegex = /--([a-z0-9-]+)(?=\s*:)/g;
    const propertyNamesList = [...cssContent.matchAll(definitionRegex)].map(m => `--${m[1]}`);

    // Also include any extra CSS files declared in extra_custom_props_files
    for (const extraFile of (config.extra_custom_props_files ?? [])) {
      const extraContent = fs.readFileSync(path.resolve(configDir, extraFile), 'utf-8');
      const extraMatches = [...extraContent.matchAll(definitionRegex)].map(m => `--${m[1]}`);
      propertyNamesList.push(...extraMatches);
    }

    // ---------------------------------------------------------------------------
    // 4. Scan files for unresolved var() references
    // ---------------------------------------------------------------------------
    const usageRegex = /var\(\s*(--[a-z0-9-]+)\s*(,.*?)?\)/g;
    const unresolved_props = [];

    files.forEach(file => {
      const fileContent = fs.readFileSync(file, 'utf-8');
      const filename    = path.relative(configDir, file);
      const matches     = [...fileContent.matchAll(usageRegex)];

      matches.forEach(match => {
        const cprop      = match[1];
        const isExcluded = exclude.some(exRegex => exRegex.test(cprop));
        const isDefined  = propertyNamesList.includes(cprop);
        const lineNumber = fileContent.substring(0, match.index).split('\n').length;

        if (!isExcluded && !isDefined) {
          unresolved_props.push({ file: filename, line: lineNumber, prop: cprop });
        }
      });
    });

    unresolved_props.sort((a, b) => a.file.localeCompare(b.file));

    // ---------------------------------------------------------------------------
    // 5. Write the report
    // ---------------------------------------------------------------------------
    const result_file = path.resolve(configDir, 'unresolved-props.md');

    console.log(styleText(['green'],
      `${unresolved_props.length} unresolved custom properties found -> ${path.relative(process.cwd(), result_file)}`
    ));

    fs.writeFileSync(
      result_file,
      unresolved_props
        .map(item =>
          `* [${path.basename(item.file)} :: ${item.line}](${item.file}#L${item.line}) -> var(${item.prop})`
        )
        .join('\n'),
      'utf-8'
    );

    console.log(styleText(['green'], '**** DONE ****'));

  } catch (err) {
    console.log(styleText(['redBright'], err.stack));
    process.exit(1);
  }
}

run();
