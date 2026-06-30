import { ajax_config_default } from './js/defaults.js';

export async function initAjaxTable(){

  try {

    if(!this.params.ajaxUrl) {
      throw 'Missing `ajaxUrl` parameter';
    }

    if(this.params.ajaxConfig === null) {
      this.params.ajaxConfig = structuredClone(ajax_config_default);

    } else {

      Object.keys(ajax_config_default).forEach(k => {
        this.params.ajaxConfig[k] = {
          ...ajax_config_default[k],
          ...(this.params.ajaxConfig[k]?? {})
        }
      });
    }

  } catch(e) {
    console.error( e ); // eslint-disable-line

  }


}
