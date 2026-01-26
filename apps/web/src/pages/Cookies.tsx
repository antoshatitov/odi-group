import LegalPage from './LegalPage'

const Cookies = () => {
  return (
    <LegalPage title="Cookie-политика" updated="26.01.2026">
      <p>
        Мы используем файлы cookie и аналогичные технологии, чтобы сайт работал корректно и
        помогал улучшать пользовательский опыт.
      </p>
      <div className="stack">
        <strong>Какие файлы cookie используются</strong>
        <p>
          Технические cookie, необходимые для работы сайта, а также аналитические cookie при
          подключении систем веб-аналитики.
        </p>
      </div>
      <div className="stack">
        <strong>Как управлять cookie</strong>
        <p>
          Вы можете запретить сохранение cookie в настройках браузера. В таком случае некоторые
          функции сайта могут работать некорректно.
        </p>
      </div>
      <div className="stack">
        <strong>Сторонние сервисы</strong>
        <p>
          При подключении аналитики данные могут передаваться в сервисы статистики. Мы не
          передаём персональные данные без вашего согласия.
        </p>
      </div>
    </LegalPage>
  )
}

export default Cookies
