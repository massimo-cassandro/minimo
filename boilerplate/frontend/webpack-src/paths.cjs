const path = require('path');

exports.paths = {
  webpack_config: path.resolve(__dirname, '../webpack.config.cjs'),
  jsconfig: path.resolve(__dirname, '../../jsconfig.json'),
  packageJson: path.resolve(__dirname, '../../package.json')
};
