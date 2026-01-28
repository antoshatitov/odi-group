import { useEffect, useState } from 'react'

import Button from './Button'

const navLinks = [
  { label: 'О компании', href: '/#about' },
  { label: 'Услуги', href: '/#services' },
  { label: 'Проекты', href: '/#projects' },
  { label: 'Построено', href: '/#gallery' },
  { label: 'Контакты', href: '/#contacts' },
]

const SiteHeader = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="logo" href="/">
          <span>ОДИ</span>
          <small>строительная компания</small>
        </a>
        <nav className="nav-links" aria-label="Основная навигация">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="btn btn-outline btn-sm" href="tel:+79244422800">
            +7 924 442-28-00
          </a>
          <a className="btn btn-primary btn-sm" href="/#consultation">
            Получить консультацию
          </a>
          <Button
            className="menu-toggle"
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setOpen(true)}
          >
            Меню
          </Button>
        </div>
      </div>
      {open && (
        <div className="mobile-nav" role="dialog" aria-modal="true">
          <div className="mobile-nav-panel">
            <div className="mobile-nav-header">
              <span className="logo">ОДИ</span>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Закрыть
              </Button>
            </div>
            <div className="mobile-nav-links">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mobile-nav-actions">
              <a className="btn btn-outline" href="tel:+79244422800">
                +7 924 442-28-00
              </a>
              <a className="btn btn-primary" href="/#consultation" onClick={() => setOpen(false)}>
                Получить консультацию
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default SiteHeader
