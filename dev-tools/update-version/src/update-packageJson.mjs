
import * as fs from 'fs';

import { params } from './params.mjs';

export function updatePackageJson() {

  params.packageJsonObj.version = params.newSemver;
  fs.writeFileSync(params.packageJsonFile, JSON.stringify(params.packageJsonObj, null, '  '));
}
