import { default_params } from './default-params.mjs';
import * as path from 'path';
import * as fs from 'fs';

export function parseParams(config_params = null, work_dir = process.cwd()) {

  try {

    const params = {...default_params, ...(config_params??{})}
    params.work_dir = work_dir;
    params.manifest_file_name = 'manifest.webmanifest';

    // ejs overrides
    if(params.snippet_language === 'ejs') {
      params.manifest_file_name = 'manifest.webmanifest.ejs';
      params.webmanifest_add_hash_to_files = false;
      params.create_snippet = true;
      params.snippet_name = 'favicons.incl.ejs';
      params.snippet_target_file = null;
      params.snippet_path = params.output_dir;
      params.add_cache_buster = false

    }
    [
      'src_img',
      'small_src_img',
      'snippet_path',
      'snippet_target_file',
      'output_dir'
    ].forEach(item =>
      params[item] = params[item]? path.resolve(params.work_dir, params[item]) : null
    );

    // creazione dir output se non esiste
    if (!fs.existsSync(params.output_dir)){
      fs.mkdirSync(params.output_dir);
    }

    // definizione snippet_path e creazione dir se necessario
    params.create_snippet = params.snippet_name || params.snippet_target_file;

    if(params.create_snippet) {

      params.snippet_path = params.snippet_path?? params.output_dir;

      if (!params.snippet_target_file && !fs.existsSync(params.snippet_path )){
        fs.mkdirSync(params.snippet_path );
      }

      params.snippet_language = params.snippet_language.toLowerCase();
    }



    return params;

  } catch(e) {
    console.error( e ); // eslint-disable-line
  }

}
