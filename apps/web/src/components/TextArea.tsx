import type { TextareaHTMLAttributes } from 'react'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  name: string
}

const TextArea = ({ label, name, className = '', ...props }: TextAreaProps) => {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea className={`textarea ${className}`.trim()} name={name} {...props} />
    </label>
  )
}

export default TextArea
