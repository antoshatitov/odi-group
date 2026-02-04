import Card from '../components/Card'
import Container from '../components/Container'
import Section from '../components/Section'

type ServiceItem = {
  title: string
  text: string
}

type ServicesSectionProps = {
  services: ServiceItem[]
}

const ServicesSection = ({ services }: ServicesSectionProps) => {
  return (
    <Section id="services" tone="toned">
      <Container>
        <div className="stack" style={{ gap: 'var(--space-6)' }}>
          <div className="stack">
            <span className="eyebrow">Услуги</span>
            <h2 className="h2">Закрываем полный цикл строительства</h2>
          </div>
          <div className="services-grid">
            {services.map((service) => (
              <Card key={service.title} className="service-card">
                <strong>{service.title}</strong>
                <span className="muted">{service.text}</span>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  )
}

export default ServicesSection
