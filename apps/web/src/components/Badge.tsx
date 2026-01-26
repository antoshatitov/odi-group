import type { HTMLAttributes } from 'react'

type BadgeProps = HTMLAttributes<HTMLSpanElement>

const Badge = ({ className = '', ...props }: BadgeProps) => {
  return <span className={`badge ${className}`.trim()} {...props} />
}

export default Badge
