import type { HTMLAttributes, ReactNode } from 'react'

type SectionProps = HTMLAttributes<HTMLElement> & {
  tone?: 'default' | 'toned' | 'ink'
  children: ReactNode
}

const Section = ({ tone = 'default', className = '', children, ...props }: SectionProps) => {
  const toneClass =
    tone === 'toned' ? 'section-toned' : tone === 'ink' ? 'section-ink' : ''
  return (
    <section className={`section ${toneClass} ${className}`.trim()} {...props}>
      {children}
    </section>
  )
}

export default Section
