import { useEffect, useMemo, useState } from 'react'

import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Container from '../components/Container'
import LeadForm from '../components/LeadForm'
import Modal from '../components/Modal'
import Section from '../components/Section'
import { galleryItems } from '../data/gallery'
import { projects } from '../data/projects'
import type { GalleryItem, Project } from '../types'
import { formatArea, formatPrice } from '../utils/format'

const services = [
  {
    title: 'Проектирование и адаптация',
    text: 'Создаём проект под ваш участок и бюджет, учитываем инсоляцию, геологию и нормы.',
  },
  {
    title: 'Строительство под ключ',
    text: 'Фундамент, коробка, кровля, инженерные сети и отделка — единый контракт и контроль.',
  },
  {
    title: 'Технический надзор',
    text: 'Проводим авторский надзор, фиксируем этапы, даём фотоотчёты и доступ к онлайн-графику.',
  },
  {
    title: 'Подбор материалов',
    text: 'Помогаем выбрать решения по энергоэффективности, шумоизоляции и фасадам.',
  },
  {
    title: 'Инженерные сети',
    text: 'Отопление, водоснабжение, вентиляция и электрика интегрированы в единую систему.',
  },
  {
    title: 'Сервис после сдачи',
    text: 'Сопровождение объекта и поддержка по гарантийным вопросам после ввода в эксплуатацию.',
  },
]

const steps = [
  {
    title: 'Заявка и встреча',
    text: 'Обсуждаем задачи, участок, бюджет и сроки. Подбираем проекты и решения.',
  },
  {
    title: 'Проект и смета',
    text: 'Готовим планировки, спецификацию и прозрачную смету по этапам.',
  },
  {
    title: 'Договор и график',
    text: 'Фиксируем сроки, этапы и ответственность. Назначаем персонального куратора.',
  },
  {
    title: 'Строительство',
    text: 'Ведём работы по графику, обеспечиваем контроль качества и фотоотчёты.',
  },
  {
    title: 'Инженерные системы',
    text: 'Монтируем инженерные сети, проводим тестирование и настройку.',
  },
  {
    title: 'Сдача и сервис',
    text: 'Передаём объект и документацию, обеспечиваем гарантийный контроль.',
  },
]

const Home = () => {
  const [filters, setFilters] = useState({
    area: '',
    floors: 'any',
    budget: '',
    bedrooms: '',
  })
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null)

  useEffect(() => {
    document.title = 'ОДИ — строительство индивидуальных домов в Калининграде'
  }, [])

  useEffect(() => {
    if (!activeImage) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveImage(null)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [activeImage])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const areaOk = filters.area ? project.area >= Number(filters.area) : true
      const budgetOk = filters.budget ? project.priceFrom >= Number(filters.budget) : true
      const bedroomsOk = filters.bedrooms ? project.bedrooms >= Number(filters.bedrooms) : true
      const floorsOk = filters.floors === 'any' ? true : project.floors === Number(filters.floors)
      return areaOk && budgetOk && bedroomsOk && floorsOk
    })
  }, [filters])

  return (
    <>
      <Section className="hero" id="hero">
        <Container size="wide">
          <div className="hero-grid">
            <div className="hero-content">
              <span className="eyebrow reveal" data-delay="1">
                Калининград и область
              </span>
              <h1 className="display-lg reveal" data-delay="2">
                Строим дома, в которых всё продумано до последней детали
              </h1>
              <p className="lead reveal" data-delay="3">
                Проектирование, строительство и инженерия под ключ. Прозрачные сроки, контроль
                качества и сопровождение на каждом этапе.
              </p>
              <div className="hero-actions reveal" data-delay="3">
                <a className="btn btn-primary btn-lg" href="/#consultation">
                  Получить консультацию
                </a>
                <a className="btn btn-outline btn-lg" href="/#projects">
                  Смотреть проекты
                </a>
              </div>
              <div className="hero-stats">
                <div className="stat-card">
                  <strong>12 лет</strong>
                  <span className="muted">на рынке Калининграда</span>
                </div>
                <div className="stat-card">
                  <strong>140+</strong>
                  <span className="muted">домов сданы под ключ</span>
                </div>
                <div className="stat-card">
                  <strong>5 лет</strong>
                  <span className="muted">гарантии на работы</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image">
                <img src="/images/project-aurora.svg" alt="Фасад современного дома" />
              </div>
              <div className="hero-panel">
                <div className="stack">
                  <span className="badge">Проверенный подход</span>
                  <div>
                    <strong>Прозрачная смета</strong>
                    <p className="muted">
                      Фиксируем стоимость по этапам и сразу показываем финальную сумму.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section id="about">
        <Container>
          <div className="about-grid">
            <div className="stack">
              <span className="eyebrow">О компании</span>
              <h2 className="h2">ОДИ — команда, которая строит дома как инженерные системы</h2>
              <p className="lead">
                Мы соединяем архитектуру, инженерные решения и контроль качества в единую
                технологию строительства. Наши объекты рассчитаны на долгую эксплуатацию и
                комфортную жизнь семьи.
              </p>
              <div className="project-specs">
                <span>Собственный технический отдел</span>
                <span>Локальные подрядчики и поставщики</span>
                <span>Контроль качества по чек-листам</span>
                <span>Фото- и видеоотчёты на каждом этапе</span>
              </div>
            </div>
            <Card className="about-list">
              <div className="stack">
                <strong>Что вы получаете</strong>
                <div className="divider" />
                <ul className="stack" style={{ paddingLeft: '1.2rem', margin: 0 }}>
                  <li>Понятный календарный график и персонального менеджера проекта.</li>
                  <li>Юридически закреплённую стоимость и сроки в договоре.</li>
                  <li>Подбор и проверку инженерных решений под ваш участок.</li>
                  <li>Гарантию и сопровождение после сдачи.</li>
                </ul>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

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

      <Section id="process">
        <Container>
          <div className="stack" style={{ gap: 'var(--space-6)' }}>
            <div className="stack">
              <span className="eyebrow">Принцип работы</span>
              <h2 className="h2">Понятный процесс, который можно контролировать</h2>
            </div>
            <div className="process-grid">
              {steps.map((step, index) => (
                <Card key={step.title} className="process-step">
                  <span>Этап {index + 1}</span>
                  <strong>{step.title}</strong>
                  <span className="muted">{step.text}</span>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section id="projects" tone="toned">
        <Container>
          <div className="project-section">
            <div className="stack">
              <span className="eyebrow">Каталог проектов</span>
              <h2 className="h2">Выберите проект, который можно адаптировать под ваш участок</h2>
              <p className="muted">
                Фильтруйте проекты по параметрам и откройте детальную информацию с планировками.
              </p>
            </div>
            <div className="filter-bar">
              <label className="field">
                <span>Площадь, от м²</span>
                <input
                  className="input"
                  type="number"
                  min={60}
                  value={filters.area}
                  onChange={(event) => setFilters({ ...filters, area: event.target.value })}
                  placeholder="120"
                />
              </label>
              <label className="field">
                <span>Этажность</span>
                <select
                  className="select"
                  value={filters.floors}
                  onChange={(event) => setFilters({ ...filters, floors: event.target.value })}
                >
                  <option value="any">Любая</option>
                  <option value="1">1 этаж</option>
                  <option value="2">2 этажа</option>
                </select>
              </label>
              <label className="field">
                <span>Бюджет, от млн ₽</span>
                <input
                  className="input"
                  type="number"
                  min={4}
                  step={0.1}
                  value={filters.budget}
                  onChange={(event) => setFilters({ ...filters, budget: event.target.value })}
                  placeholder="7.0"
                />
              </label>
              <label className="field">
                <span>Спальни, от</span>
                <input
                  className="input"
                  type="number"
                  min={2}
                  value={filters.bedrooms}
                  onChange={(event) => setFilters({ ...filters, bedrooms: event.target.value })}
                  placeholder="3"
                />
              </label>
            </div>
            <div className="project-grid">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="project-card">
                  <img src={project.image.src} alt={project.image.alt} loading="lazy" />
                  <div className="stack" style={{ gap: 'var(--space-2)' }}>
                    <strong>{project.name}</strong>
                    <span className="muted">{project.highlight}</span>
                    <div className="project-meta">
                      <span className="tag">{formatArea(project.area)}</span>
                      <span className="tag">{project.floors} этажа</span>
                      <span className="tag">{project.bedrooms} спальни</span>
                    </div>
                    <div className="project-specs">
                      <span>Материал: {project.material}</span>
                      <span>Срок: {project.duration}</span>
                      <span>Стоимость: {formatPrice(project.priceFrom)}</span>
                      <span>Комнат: {project.rooms}</span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setActiveProject(project)}>
                    Подробнее о проекте
                  </Button>
                </Card>
              ))}
            </div>
            {filteredProjects.length === 0 && (
              <Card>
                <p className="muted">Нет проектов с выбранными параметрами. Попробуйте изменить фильтры.</p>
              </Card>
            )}
          </div>
        </Container>
      </Section>

      <Section id="consultation">
        <Container>
          <div className="contact-grid">
            <Card className="contact-card">
              <span className="eyebrow">Консультация</span>
              <h2 className="h2">Расскажите о вашем будущем доме</h2>
              <p className="muted">
                Мы перезвоним, уточним задачу и предложим сценарий строительства под ваш участок
                и бюджет.
              </p>
              <LeadForm source="consultation" />
            </Card>
            <Card className="contact-card" tone="solid">
              <div className="stack">
                <Badge>Персональный подход</Badge>
                <h3 className="h3">Что обсудим на звонке</h3>
              </div>
              <ul className="stack" style={{ paddingLeft: '1.2rem', margin: 0 }}>
                <li>Параметры участка и геологию.</li>
                <li>Тип дома и желаемые материалы.</li>
                <li>Оценку бюджета и возможные оптимизации.</li>
                <li>Сроки проектирования и строительства.</li>
              </ul>
            </Card>
          </div>
        </Container>
      </Section>

      <Section id="gallery" tone="toned">
        <Container>
          <div className="stack" style={{ gap: 'var(--space-6)' }}>
            <div className="stack">
              <span className="eyebrow">Построено нами</span>
              <h2 className="h2">Реализованные объекты в Калининградской области</h2>
            </div>
            <div className="gallery-grid">
              {galleryItems.map((item) => (
                <button
                  key={item.id}
                  className="gallery-card"
                  type="button"
                  onClick={() => setActiveImage(item)}
                >
                  <img src={item.image.src} alt={item.image.alt} loading="lazy" />
                  <div className="gallery-caption">
                    {item.location} · {item.year}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section id="contacts">
        <Container>
          <div className="contact-grid">
            <Card className="contact-card">
              <span className="eyebrow">Контакты</span>
              <h2 className="h2">Свяжитесь с нами удобным способом</h2>
              <div className="stack">
                <div>
                  <strong>Телефон</strong>
                  <div>
                    <a href="tel:+74012999999">+7 (4012) 99-99-99</a>
                  </div>
                </div>
                <div>
                  <strong>Email</strong>
                  <div>
                    <a href="mailto:info@odi-house.ru">info@odi-house.ru</a>
                  </div>
                </div>
                <div>
                  <strong>Мессенджеры</strong>
                  <div className="hero-actions">
                    <a className="btn btn-outline btn-sm" href="https://t.me/odi_house">
                      Telegram
                    </a>
                    <a className="btn btn-outline btn-sm" href="https://wa.me/74012999999">
                      WhatsApp
                    </a>
                  </div>
                </div>
                <div>
                  <strong>Адрес</strong>
                  <div>Калининград, ул. Озёрная, 18</div>
                </div>
                <Badge>Работаем пн-сб 9:00-19:00</Badge>
              </div>
            </Card>
            <div className="map-frame">
              <iframe
                title="Карта Калининграда"
                src="https://www.openstreetmap.org/export/embed.html?bbox=20.414%2C54.704%2C20.583%2C54.742&layer=mapnik"
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </Container>
      </Section>

      <Modal
        isOpen={Boolean(activeProject)}
        title={activeProject?.name || ''}
        onClose={() => setActiveProject(null)}
        side={
          activeProject && (
            <div className="stack">
              <span className="eyebrow">Заявка по проекту</span>
              <p className="muted">
                Оставьте контакты — мы подготовим консультацию и расчёт по выбранному проекту.
              </p>
              <LeadForm
                source="project"
                projectId={activeProject.id}
                projectName={activeProject.name}
              />
            </div>
          )
        }
      >
        {activeProject && (
          <div className="stack">
            <p className="muted">{activeProject.description}</p>
            <div className="project-specs">
              <span>Площадь: {formatArea(activeProject.area)}</span>
              <span>Этажность: {activeProject.floors}</span>
              <span>Спальни: {activeProject.bedrooms}</span>
              <span>Комнат: {activeProject.rooms}</span>
              <span>Материал: {activeProject.material}</span>
              <span>Стоимость: {formatPrice(activeProject.priceFrom)}</span>
            </div>
            <div className="stack">
              <strong>Комплектация</strong>
              <div className="project-meta">
                {activeProject.equipment.map((item) => (
                  <span key={item} className="pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="stack">
              <strong>Особенности проекта</strong>
              <div className="project-meta">
                {activeProject.features.map((item) => (
                  <span key={item} className="pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="stack">
              <strong>Галерея</strong>
              <div className="project-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {activeProject.gallery.map((image) => (
                  <img key={image.src} src={image.src} alt={image.alt} loading="lazy" />
                ))}
              </div>
            </div>
            <div className="stack">
              <strong>Планировки</strong>
              <div className="project-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {activeProject.plans.map((image) => (
                  <img key={image.src} src={image.src} alt={image.alt} loading="lazy" />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {activeImage && (
        <div className="lightbox" onClick={() => setActiveImage(null)} role="dialog">
          <img src={activeImage.image.src} alt={activeImage.image.alt} />
        </div>
      )}
    </>
  )
}

export default Home
