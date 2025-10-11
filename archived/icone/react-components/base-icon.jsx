import classnames from 'classnames';
import PropTypes from 'prop-types';

function BaseIcon(props) {


  const attrs = Object.keys(props)
    .filter(key => !['title', 'className', 'children', 'fillIcon', 'ratio'].includes(key))
    .reduce((obj, key) => {
      obj[key] = props[key];
      return obj;
    }, {});

  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" role="img"
        {...attrs}
        className={classnames('icona', props.className, props.ratio, {'fill-icon': !!props.fillIcon})}>
        {props.title && <title>{props.title}</title>}
        {props.children}
      </svg>
    </>
  );
}

// https://it.reactjs.org/docs/typechecking-with-proptypes.html

BaseIcon.propTypes = {
  fillIcon: PropTypes.bool,
  ratio: PropTypes.string,
  viewBox: PropTypes.string
};
BaseIcon.defaultProps = {
  fillIcon: false,
  viewBox: '0 0 96 96'
};

export default BaseIcon;
