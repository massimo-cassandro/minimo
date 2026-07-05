export function ArrowRightDownLineIcon({className, role, title, ...rest}) {
        return <svg viewBox="0 0 24 24"
          role={role? role : 'image'}
          aria-hidden={title? null : 'true'}
          className={['icona', 'fill-icon', ...(className? [className] : [])].join(' ') || null}
          {...rest}
          xmlns="http://www.w3.org/2000/svg"
        >
          {title && <title>{title}</title>}
          <path d="M14.5895 16.0032L5.98291 7.39664L7.39712 5.98242L16.0037 14.589V7.00324H18.0037V18.0032H7.00373V16.0032H14.5895Z"/>
        </svg>;
      }