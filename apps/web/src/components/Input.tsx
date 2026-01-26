import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  name: string
}

const Input = ({ label, name, className = '', ...props }: InputProps) => {
  return (
    <label className="field">
      <span>{label}</span>
      <input className={`input ${className}`.trim()} name={name} {...props} />
    </label>
  )
}

export default Input
