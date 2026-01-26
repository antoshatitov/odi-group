import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'

const server = Fastify({
  logger: {
    level: 'info',
    redact: ['req.headers.authorization'],
  },
})

const REQUIRED_ENV = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID']
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key])

if (missingEnv.length > 0) {
  server.log.error({ missingEnv }, 'Missing required environment variables')
  process.exit(1)
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const PORT = Number(process.env.PORT || 8080)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

await server.register(helmet, {
  contentSecurityPolicy: false,
})

await server.register(cors, {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0) {
      callback(null, true)
      return
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'), false)
  },
  credentials: false,
})

await server.register(rateLimit, {
  max: 15,
  timeWindow: '1 minute',
  ban: 2,
  allowList: [],
  keyGenerator: (req) => req.ip,
})

const leadSchema = {
  body: {
    type: 'object',
    required: ['name', 'phone', 'consent'],
    additionalProperties: false,
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 80 },
      phone: {
        type: 'string',
        minLength: 7,
        maxLength: 20,
        pattern: '^[0-9+()\\s-]{7,20}$',
      },
      message: { type: 'string', maxLength: 500 },
      projectId: { type: 'string', maxLength: 40 },
      projectName: { type: 'string', maxLength: 120 },
      source: { type: 'string', maxLength: 80 },
      consent: { type: 'boolean' },
      website: { type: 'string', maxLength: 120 },
    },
  },
}

const normalizeText = (value, max) => {
  if (!value) return ''
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max)
}

const buildTelegramMessage = ({
  name,
  phone,
  message,
  projectName,
  projectId,
  source,
}) => {
  const lines = [
    'Новая заявка «ОДИ»',
    `Имя: ${normalizeText(name, 80)}`,
    `Телефон: ${normalizeText(phone, 20)}`,
  ]

  if (projectName || projectId) {
    lines.push(
      `Проект: ${normalizeText(projectName || 'Без названия', 120)} (${normalizeText(
        projectId || 'без id',
        40,
      )})`,
    )
  }

  if (message) {
    lines.push(`Комментарий: ${normalizeText(message, 500)}`)
  }

  if (source) {
    lines.push(`Источник: ${normalizeText(source, 80)}`)
  }

  lines.push(`Время: ${new Date().toLocaleString('ru-RU')}`)

  return lines.join('\n')
}

server.post('/api/lead', { schema: leadSchema }, async (request, reply) => {
  const { name, phone, message, projectId, projectName, source, consent, website } =
    request.body

  if (!consent) {
    reply.code(400).send({ error: 'Consent is required' })
    return
  }

  if (website) {
    reply.code(202).send({ ok: true })
    return
  }

  const payload = {
    name,
    phone,
    message,
    projectId,
    projectName,
    source,
  }

  const telegramMessage = buildTelegramMessage(payload)

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramMessage,
          disable_web_page_preview: true,
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      server.log.error(
        {
          status: response.status,
          error: errorText.slice(0, 200),
        },
        'Telegram API error',
      )
      reply.code(502).send({ error: 'Failed to deliver message' })
      return
    }

    server.log.info(
      {
        event: 'lead_sent',
        projectId: projectId || null,
        hasMessage: Boolean(message),
      },
      'Lead delivered',
    )

    reply.code(200).send({ ok: true })
  } catch (error) {
    server.log.error({ error: error?.message }, 'Lead delivery failed')
    reply.code(500).send({ error: 'Server error' })
  }
})

server.get('/api/health', async () => ({ ok: true }))

server.setErrorHandler((error, _request, reply) => {
  if (error.validation) {
    reply.code(400).send({ error: 'Invalid payload' })
    return
  }

  if (error.message === 'Not allowed by CORS') {
    reply.code(403).send({ error: 'CORS blocked' })
    return
  }

  server.log.error({ error: error.message }, 'Unhandled error')
  reply.code(500).send({ error: 'Server error' })
})

try {
  await server.listen({ port: PORT, host: '0.0.0.0' })
  server.log.info(`Lead API listening on ${PORT}`)
} catch (error) {
  server.log.error({ error: error.message }, 'Failed to start server')
  process.exit(1)
}
