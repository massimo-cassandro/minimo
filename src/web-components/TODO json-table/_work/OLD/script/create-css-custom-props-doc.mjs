#!/usr/bin/env node
/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';
import { styleText } from 'node:util';

// parse all css files and extract all custom properties
// then create a markdown document adding a description for each property

// tke key is a camelCase version of the css property name (without leading --jt-)
const descriptions = {

  boolFalseColor                : 'color for _false_ boolean values icon',
  boolIconSize                  : 'boolean icons size',
  boolTrueColor                 : 'color for _true_ boolean values icon',
  placeholderColor              : 'color for placeholder text',
  searchInputBgColor            : 'background color for search input element',
  searchInputBorderColor        : 'border color for search input element',
  searchInputFontSize           : 'font size for search input element',
  searchInputPaddingX           : 'left and right padding for search input element',
  searchInputPaddingY           : 'top and bottom padding for search input element',
  searchInputTextColor          : 'text color for search input element',
  tableBorderColor              : 'table `border-color`',
  tableBorderStyle              : 'table `border-style`',
  tableBorderWidth              : 'table `border-width`',
  tableCaptionSide              : 'table `caption-side` (`top` or `bottom`)',
  tableCellBgColor              : 'td `background-color`',
  tableCellBorderColor          : 'td `border-color`',
  tableCellBorderStyle          : 'td `border-style`',
  tableCellBorderWidth          : 'td `border-width`',
  tableCellPaddingX             : 'left and right padding for td',
  tableCellPaddingY             : 'top and bottom padding for td',
  tableCellVerticalBorderWidth  : 'td `border-width` for vertical borders',
  tableMarginBlock              : 'top and bottom margins for table',
  tableTfootCellBgColor         : 'background color for tfoot cells',
  tableTfootCellBorderColor     : 'border color for tfoot cells (applied to the bottom border of the first tr of tfoot)',
  tableTfootCellBorderWidth     : 'border width for tfoot cells (applied to the bottom border of the first tr of tfoot)',
  tableTheadCellBgColor         : 'background color for thead cells',
  tableTheadCellBorderColor     : 'border color for thead cells (applied to the bottom border of the last tr of thead)',
  tableTheadCellBorderWidth     : 'border width for thead cells (applied to the bottom border of the last tr of thead)',
  wrapperMarginBlock            : 'top and bottom margins for main wrapper element',

};


const props = {},
  css_folder = '../src/css',
  target_file = path.resolve(new URL('.', import.meta.url).pathname, '../docs/custom-props-list.md'),
  show_props_list = false // to create the descriptions
;


try {

  fs.readdirSync(css_folder).forEach(file => {
    if(file.endsWith('.css')) {
      const css_content = fs.readFileSync(path.join(css_folder, file), 'utf8'),
        matches = css_content.matchAll(/var\(--jt-(?<name>(.*?))(?:, (?<def>(.*?))\)[ ;])/g);

      for (const match of matches) {
        if(match?.groups) {

          if(props[match.groups.name]) {
            if(props[match.groups.name].default !== match.groups.def) {
              throw new Error( `Default values of the same property cannot be different (${match.groups.name})` );
            }
            props[match.groups.name].files.push(file);

          } else {
            props[match.groups.name] = {
              files: [file],
              default: match.groups.def
            };
          }

        }
      }
    }
  });

  let descriptionsKeys = '';

  const table = '## Properties\n' +
    '| Property | Default value | Description |\n' +
    '| :--- | :--- | :--- |\n' +
    Object.keys(props).toSorted((a, b) => a.localeCompare(b)).map(key => {

      const descrKey = key.replace(/-([a-z])/g, function (part) { return part[1].toUpperCase(); });

      if(show_props_list) {
        descriptionsKeys +=`${descrKey}: '${descriptions[descrKey]??''}',\n`;
      }

      return `| \`--jt-${key}\` | \`${props[key].default}\` | ${descriptions[descrKey] ?? ''} |`;
    }).join('\n')
  ;

  const start_text = fs.readFileSync( './src/custom-props-start.md', 'utf8' ),
    end_text = fs.readFileSync( './src/custom-props-end.md', 'utf8' );

  fs.writeFileSync( target_file, start_text + '\n\n' + table + '\n\n' + end_text );

  if(show_props_list) {
    console.log('\n' +styleText(['yellow'],  descriptionsKeys) + '\n'); // lista chiavi
  }

  console.log( '\n' + styleText(['bgGreen'], ' Done ' ) + '\n' );

} catch(e) {
  let message = styleText('bgRed', ` ${e} `);
  console.error( '\n' + message + '\n');
}
