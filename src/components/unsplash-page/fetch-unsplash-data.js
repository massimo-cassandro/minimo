
export async function fetchUnsplashData(settings) {

  const default_settings = {
    unsplash_data_url: null
  };

  settings = {...default_settings, ...settings};

  try {

    if(!settings.unsplash_data_url) {
      throw new Error( 'Unsplash data url must be defined' );
    }

    const imgData = await (async () => {
      const response = await fetch(settings.unsplash_data_url);
      if (!response.ok) {
        /* eslint-disable no-console */
        console.error('Ajax error on: ' + settings.unsplash_data_url);
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
