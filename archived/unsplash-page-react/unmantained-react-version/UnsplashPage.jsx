/**
 * Unsplash-page
 * A component displaying a full page photo from Unsplash showing some message (useful for error pages)
 *
 * @property {string} unsplashDataUrl - the url providing the image data json from unsplash
 * @property {string} utmSource - UTM source (url encoded) for credits links
 * @property {string} title - message title. It's wrapped in a `h1` tag.
 * @property {string} text - message text. If a string, it's wrapped in a `p` tag, otherwise in a `div`
 * @property {string} backLink - Optional react element for displaying a link. It's wrapped in a `p.backLink` tag
 * @property {string} className - Optional class to add to the outer container.
 *  It can be used to create custom CSS properties to customize colors, fonts, etc. (see readme)
 * @property {boolean} hidePhotoLink - if `true`` (default) the icon (in the top right corner)
 *  with the link to the original image on Unsplash is only shown on mouse hover. On touch devices the icon is always visible
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
// import classnames from 'classnames';
import styles from './unsplash-page.module.scss';
import { breakpoints } from '../src/src/img-breakpoints';
import { BlurhashCanvas } from 'react-blurhash';
import { nanoid } from 'nanoid';

import imageIcon from './icons/image-duotone.svg';
import arrowIcon from './icons/arrow-fat-lines-left-duotone.svg';

import { fetchUnsplashData } from '../src/src/fetch-unsplash-data';

// https://www.npmjs.com/package/html-react-parser
// import htmlParser from 'html-react-parser';



function UnsplashPage(props) {
  const [loaderContent, setLoaderContent] = React.useState(null)
    ,[content, setContent] = React.useState(null)
    ,containerRef = React.useRef()
  ;

  React.useEffect(() => {
    // disable scroll
    document.body.classList.add(styles.bodyNoScroll);
  }, []);

  React.useEffect(() => {

    setLoaderContent(<div className={styles.loaderWrapper}><div className={styles.loader}></div></div>);

    fetchUnsplashData({unsplash_data_url: props.unsplashDataUrl})
      .then(photo => {

        // blurhash
        // https://blurha.sh/
        // https://github.com/woltapp/blurhash
        // https://github.com/woltapp/blurhash/tree/master/TypeScript
        // https://github.com/mad-gooze/fast-blurhash
        // https://blog.scaleflex.com/the-ultimate-guide-to-fast-loading-websites-with-blurhash/
        // https://codesandbox.io/s/blurhash-preview-forked-70zbjx


        // https://docs.imgix.com/apis/rendering/format/fm
        const formats = ['avif', 'webp', 'pjpg']; // `fm` parameter, in order of use

        // https://github.com/woltapp/react-blurhash
        setContent(<>
          <BlurhashCanvas
            hash={photo.blur_hash}
            width={32}
            height={32}
            punch={1}
            className={styles.canvas}
          />
          <picture>
            {breakpoints.map((brk, idx) => {

              const is_last_brk = idx === breakpoints.length - 1;
              return formats.map(fmt => {
                const is_default_fmt = fmt === formats.at(-1);

                // https://unsplash.com/documentation#supported-parameters
                // https://docs.imgix.com/apis/rendering/size/w
                // https://docs.imgix.com/apis/rendering/size/h
                // https://docs.imgix.com/apis/rendering/size/ar
                // https://docs.imgix.com/apis/rendering/size/fit
                // https://docs.imgix.com/apis/rendering/size/crop
                // https://docs.imgix.com/apis/rendering/format/q

                const url = photo.base_url + (/\?/.test(photo.base_url)? '&' : '?') +
                  'fit=crop&crop=focalpoint' + // top, bottom, left, right, faces, focalpoint, edges, and entropy
                  '&q=60' +
                  `&w=${brk.w}&h=${brk.h}` +
                  `&fm=${fmt}`,

                  srcsetUrl = url + (brk.dpr2? ` 1x, ${url}&dpr=2 2x` : '');

                if(is_last_brk && is_default_fmt) {

                  return <img
                    key={nanoid()}
                    src={url}
                    srcSet={srcsetUrl}
                    alt={photo.alt_description?? `${photo.author} / Unsplash`}
                    width={brk.w}
                    height={brk.h}
                    className={styles.unsplashPhoto}
                    onLoad={ () => {
                      setLoaderContent(null);
                      containerRef.current.classList.add(styles.show);
                    }}
                  />;

                } else {

                  return <source
                    key={nanoid()}
                    srcSet={srcsetUrl}
                    type={!is_default_fmt? `image/${fmt}` : null}
                    media={brk.mq}
                    width={brk.w}
                    height={brk.h}
                  />;
                }
              });
            })}
          </picture>

          <div className={styles.messageBox}>
            {/* =>> message */}
            <div className={styles.message}>
              <h1>{props.title}</h1>
              {props.text? (React.isValidElement(props.text)? <div>{props.text}</div>: <p>{props.text}</p>): null}
              {props.backLink && <p className={styles.backLink}>{props.backLink}</p>}

              <div className={styles.arrowWrapper}
                role="button"
                onClick={e => {
                  e.target.closest(`.${styles.message}`).classList.toggle(styles.hidden);
                }}
              >
                <img src={arrowIcon} alt="Icona freccia" />
              </div>
            </div>
            {/* =>> credits */}
            <div className={styles.credits}>
              <em>{photo.image_description}</em>
              <span>Photo {' '}
                <a href={`${photo.author_profile}?utmSource=${props.utmSource}&utm_medium=referral`}>
                  {photo.author} / Unsplash
                </a>
              </span>
            </div>
          </div>
          <div className={`${styles.unsplashPhotoLink}${props.hidePhotoLink? ` ${styles.showOnHover}` : ''}`}>
            <a href={`${photo.unsplash_url}?utm_source=${props.utmSource}&utm_medium=referral`} target="_blank" rel="noopener noreferrer">
              <img src={imageIcon} alt="Icona immagine" />
            </a>
          </div>
        </>);
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
      });

  }, [props.backLink, props.hidePhotoLink, props.text, props.title, props.unsplashDataUrl, props.utmSource]);


  return <div className={`${styles.container}${props.className? ` ${props.className}` : ''}`} ref={containerRef}>
    {content}
    {loaderContent}
  </div>;
}

// https://www.npmjs.com/package/prop-types

UnsplashPage.propTypes = {
  unsplashDataUrl  : PropTypes.string.isRequired,
  utmSource        : PropTypes.string.isRequired,
  title            : PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  text             : PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  backLink         : PropTypes.element,
  cssProps         : PropTypes.object,
  hidePhotoLink    : PropTypes.bool
};
UnsplashPage.defaultProps = {
  hidePhotoLink: true
};

export default UnsplashPage;
