import * as path from 'path';
import * as fs from 'fs';
import { configManager } from './config-manager.mjs';
import { parseSvgFiles } from './parse-svg-files.mjs';
import { printResult } from './print-result.mjs';
import { homedir_path_to_tilde } from './homedir-path-to-tilde.mjs';
import { create_dest_folder } from './create-dest-folder.mjs';


export async function svg_to_optimized() {
  const cfg = configManager.getCfg(),
    cfg_obj = cfg.optimize;
  let dest_folder = '', fileCount = 0;

  const source_folders_length = Object.keys(cfg_obj.source_folders)
    .reduce((acc, key) => acc + cfg_obj.source_folders[key].length, 0);

  if (source_folders_length && cfg_obj.dest_folder) {

    dest_folder = path.resolve(cfg.work_dir, cfg_obj.dest_folder);

    // checking output dir for optimized svg files
    await create_dest_folder(dest_folder, cfg_obj.clearDestFolder);

    // parsing and saving optimized svg files
    fileCount = parseSvgFiles('optimize',
      (parsedSvg) => {
        fs.writeFileSync(path.resolve(dest_folder, `${parsedSvg.filename}.svg`), parsedSvg.svg);
      }
    );

    if(fileCount) {
      printResult(`\nSVG to optimized: ${fileCount} SVG files processed`);
      printResult(`Optimized files copied to ${homedir_path_to_tilde(dest_folder)}`, 'infoDim');

    } else {
      printResult('\nSVG to optimized: no files processed', 'infoDim');
    }

  } else {
    printResult('\nSVG to optimized: no files processed', 'infoDim');
  }

}
