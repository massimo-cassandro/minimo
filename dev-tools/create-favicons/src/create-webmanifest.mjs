// web manifest

// import * as fs from 'fs/promises';
import * as fs from 'fs';
import { createHash } from 'node:crypto'


async function getHash(path) {

  const fileHash = await new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const rs = fs.createReadStream(path);
    rs.on('error', reject);
    rs.on('data', chunk => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
  })

  return fileHash;
}

export async function createWebmanifest(params) {

  const sizes = [192, 512];

  let files = {};
  for await (const size of sizes) {

    if(params.snippet_language === 'ejs') {
      files[size] = `<%= require('./icon-${size}.png') %>`;

    } else if(params.webmanifest_add_hash_to_files) {
      const hashValue = await getHash(`${params.output_dir}/icon-${size}.png`);
      files[size] = `./icon-${size}.png?_=${hashValue}`;

    } else {
      files[size] = `./icon-${size}.png`;
    }

  }

  const manifest = {
    icons: sizes.map( size => {

      return {
        src: files[size],
        type: 'image/png',
        sizes: `${size}x${size}`
      };
    }),
    ...(params.webmanifest_extra?? {})
  };

  // await fs.writeFile(`${params.output_dir}/manifest.webmanifest`, JSON.stringify(manifest, null, ' '));

  await fs.writeFile(
    `${params.output_dir}/${params.manifest_file_name}`,
    JSON.stringify(manifest, null, ' '),
    (err) => {
      if (err) {throw err}
      // console.log('The file has been saved!');
    }
  );

}
