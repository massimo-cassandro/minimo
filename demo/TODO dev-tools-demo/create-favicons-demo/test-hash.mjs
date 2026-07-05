import * as fs from 'fs';
import { createHash } from 'node:crypto'

async function getHash(path) {
/*
  const fileHash = await new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const rs = fs.createReadStream(path);
    rs.on('error', reject);
    rs.on('data', chunk => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
 */

  let fileHash;
  const hash = createHash('sha256');
  const reader = await fs
    .createReadStream(path)
    .on("data", chunk => hash.update(chunk))
    .on("end", () => {
      return hash.digest('hex');
    })

  reader.then(result => fileHash = result)
  return fileHash;
}


console.log(getHash('./favicons-output/icon-512.png'));
console.log(getHash('./favicons-output/icon-192.png'));
