/* plugins/inline-critical-css.mjs */
import HtmlWebpackPlugin from 'html-webpack-plugin';

export class InlineCriticalCssPlugin {
  constructor({ match }) {
    this.match = match;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('InlineCriticalCssPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
        'InlineCriticalCssPlugin',
        (data, callback) => {
          const isTarget = (tag) =>
            tag.tagName === 'link' && this.match(tag.attributes.href);

          const linkTag = [...data.headTags, ...data.bodyTags].find(isTarget);

          if (linkTag) {
            const publicPath = compilation.outputOptions.publicPath || '';
            const assetName = linkTag.attributes.href.replace(publicPath, '');
            const source = compilation.assets[assetName]?.source();

            if (source) {
              const styleTag = {
                tagName: 'style',
                voidTag: false,
                innerHTML: source,
                attributes: {},
              };
              data.headTags = data.headTags.filter((t) => !isTarget(t)).concat(styleTag);
              data.bodyTags = data.bodyTags.filter((t) => !isTarget(t));
            }
          }

          callback(null, data);
        }
      );
    });
  }
}
