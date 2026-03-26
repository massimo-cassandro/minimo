// path relativi a questo file

const config = {
  custom_prop_file_path: '../../src/custom-properties-default.css', // percorso del file con le proprietà css
  dir_to_check: '../../src', // percorso della dire che include i css da analizzare
  exclude_pattern: [ // patterns per l'esclusione dal controllo di alcune proprietà
    /^--_/,
    /^--sf-macro-/,
    /^--malert-/,
  ]
};

export default config;
