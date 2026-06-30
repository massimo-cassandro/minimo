#!/usr/bin/env node
/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';
import { styleText } from 'node:util';
import { fileURLToPath } from 'url';

// parse all css files and extract all custom properties
// then create a markdown document adding a description for each property

// tke key is a camelCase version of the css property name (without leading --jt-)
const descriptions = {

  boolFalseColor: 'color for _false_ boolean values icon',
  boolIconSize: 'boolean icons size',
  boolTrueColor: 'color for _true_ boolean values icon',
  infoFontSize: 'font size for info section',
  outerInfoBg: 'background color for info external wrapper',
  outerPaddingBlockEnd: 'padding bottom value for outer info container (corresponds to the space between this element and the table)',
  placeholderColor: 'color for placeholder text',
  searchInputBgColor: 'background color for search input element',
  searchInputBorderColor: 'border color for search input element',
  searchInputFontSize: 'font size for search input element',
  searchInputPaddingX: 'left and right padding for search input element',
  searchInputPaddingY: 'top and bottom padding for search input element',
  searchInputTextColor: 'text color for search input element',
  sortArrowsActiveFill: 'Sort arrows fill color when in active state',
  sortArrowsBtnActiveBg: '',
  sortArrowsBtnActiveColor: '',
  sortArrowsFill: 'default sort arrows fill color',
  sortArrowsHoverBg: 'background color for sort arrows button when in hover state',
  sortArrowsHoverFill: 'sort arrows fill color when in hover state',
  sortArrowsSize: 'sort arrows size',
  sortArrowsWrapperBgColor: 'background color for the div around the sort arrows',
  sortArrowsWrapperBorder: 'border property for the div around the sort arrows',
  sortArrowsWrapperBoxShadow: '`box-shadow` property for the div around the sort arrows',
  sortArrowsWrapperHoverBoxShadow: '',
  sortArrowsWrapperPadding: '`padding` for the div around the sort arrows',
  sortAscArrowRotate: 'rotation angle for sort asc arrow. You need it if your are using the same icon both for ASC and DESC',
  sortAscArrowSvgVerticalAdjust: 'Asc icon vertical position adjustment value',
  sortDescArrowRotate: 'rotation angle for sort desc arrow. You need it if your are using the same icon both for ASC and DESC',
  sortDescArrowSvgVerticalAdjust: 'desc icon vertical position adjustment value',
  theadSortOverlayBg: '',
  wrapperMarginBlock: 'top and bottom margins for main wrapper element',

};

const __filename = fileURLToPath(import.meta.url),
  __dirname = path.dirname(__filename);

const props = {},
  css_folder = path.resolve(__dirname, '../src/css'),
  target_file = path.resolve(__dirname, '../docs/custom-props-list.md'),
  start_text = fs.readFileSync( path.resolve(__dirname, './src/custom-props-start.md'), 'utf8' ),
  end_text = fs.readFileSync( path.resolve(__dirname, './src/custom-props-end.md'), 'utf8' ),
  show_props_list = true // to create the descriptions
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

  // properties array
  let maxLength = 0;
  let descriptionsKeys = '';
  const propsArray = Object.keys(props).toSorted((a, b) => a.localeCompare(b)).map(key => {

    const descrKey = key.replace(/-([a-z])/g, function (part) { return part[1].toUpperCase(); });

    if(show_props_list) {
      descriptionsKeys +=`${descrKey}: '${descriptions[descrKey]??''}',\n`;
    }

    const thisProp = {
      prop: `/* --jt-${key}: ${props[key].default}; */`,
      comment: `/* ${descriptions[descrKey] ?? ''} */`
    };

    maxLength = Math.max(maxLength, thisProp.prop.length);

    // console.log(thisProp);

    return thisProp;
  });


  // tabella
  // const table = '## Properties\n' +
  //   '| Property | Default value | Description |\n' +
  //   '| :--- | :--- | :--- |\n' +
  //   Object.keys(props).toSorted((a, b) => a.localeCompare(b)).map(key => {

  //     const descrKey = key.replace(/-([a-z])/g, function (part) { return part[1].toUpperCase(); });

  //     if(show_props_list) {
  //       descriptionsKeys +=`${descrKey}: '${descriptions[descrKey]??''}',\n`;
  //     }

  //     return `| \`--jt-${key}\` | \`${props[key].default}\` | ${descriptions[descrKey] ?? ''} |`;
  //   }).join('\n')
  // ;

  maxLength += 4; // spazio tra proprietà e commenti

  const template = '## Properties template\n' +
    'Use this template to easily customize the css properties.\n'+
    'Uncomment and customize the properties you need. The value assigned is the default one.\n\n' +

    '```css\n' +
    '.your-selector {\n' +

    propsArray.map(thisProp => {
      return '  ' + thisProp.prop + ' '.repeat(maxLength - thisProp.prop.length) + thisProp.comment;
    }).join('\n') +

    '\n};\n'+
    '```';


  fs.writeFileSync( target_file, start_text + '\n\n' + template + '\n\n' + end_text );

  if(show_props_list) {
    console.log('\n' +styleText(['yellow'],  descriptionsKeys) + '\n'); // lista chiavi
  }

  console.log( '\n' + styleText(['bgGreen'], ' Done ' ) + '\n' );

} catch(e) {
  let message = styleText('bgRed', ` ${e} `);
  console.error( '\n' + message + '\n');
}
