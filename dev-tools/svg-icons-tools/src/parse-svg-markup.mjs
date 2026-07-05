import { optimize } from 'svgo';
import { configManager } from './config-manager.mjs';
import * as fs from 'fs';

// https://svgo.dev/docs/introduction/
export function parseSvgMarkup(filepath, svg_type, custom_svgo_config = null) {
  const cfg = configManager.getCfg();

  let svgString = fs.readFileSync(filepath, 'utf8');


  // remove pallets
  cfg.pallets.forEach(pallet => {
    svgString = svgString.replace(pallet, '');
  });

  // if present, custom_svgo_config ovverrides cfg.svgo_config
  const optimized = optimize(svgString, custom_svgo_config? custom_svgo_config : cfg.svgo_config),
    icon_type_class = svg_type? cfg.icon_type_class?.[svg_type]?? null : null,
    classes = icon_type_class? [icon_type_class] : [];

  // extracting viewbox
  const viewbox = optimized.data.match(/viewBox=(?:"|')(\d+ \d+ \d+ \d+)(?:"|')/mi)[1];

  // duotone classes
  if(Object.keys(cfg.opacity_classes?? {}).length) {
    optimized.data = optimized.data.replace(/(?:fill-)?opacity=(?:'|")0?\.(\d+)(?:'|")/g, (match, p1) => {
      const opacity_value = Math.round(+((p1 + '000').slice(0, 3)) / 100);

      let opacity_key = Object.keys(cfg.opacity_classes).reduce((prev, curr) => {
        curr = +curr;
        return (Math.abs(curr - opacity_value) < Math.abs(prev - opacity_value) ? curr : prev);
      });
      return `class='${cfg.opacity_classes[opacity_key]}'`;
    });
  }

  // non-square icons
  if(cfg.non_square_icons_classes.length ) {

    const getAspectRatio = (w, h) => Math.round(w / h * 100) / 100
      ,[,,width, height] = viewbox.split(' ')
    ;

    if(width !== height) {
      const aspect_ratio = getAspectRatio(+width, +height);

      const aspect_ratio_class_idx = cfg.non_square_icons_classes.map(i => getAspectRatio(i[0])).reduce((prev, curr, idx) => {
        curr = idx;
        const prev_value = prev !== null? cfg.non_square_icons_classes[prev][0] : 0;
        return Math.abs(cfg.non_square_icons_classes[curr][0] - aspect_ratio) < Math.abs(prev_value - aspect_ratio) ? curr : prev;
      }, null);

      classes.push(cfg.non_square_icons_classes[aspect_ratio_class_idx][1]);

    }
  }


  // extra classes are immediately assigned to the optimized svg markup
  if(classes.length) {
    optimized.data = optimized.data.replace(/<svg/, `<svg class="${classes.join(' ')}"`);
  }

  // get svg content
  const svg_content = optimized.data.match(/<svg(?:.*?)>(.*?)<\/svg>/mi)[1];

  return {
    svg: optimized.data,
    viewbox: viewbox,
    svg_content: svg_content,
    classes: classes,
    icon_type: svg_type // fill or stroke
  };
}
