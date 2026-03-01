const config = {
  /*
    Configurazione per `update-version`
    Nessun parametro è obbligatorio
  */
  updateVersion: {
    twigVarsFile     : null,   // default null
    htmlFiles        : null,   // default null
    skipDescrPrompt  : false,  // default false
    patchOnly        : false,  // default false
    defaultDescr     : null    // default null
  },

  /*
    Configurazione per `vscode-css-properties-list`
    (deprecato)
  */
  // cssPropsList: {

  //   sources: [
  //     './test/vscode-css-custom-properties-list/test.css'
  //   ],
  //   snippet_file           : './vscode/myproject.code-snippets',
  //   result_test_file       : '',
  //   snippet_key            : 'custom props list',
  //   custom_var_prefix      : ['prefix-'],
  //   icon_sources: [],
  //   icon_list_snippet_key  : 'icons list'

  // }
};

export default config;
