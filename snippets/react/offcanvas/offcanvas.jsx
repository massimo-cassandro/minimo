/**
* Offcanvas
*
*
*/


import { useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './offcanvas.module.scss';

// https://react-icons.github.io/react-icons/icons/pi/
import { PiXCircleBold } from 'react-icons/pi';


function Offcanvas(props) {
  const [isHiding, setIsHiding] = React.useState(false),
    [isShowing, setIsShowing] = React.useState(props.show),
    [content, setContent] = React.useState();

  React.useEffect(() => {

    // disable body scroll
    document.body.classList.toggle('no-scroll', props.show);

    if(props.show) {
      setIsShowing(true);
    }
  }, [props.show]);

  useEffect(() => {
    setContent(
      <div
        role="dialog"
        aria-modal="true"
        className={classnames(
          styles.offcanvas,
          props.className,
          {
            [styles.fullscreen]: props.fullscreen,
            [styles.show]: props.show,
            [styles.hiding]: isHiding,
            [styles.showing]: isShowing
          }
        )}
        tabIndex="-1"
        onTransitionEnd={() => {setIsHiding(false); setIsShowing(false);}}
      >
        <div className={styles.offcanvasInner}>
          <div className={styles.offcanvasHeader}>
            <button
              type="button"
              className={styles.offcanvasClose}
              aria-label="Close"
              onClick={() => {
                setIsHiding(true);
                props.offcanvasShowHandler(props.handlerHideValue);
              }}
            ><PiXCircleBold /></button>
          </div>
          <div className={styles.offcanvasBody}>
            {props.children}
          </div>
        </div>
      </div>
    );
  }, [isHiding, isShowing, props]);

  return (content);
}

// https://www.npmjs.com/package/prop-types

Offcanvas.propTypes = {
  className: PropTypes.string,
  offcanvasShowHandler: PropTypes.func,
  show: PropTypes.bool,
  fullscreen: PropTypes.bool,
  handlerHideValue: PropTypes.any

};
Offcanvas.defaultProps = {
  show: false,
  fullscreen: false,
  handlerHideValue: false
};

export default Offcanvas;
