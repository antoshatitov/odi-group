import Container from '../components/Container'
import Section from '../components/Section'
import type { GalleryItem } from '../types'

type GallerySectionProps = {
  items: GalleryItem[]
  onOpenGallery: (item: GalleryItem) => void
}

const GallerySection = ({
  items,
  onOpenGallery,
}: GallerySectionProps) => {
  return (
    <Section id="gallery" tone="toned">
      <Container>
        <div className="stack" style={{ gap: 'var(--space-6)' }}>
          <div className="stack">
            <span className="eyebrow">Построено нами</span>
            <h2 className="h2">
              Реализованные объекты в Калининградской области
            </h2>
          </div>
          <div className="gallery-grid">
            {items.map((item) => (
              <button
                key={item.id}
                className="gallery-card"
                type="button"
                onClick={() => onOpenGallery(item)}
                aria-label={`Открыть галерею проекта ${item.title}`}
              >
                <div className="gallery-media">
                  <img src={item.cover.src} alt={item.cover.alt} loading="lazy" />
                  <div className="gallery-overlay">
                    <span>Смотреть фото</span>
                    <span>{item.photos.length} фото</span>
                  </div>
                </div>
                <div className="gallery-body">
                  <span className="gallery-location">{item.location}</span>
                  <h3 className="gallery-title">{item.title}</h3>
                  <p className="gallery-description">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  )
}

export default GallerySection
