import * as fs from 'fs';
import * as path from 'path';
import { parseSvgMarkup } from './parse-svg-markup.mjs';
import { parseSvgFilename } from './parse-svg-filename.mjs';
import { configManager } from './config-manager.mjs';
import { printResult } from './print-result.mjs';


export function parseSvgFiles(parseModeKey, callback) {
  /*
    parseModeKey: one of 'symbols', 'jsx' or 'optimize' (same keys of config obj)
  */
  const cfg = configManager.getCfg();
  let fileCount = 0;


  const parseFolder = (folder, svgType) => {
    folder = path.resolve(cfg.work_dir, folder);

    if(fs.existsSync(folder)) {

      fs.readdirSync(folder).forEach(file => {
        if(file.endsWith('.svg')) {

          fileCount++;
          const filepath = path.resolve(folder, file),
            parsedSvg = parseSvgMarkup(filepath, svgType, cfg[parseModeKey].svgo_config);

          parsedSvg.filename = parseSvgFilename(file);
          parsedSvg.filename_camel_case = parsedSvg.filename
            .replace(/-([a-z])/g, (part) => part[1].toUpperCase())
            .replace(/-([0-9])/g, (part) => `_${part[1]}`);

          parsedSvg.filename_pascal_case = parsedSvg.filename_camel_case.at(0).toUpperCase() +
            parsedSvg.filename_camel_case.substring(1);

          callback(parsedSvg);
        }
      });

    } else {
      throw new Error( `Folder “${folder}” doesn't exist` );
    }

  };


  try {

    if(['symbols', 'jsx', 'optimize'].indexOf(parseModeKey) === -1) {
      throw new Error( `“${parseModeKey}” type is not mapped. It must be one of 'symbols', 'jsx' or 'optimize'` );
    }

    // source_folders is an array and not an object? (not used in the current version)
    if(Array.isArray(cfg[parseModeKey].source_folders) ) {

      cfg[parseModeKey].source_folders.forEach(folder => {
        parseFolder(folder, null);
      });

    } else {

      for(const svgType in cfg[parseModeKey].source_folders) {

        const foldersArray = cfg[parseModeKey].source_folders[svgType];

        if(!Array.isArray(foldersArray) ) {
          throw new Error( `“${foldersArray}” must be an array` );
        }

        foldersArray.forEach(folder => {
          parseFolder(folder, svgType);
        });
      }
    }

    return fileCount;

  } catch(e) {
    printResult( e, 'error' );
  }
}
