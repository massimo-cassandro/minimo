import * as fs from 'fs';

export async function createSnippet(params) {


  if(params.create_snippet) {

    let snippet_content;

    if (params.snippet_language === 'ejs') {

      snippet_content = '<link rel="icon" href="<%= require(\'./favicon.ico\') %>" sizes="32x32"/>\n' +
        '<link rel="icon" href="<%= require(\'./favicon.svg\') %>" type="image/svg+xml"/>\n' +
        '<link rel="apple-touch-icon" href="<%= require(\'./apple-touch-icon.png\') %>"/>\n' +
        '<link rel="manifest" href="./manifest.webmanifest"/>';

        //'\n<!-- <link rel="manifest" href="<%= require(\'./manifest.webmanifest.ejs\')() %>"/> -->';

    } else {

      const cache_buster = params.add_cache_buster? `?_=${Date.now()}` : '',
        create_href = nome_file => params.href_template.replace('%_file_name_%', nome_file)
          .replace('%_cache_buster_%', cache_buster);


      snippet_content = `<link rel="icon" href="${create_href('favicon.ico')}" sizes="32x32"/>\n` +
        `<link rel="icon" href="${create_href('favicon.svg')}" type="image/svg+xml"/>\n` +
        `<link rel="apple-touch-icon" href="${create_href('apple-touch-icon.png')}"/>\n` +
        `<link rel="manifest" href="${create_href('manifest.webmanifest')}"/>`;

      if (params.snippet_language === 'pug') {
        snippet_content = snippet_content.replace(/<link (.*?)\/?>/g, 'link($1)');
      }

    }

    snippet_content = params.snippet_template.replace('%_link_tags_%', snippet_content);

    if (params.snippet_target_file) {

      if (fs.existsSync(params.snippet_target_file)) {
        const targetFileContent = fs.readFileSync(params.snippet_target_file, 'utf8'),
          regexp = /<!-- ?favicon-snippet-start ?-->(.*?)<!-- ?favicon-snippet-end ?-->/mis;

        fs.promises.writeFile(params.snippet_target_file,
          targetFileContent.replace(regexp,
            `<!-- favicon-snippet-start -->\n${snippet_content}\n<!-- favicon-snippet-end -->`
          )
        );

      } else {
        throw new Error( `Il file '${params.snippet_target_file}' non esiste` );
      }

    } else {

      fs.promises.writeFile(
        `${params.snippet_path}/${params.snippet_name}`,
        snippet_content
      );

    }
  }
}
