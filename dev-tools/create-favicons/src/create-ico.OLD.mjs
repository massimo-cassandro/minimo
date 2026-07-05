import * as fs from 'fs';
import sharp from 'sharp';
import toIco from 'to-ico';


// https://github.com/kevva/to-ico
// alternativa: https://github.com/steambap/png-to-ico

// const ico_source = fs.readFileSync(`${output_dir}/apple-touch-icon.png`);

export async function createIco(params) {

  await sharp(params.small_src_img?? params.src_img)
    // .png()
    // .then(info => console.log(info))
    .toBuffer()
    .then(bufferData => {

      toIco([bufferData], {
        sizes: [16, 32],
        resize: true
      }).then( async result => {
        await fs.promises.writeFile(`${params.output_dir}/favicon.ico`, result, {
            encoding: "utf8",
            flag: "w",
            mode: 0o666
        });
      });

    })
    .catch(err => { throw new Error( err + ' (createIco)'); });
}
