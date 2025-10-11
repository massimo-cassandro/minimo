// aliases from jsconfig

const path = require('path');
const { paths } = require('./paths.cjs');

const jsConfig = require(paths.jsconfig);

const aliases = {};
for(const item in jsConfig.compilerOptions.paths) {

  const key = item.replace(/(\/\*)$/, ''),
    value = path.resolve(
      paths.webpack_config,
      path.relative(paths.webpack_config, jsConfig.compilerOptions.paths[item][0]
    )
      .replace(/(\/\*)$/, ''));

  aliases[key] = value;
}
// console.log(aliases);


exports.jsConfigAliases = aliases;

