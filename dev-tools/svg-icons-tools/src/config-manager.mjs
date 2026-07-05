import default_config from './default-config.mjs';


export const configManager = {

  cfgObj: default_config,

  updCfg: function(cfg) {
    this.cfgObj = { ...this.cfgObj, ...cfg };

    // deep merge of cfg objects
    Object.keys(default_config).forEach((key) => {
      if (default_config[key] && typeof default_config[key] === 'object' && !Array.isArray(default_config[key])) {
        this.cfgObj[key] = { ...default_config[key], ...this.cfgObj[key] };
      }
    });
  },

  getCfg: function() {
    return this.cfgObj;
  }

};
