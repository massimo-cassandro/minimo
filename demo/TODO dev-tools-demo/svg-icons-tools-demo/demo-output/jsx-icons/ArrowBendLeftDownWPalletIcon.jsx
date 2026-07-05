export function ArrowBendLeftDownWPalletIcon({className, role, title, ...rest}) {
        return <svg viewBox="0 0 256 256"
          role={role? role : 'image'}
          aria-hidden={title? null : 'true'}
          className={['icona', 'stroke-icon', ...(className? [className] : [])].join(' ') || null}
          {...rest}
          xmlns="http://www.w3.org/2000/svg"
        >
          {title && <title>{title}</title>}
          <polyline points="152 176 104 224 56 176"/><path d="M200,32a96,96,0,0,0-96,96v96"/>
        </svg>;
      }