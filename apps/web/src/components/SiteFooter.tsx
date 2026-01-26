const SiteFooter = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="stack">
          <div className="logo">ОДИ</div>
          <p className="muted">
            Строительство индивидуальных домов в Калининграде и области. Проектируем,
            строим, контролируем качество и сроки.
          </p>
        </div>
        <div className="stack">
          <strong>Контакты</strong>
          <a href="tel:+74012999999">+7 (4012) 99-99-99</a>
          <a href="mailto:info@odi-house.ru">info@odi-house.ru</a>
          <span>Калининград, ул. Озёрная, 18</span>
        </div>
        <div className="stack">
          <strong>Документы</strong>
          <a href="/policy">Политика обработки данных</a>
          <a href="/consent">Согласие на обработку данных</a>
          <a href="/cookies">Cookie-политика</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span className="muted">© 2026 «ОДИ». Все права защищены.</span>
        <span className="muted">ИНН / ОГРН: по запросу</span>
      </div>
    </footer>
  )
}

export default SiteFooter
