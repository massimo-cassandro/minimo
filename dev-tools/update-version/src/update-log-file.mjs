import * as fs from 'fs';
import { params } from './params.mjs';

export function updateLogFile() {


  if(params.logRow.fullText) {

    let text = params.logRow.fullText;

    if(params.updateMode === 'init' && params.markdownLog) {
      text = '# Changelog\n\n' + params.logRow.fullText;
    }

    fs.appendFileSync(params.logFile, text + '\n');
  }
}
