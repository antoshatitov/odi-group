import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) => {
  const variantClass = `btn-${variant}`
  const sizeClass = size === 'md' ? '' : `btn-${size}`
  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    />
  )
}

export default Button
