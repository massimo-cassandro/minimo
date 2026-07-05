/* eslint-disable no-console */
import { styleText } from 'node:util';
import { configManager } from './config-manager.mjs';


// https://developer.mozilla.org/en-US/docs/Web/API/console#styling_console_output
// https://nodejs.org/api/util.html#customizing-utilinspect-colors

export function printResult(text, mode = 'info') {
  const cfg = configManager.getCfg()
    ,style = Array.isArray(cfg.console_colors[mode])? cfg.console_colors[mode] : [cfg.console_colors[mode]]
    ,isBg = style.reduce((acc, val) => acc || /^(bg)/.test(val), false)
  ;

  if(isBg) {
    text = ` ${text} `;
  }

  let message = styleText(cfg.console_colors[mode], text);

  if(isBg) {
    message = `\n${message}\n`;
  }

  console.log( message);
}
