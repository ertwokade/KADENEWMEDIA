import { createElement } from 'react'
import './BentoGrid.css'

export function BentoGrid({ children, className = '' }) {
  return <div className={`bento-grid ${className}`}>{children}</div>
}

export function BentoCell({
  children,
  span = 'sm',
  accent = false,
  as: Tag = 'div',
  className = '',
  ...rest
}) {
  return createElement(
    Tag,
    {
      className: `bento-cell bento-cell--${span} ${accent ? 'bento-cell--accent' : ''} ${className}`,
      ...rest,
    },
    children
  )
}

export default BentoGrid
