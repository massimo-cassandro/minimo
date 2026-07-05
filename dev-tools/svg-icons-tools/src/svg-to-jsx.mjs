import * as path from 'path';
import * as fs from 'fs';
import { configManager } from './config-manager.mjs';
import { parseSvgFiles } from './parse-svg-files.mjs';
import { printResult } from './print-result.mjs';
import { homedir_path_to_tilde } from './homedir-path-to-tilde.mjs';
import { jsx_icon_file_builder } from './jsx-icon-file-builder.mjs';
import { create_dest_folder } from './create-dest-folder.mjs';

export async function svg_to_jsx() {

  const cfg = configManager.getCfg(),
    cfg_obj = cfg.jsx,
    icon_builder = cfg_obj.custom_icon_builder && typeof cfg_obj.custom_icon_builder === 'function'?
      cfg_obj.custom_icon_builder : jsx_icon_file_builder;

  let dest_folder = '', fileCount = 0, component_list = [];

  const source_folders_length = Object.keys(cfg_obj.source_folders)
    .reduce((acc, key) => acc + cfg_obj.source_folders[key].length, 0);

  if (source_folders_length && cfg_obj.dest_folder) {

    dest_folder = path.resolve(cfg.work_dir, cfg_obj.dest_folder);

    // checking output dir for optimized svg files
    await create_dest_folder(dest_folder, cfg_obj.clearDestFolder);


    // parsing and saving JSX files
    fileCount = parseSvgFiles('jsx',
      (parsedSvg) => {
        const result = icon_builder(parsedSvg),
          dest_filename = result.filename?? `${result.component_name}.jsx`,
          dest_file_path = path.resolve(dest_folder, dest_filename);
        fs.writeFileSync(dest_file_path, result.jsx_content);
        component_list.push({name: result.component_name, path: dest_file_path});
      }
    );

    // creating index file
    let index_file_path = '';
    if (component_list.length && cfg_obj.index_file) {

      index_file_path = path.resolve(cfg.work_dir, cfg_obj.index_file);
      const index_file_folder = path.dirname(index_file_path);

      if (!fs.existsSync(index_file_folder)) {
        fs.mkdirSync(index_file_folder, {recursive: true});
      }

      const index_file_content = component_list.reduce((acc, component_obj) => {
        const relative_path = path.relative(path.dirname(index_file_path), component_obj.path);
        acc.push(`export { ${component_obj.name} } from './${relative_path}';`);
        return acc;
      }, []);

      fs.writeFileSync(index_file_path,
        '// Generated file\n\n' +
        index_file_content.toSorted((a, b) => a.localeCompare(b)).join('\n')
      );
    }

    if(fileCount) {
      printResult(`\nSVG to JSX: ${fileCount} SVG files processed`);
      printResult(`JSX files saved to ${homedir_path_to_tilde(dest_folder)}`, 'infoDim');

      if(index_file_path) {
        printResult(`Index file saved to ${homedir_path_to_tilde(index_file_path)}`, 'infoDim');

      } else {
        printResult('Index file has not been created', 'infoDim');
      }

    } else {
      printResult('\nSVG to JSX: no files processed', 'infoDim');
    }

  } else {
    printResult('\nSVG to JSX: no files processed', 'infoDim');
  }
}
