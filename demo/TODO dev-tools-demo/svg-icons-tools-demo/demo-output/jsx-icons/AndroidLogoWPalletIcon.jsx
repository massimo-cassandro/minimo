export function AndroidLogoWPalletIcon({className, role, title, ...rest}) {
        return <svg viewBox="0 0 256 256"
          role={role? role : 'image'}
          aria-hidden={title? null : 'true'}
          className={['icona', 'stroke-icon', ...(className? [className] : [])].join(' ') || null}
          {...rest}
          xmlns="http://www.w3.org/2000/svg"
        >
          {title && <title>{title}</title>}
          <circle cx="164" cy="148" r="12"/><circle cx="92" cy="148" r="12"/><path d="M24,184V161.13C24,103.65,70.15,56.2,127.63,56A104,104,0,0,1,232,160v24a8,8,0,0,1-8,8H32A8,8,0,0,1,24,184Z"/><line x1="32" y1="48" x2="63.07" y2="79.07"/><line x1="224" y1="48" x2="193.1" y2="78.9"/>
        </svg>;
      }