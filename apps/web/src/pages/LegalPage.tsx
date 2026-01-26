import { useEffect } from 'react'

import Card from '../components/Card'
import Container from '../components/Container'
import Section from '../components/Section'

type LegalPageProps = {
  title: string
  updated: string
  children: React.ReactNode
}

const LegalPage = ({ title, updated, children }: LegalPageProps) => {
  useEffect(() => {
    document.title = `${title} — ОДИ`
  }, [title])

  return (
    <Section className="legal-page">
      <Container>
        <Card>
          <div className="stack">
            <span className="eyebrow">Правовая информация</span>
            <h1 className="h2">{title}</h1>
            <span className="muted">Обновлено: {updated}</span>
            <div className="divider" />
            <div className="stack" style={{ gap: 'var(--space-4)' }}>
              {children}
            </div>
          </div>
        </Card>
      </Container>
    </Section>
  )
}

export default LegalPage
