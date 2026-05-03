import React, { useEffect, useRef } from 'react';
import { useRouteError, Link } from 'react-router-dom';


import { unsplashPageJS } from '@massimo-cassandro/unsplash-page';
import './custom-css-props-template.css';
import '@massimo-cassandro/unsplash-page/src/unsplash-page-body-reset.css';
import styles from '@massimo-cassandro/unsplash-page/src/unsplash-page.module.css';


export default function ErrorPage() {
  const error = useRouteError()
    ,upContainer = useRef(null)
    ,errorTypes = {
      403: {
        title: 'Access denied',
        text: null
      },
      404: {
        title: 'Page not found',
        text: 'The page you requested is not present on this site. Check the link and try again'
      },
      500: {
        title: 'Server error',
        text: `${error.data}${error.status? ` (${error.status})`: ''}`
      },
      503: {
        title: 'Server not available',
        text: null
      }
    }
    ,thisError = errorTypes[error.status]
  ;


  useEffect(() => {
    if(process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(error);
    }


    unsplashPageJS({
      targetElement    : upContainer.current,
      unsplashDataUrl  : '__your_api_url__',
      utmSource        : '__your_utm_source__',
      title            : thisError.title,
      text             : thisError.text,
      backLink         : error.status !== '503'? `<p>Back to <a href="/">Home page</a></p>` : null,
      hidePhotoLink    : true,
      cssModulesObj    : styles
    });


  }, [error, thisError]);


  return <div ref={upContainer}></div>;
}
