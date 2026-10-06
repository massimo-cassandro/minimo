/**
 * jsx_icon_file_builder
 *
 * Funzione per creare i file JSX delle icone
 *
 * L'argomento `parsed_svg` è l'oggetto restituito dalla funzione di parsing
 * e contiene:
 *  - svg: l'intero markup svg ottimizzato (incluso il tag svg),
 *  - viewbox: il contenuto dell'attributo viewbox,
 *  - svg_content: il markup svg ottimizzato senza il tag svg)
 *  - classes: la classe di aspect ratio in base al parametro `non_square_icons_classes` e/o
 *             la classe `fill` o `stroke` in base al parametro `icon_type_class`
 *  - icon_type: stringa con il tipo di icona: `fill` o `stroke`
 *  - filename: il nome del file svg senza estensione e senza le stringhe `remove_prefix`
 *  - filename_camel_case: il nome del file in camel case (nb: i trattini seguiti da numeri vengono convertiti in underscore)
 *  - filename_pascal_case: come `filename_camel_case` ma con la prima lettera maiuscola
 *
 * La funzione deve restituire un oggetto con le seguenti proprietà:
 *  - component_name: il nome del componente
 *  - jsx_content: il contenuto jsx del componente
 *  - filename: il nome del file jsx (estensione inclusa) da salvare (default: `component_name` + '.jsx')
 *
 *
 * NB: poiché si presume che la maggior parte degli attributi del contenuto svg sia stata rimossa
 * durante l'ottimizzazione, IN QUESTA VERSIONE non viene eseguita alcuna ulteriore pulizia e quindi non è garantito
 * che `parsed_svg.content` sia markup JSX valido.
 * Se si decide di mantenere alcuni attributi nelle opzioni di SVGO, bisogna verificare il contenuto svg e, se possibile,
 * modificare di conseguenza la funzione. Nella funzione qui sotto, il metodo `replace`,
 * applicato a `parsed_svg.svg_content`, è un esempio di come risolvere temporaneamente il problema.
 *
 * NB: questa release non include alcuna funzionalità di prettify.
 *
 * @param {*} parsed_svg
 * @returns
 */

// TODO add prettify feature
// TODO svg to jsx

export function jsx_icon_file_builder(parsed_svg) {

  // aggiunge il suffisso `Icon` al nome del componente
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
