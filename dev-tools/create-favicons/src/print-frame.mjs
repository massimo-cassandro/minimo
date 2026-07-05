/* eslint-disable no-console */

// https://nodejs.org/api/util.html#utilstyletextformat-text-options
import { styleText } from 'node:util';

export function log(color, string, mode='log') {
  console[mode]( styleText(color, string) );
}

export function printFrame(options) {

  /*
    stringsArray = [
      {string: '__string__', color: 'green', bg: false, bold: false, underline: false},
      {...}
    ]
  */

  const defaults = {
      strings: [],
      frameColor: 'green',
      frametype: 'single'
    },
    string_defaults = { string: '', color: 'green', bg: false, bold: false, underline: false},
    frame_lines = {
      single: ['┌', '┐', '└', '┘', '┈', '│'],
      double: ['╔', '╗', '╚', '╝', '═', '║']
    };

  options = {...defaults, ...options};

  const frames_elements = frame_lines[options.frametype];

  options.strings = options.strings.map(item => {return {...string_defaults, ...item }; });

  // aggiunta spazi sulle righe `bg`
  options.strings.forEach(item => {
    if(/^bg/.test(item.color)) {
      item.string = ` ${item.string} `;
    }
  });

  const total_length = Math.max( ...(options.strings.map(item => item.string.length)) ) + 2;

  log( options.frameColor, `\n${frames_elements[0]}` + frames_elements[4].repeat(total_length) + frames_elements[1] );

  options.strings.forEach(item => {
    console.log(
      styleText(options.frameColor, `${frames_elements[5]} `) +
      styleText(item.color, item.string)  + ' '.repeat(total_length - item.string.length - 2) +
      styleText(options.frameColor, ` ${frames_elements[5]}`)
    );
  });

  log(options.frameColor, frames_elements[2] + frames_elements[4].repeat(total_length) + `${frames_elements[3]}\n` );
}
