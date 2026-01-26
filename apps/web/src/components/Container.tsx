import type { HTMLAttributes, ReactNode } from 'react'

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: 'default' | 'wide'
  children: ReactNode
}

const Container = ({ size = 'default', className = '', children, ...props }: ContainerProps) => {
  const sizeClass = size === 'wide' ? 'container-wide' : 'container'
  return (
    <div className={`${sizeClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

export default Container
