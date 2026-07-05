import sharp from 'sharp';
import ico from 'sharp-ico';

// https://github.com/ssnangua/sharp-ico

export async function createIco(params) {

  await ico.sharpsToIco(
    [sharp(params.small_src_img?? params.src_img)],
    `${params.output_dir}/favicon.ico`,
    {
      sizes: [16, 32],
      // sizes: "default", // equal to [256, 128, 64, 48, 32, 24, 16]
      resizeOptions: {}, // sharp resize optinos
    }
  );

}
