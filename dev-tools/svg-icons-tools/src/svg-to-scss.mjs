import * as path from 'path';
import * as fs from 'fs';
import { configManager } from './config-manager.mjs';
import { parseSvgMarkup } from './parse-svg-markup.mjs';
import { parseSvgFilename } from './parse-svg-filename.mjs';
import { printResult } from './print-result.mjs';
import { homedir_path_to_tilde } from './homedir-path-to-tilde.mjs';

export function svg_to_scss() {

  const cfg = configManager.getCfg();
  let svg_to_scss_array = [], fileCount = 0, skipped = 0;

  if(cfg.svg_to_scss.files.length && cfg.svg_to_scss.scss_icons_file) {

    cfg.svg_to_scss.files.forEach(file => {

      const file_path = path.resolve(cfg.work_dir, file);

      if(fs.existsSync(file_path)) {
        const parsedSvg = parseSvgMarkup(file_path)
          ,filename = parseSvgFilename(path.basename(file_path))
        ;

        let svg_string = parsedSvg.svg;

        if(cfg.svg_to_scss.convert_to_css_url) {
          svg_string = 'url("data:image/svg+xml;charset=utf8,' +
            svg_string.replaceAll('"', '\'')
              .replaceAll('<', '%3C')
              .replaceAll('>', '%3E')
              .replaceAll('&', '%26')
              .replaceAll('#', '%23') +
            '")';

        } else {
          svg_string = `'${svg_string.replace(/'/g, '\\\'')}'`;
        }


        svg_to_scss_array.push(`$${cfg.svg_to_scss?.varname_prefix?? ''}${filename}: ${svg_string};`);

        fileCount++;

      } else {
        skipped++;
      }

    });



    const dest = path.resolve(cfg.work_dir, cfg.svg_to_scss.scss_icons_file);

    fs.writeFileSync(
      dest,
      '// Generated file, don\'t edit\n\n' +
      svg_to_scss_array.join('\n')
    );

    printResult(`\nSVG to scss variables: ${fileCount} SVG files processed`);
    printResult(`\nSCSS icons variables file saved to ${homedir_path_to_tilde(dest)}`, 'infoDim');
    if(skipped) {
      printResult( `SVG to scss variables: ${skipped} SVG file${skipped > 1? 's were' : ' was'} not found`, 'warning' );
    }

  } else {

    printResult('SVG to scss variables: no files processed', 'infoDim');
  }

}
