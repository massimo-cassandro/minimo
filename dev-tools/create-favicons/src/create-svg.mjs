import { optimize } from 'svgo';
import * as fs from 'fs/promises';

export async function createSvg(params) {

  // TODO add extra config ???
  const svgString = await fs.readFile(params.small_src_img?? params.src_img, { encoding: 'utf8' }),
    svg_result = optimize(svgString, { multipass: true});

  await fs.writeFile(`${params.output_dir}/favicon.svg`, svg_result.data);
}
