import sharp from 'sharp';

export async function createPng(params) {

  // https://sharp.pixelplumbing.com/api-constructor
  // https://sharp.pixelplumbing.com/api-output#png
  await Promise.all([
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512]
  ].map(file => {
    sharp(params.src_img)
      .resize({ width: file[1], fit: 'inside' })
      .png(params.png_parameters)
      .toFile(`${params.output_dir}/${file[0]}`)

  }))
    .catch(err => { throw new Error( err ); });


}
