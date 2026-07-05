import * as path from 'path';
import * as fs from 'fs';
import { configManager } from './config-manager.mjs';
import { parseSvgFiles } from './parse-svg-files.mjs';
import { printResult } from './print-result.mjs';
import { homedir_path_to_tilde } from './homedir-path-to-tilde.mjs';

export function svg_to_symbols() {

  const cfg = configManager.getCfg();
  let symbols_str = '', fileCount = 0, icons_list = [];

  fileCount = parseSvgFiles('symbols',
    (parsedSvg) => {
      symbols_str += `<symbol id="${parsedSvg.filename}" viewBox="${parsedSvg.viewbox}"`+
        (parsedSvg.classes.length? ` class="${parsedSvg.classes.join(' ')}"` : '') +
        `>${parsedSvg.svg_content}</symbol>`;
      icons_list.push(parsedSvg.filename);
    }
  );

  // symbols store
  if (symbols_str) {
    symbols_str = (cfg.symbols.add_xml_declaration? '<?xml version="1.0" encoding="UTF-8"?>' : '') +
      (cfg.symbols.add_svg_doctype? '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' : '') +
      '<svg xmlns="http://www.w3.org/2000/svg"' + (cfg.symbols.add_hidden_attribute? ' hidden="hidden"' : '') + '>' +
        symbols_str +
      '</svg>';
    const dest = path.resolve(cfg.work_dir, cfg.symbols.dest_file),
      folderName = path.dirname(dest);
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName, {recursive: true});
    }
    fs.writeFileSync(path.resolve(cfg.work_dir, cfg.symbols.dest_file), symbols_str);

    printResult(`\nSVG to symbols: ${fileCount} SVG files processed`);

  } else {
    printResult('\nSVG to symbols: no files processed', 'infoDim');
  }


  // icons list
  const icon_list_var_string = 'const icons_list = ' + JSON.stringify(icons_list.sort(), null, '  ').replace(/"/g, '\'') + ';\n';
  if(fileCount && cfg.symbols.icons_list_file) {
    fs.writeFileSync(path.resolve(cfg.work_dir, cfg.symbols.icons_list_file),
      '// List of icon symbols\n' +
      '// NB: this is a generated file, any changes will be overwritten\n\n' +
      'export ' + icon_list_var_string
    );

    printResult(`Created icon list file: ${homedir_path_to_tilde(cfg.symbols.icons_list_file)}`, 'infoDim');
  }

  // demo file
  if(fileCount && cfg.symbols.demo_tpl_path && cfg.symbols.demo_file_path) {

    const tpl = fs.readFileSync(path.resolve(cfg.work_dir, cfg.symbols.demo_tpl_path), 'utf8');

    fs.writeFileSync(
      path.resolve(cfg.work_dir, cfg.symbols.demo_file_path),
      tpl.replace(/<!-- ?demo-data ?-->/,
        `<script>${icon_list_var_string}</script>${symbols_str}`
      )
    );

    printResult(`Created demo file: ${homedir_path_to_tilde(cfg.symbols.demo_tpl_path)}`, 'infoDim');
  }

}
