import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'solid'
  children: ReactNode
}

const Card = ({ tone = 'default', className = '', children, ...props }: CardProps) => {
  const toneClass = tone === 'solid' ? 'card-solid' : ''
  return (
    <div className={`card ${toneClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

export default Card
