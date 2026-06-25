
/**
 * @typedef {Object} UnsplashPhoto
 * @property {string} id
 * @property {string} color
 * @property {number} width
 * @property {number} height
 * @property {string} alt_description
 * @property {string} date
 * @property {string} base_url
 * @property {string} unsplash_url
 * @property {string} author
 * @property {string} author_profile
 * @property {string} blur_hash
 * @property {string} image_description
 */

/**
 * Fetches and normalises Unsplash photo data from the given URL.
 * @param {{ unsplash_data_url: string | null }} settings
 * @returns {Promise<UnsplashPhoto | undefined>}
 */
export async function fetchUnsplashData(settings) {

  const default_settings = {
    unsplash_data_url: null
  };

  settings = {...default_settings, ...settings};

  try {

    if(!settings.unsplash_data_url) {
      throw new Error( 'Unsplash data url must be defined' );
    }

    const url = settings.unsplash_data_url; // const preserves narrowing inside the IIFE closure

    const imgData = await (async () => {
      const response = await fetch(url);
      if (!response.ok) {
        /* eslint-disable no-console */
        console.error('Ajax error on: ' + url);
        console.error(response);
        /* eslint-enable no-console */
        throw new Error( `Loading error: ${response.status}` );
      }
      const data = await response.json();
      return data;
    })()
      .then(data => {

        // console.log(data);

        // used data
        return {
          id                 : data.id,
          color              : data.color,
          width              : data.width,
          height             : data.height,
          // description        : data.description,
          // location           : data.location.name,
          alt_description    : data.alt_description,
          date               : data.created_at,
          base_url           : data.urls.raw,
          unsplash_url       : data.links.html,
          author             : data.user.name?? data.user.username,
          author_profile     : data.user.links.html,
          blur_hash          : data.blur_hash,
          image_description  : (() => {
            let location = data.location.name,
              description = data.description?? data.alt_description;
            if(data.description && location) {
              location = (new RegExp(location, 'i')).test(description)? null : location;
            }
            return [description, location]
              .filter(i => i != null).join (' / ');
          })()

        };
      });

    return imgData;

  } catch(e) {
    console.error( e ); // eslint-disable-line
  }
}
