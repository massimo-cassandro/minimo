/**
 * jsx_icon_file_builder
 *
 * Function to create JSX icon files
 *
 * The `parsed_svg` argument is the object returned by the parse function
 * and contains:
 *  - svg: the whole optimized svg markup (including the svg tag),
 *  - viewbox: the viewbox attribute content,
 *  - svg_content: the optimized svg markup without the svg tag)
 *  - classes: the aspect ratio class as per the `non_square_icons_classes` parameter and or
 *             the 'fill` or `stroke` class as per the `icon_type_class` parameter
 *  - icon_type: icon type string: `fill` or `stroke`
 *  - filename: the name of the svg file without extension and with the `remove_prefix` strings removed
 *  - filename_camel_case: the filename in camel case (nb: dashes follewed ny numbers are converted to underscores)
 *  - filename_pascal_case: similar to `filename_camel_case` but with the first letter capitalized
 *
 * The function must return an object with the following properties:
 *  - component_name: the name of the component
 *  - jsx_content: the jsx content of the component
 *  - filename: the name of the jsx file (including extension) to be saved (default: `component_name` + '.jsx')
 *
 *
 * NB: Since it is assumed that most attributes in the svg content have been removed
 * during optimization, no further cleanup is performed IN THIS VERSION and therefore it is not guaranteed
 * that `parsed_svg.content` is valid JSX markup.
 * If you decide to keep some attributes in the SVGO options, you should check the svg content and, if possible,
 * modify the function accordingly. In the function below, the `replace` method,
 * applied to `parsed_svg.svg_content`, is an example of how to temporarily solve this problem.
 *
 * NB: this release doesn't include any prettify feature.
 *
 * @param {*} parsed_svg
 * @returns
 */

// TODO add prettify feature
// TODO svg to jsx

export function jsx_icon_file_builder(parsed_svg) {

  // adding `Icon` suffix to the component name
  const component_name = `${parsed_svg.filename_pascal_case}Icon`;

  return {
    component_name: component_name,
    filename: `${component_name}.jsx`,
    jsx_content:
      `export function ${component_name}({className, role, title, ...rest}) {
        return <svg viewBox="${parsed_svg.viewbox}"
          role={role? role : 'image'}
          aria-hidden={title? null : 'true'}
          className={['icona', ${parsed_svg.classes.map(cls => `'${cls}'`)?? []}, ...(className? [className] : [])].join(' ') || null}
          {...rest}
          xmlns="http://www.w3.org/2000/svg"
        >
          {title && <title>{title}</title>}
          ${parsed_svg.svg_content.replace(/ class=/g, ' className=').replace(/ fill-rule=/g, ' fillRule=')}
        </svg>;
      }`
  };
}
