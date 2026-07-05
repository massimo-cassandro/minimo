import { optimize } from 'svgo';
import * as fs from 'fs/promises';

export async function createSvg(params) {

  // TODO add extra config ???
  await fs.readFile(params.small_src_img?? params.src_img, { encoding: 'utf8' })
    .then(svgString => {

      const svg_result = optimize(svgString, { multipass: true});

      fs.writeFile(`${params.output_dir}/favicon.svg`, svg_result.data);

    });
}
