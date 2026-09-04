import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
  backTo?: string
}

export function PageHeader({ eyebrow, title, description, action, backTo }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__main">
        {backTo && (
          <Link to={backTo} className="page-header__back" aria-label="กลับ">
            &#8592;
          </Link>
        )}
        <div className="page-header__content">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      {action ? <div className="page-header__action">{action}</div> : null}
    </header>
  )
}
