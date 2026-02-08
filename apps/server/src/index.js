import crypto from 'node:crypto'

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
const readEnv = (value) => {
  if (!value) return ''
  return value.trim()
}
const missingEnv = REQUIRED_ENV.filter((key) => !readEnv(process.env[key]))

if (missingEnv.length > 0) {
  server.log.error({ missingEnv }, 'Missing required environment variables')
  process.exit(1)
}

const TELEGRAM_BOT_TOKEN = readEnv(process.env.TELEGRAM_BOT_TOKEN)
const TELEGRAM_CHAT_ID = readEnv(process.env.TELEGRAM_CHAT_ID)
const CALC_BOT_TOKEN = readEnv(process.env.TELEGRAM_CALC_BOT_TOKEN) || TELEGRAM_BOT_TOKEN
const CALC_CHAT_ID = readEnv(process.env.TELEGRAM_CALC_CHAT_ID) || TELEGRAM_CHAT_ID
const QUARANTINE_CHAT_ID = readEnv(process.env.TELEGRAM_QUARANTINE_CHAT_ID) || CALC_CHAT_ID
const LOG_HASH_SALT = process.env.LOG_HASH_SALT || 'odi-calc'
const CAPTCHA_ENABLED = process.env.CAPTCHA_ENABLED === 'true'
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
  title,
  name,
  phone,
  message,
  projectName,
  projectId,
  source,
}) => {
  const normalizedMessage = normalizeText(message, 500)
  const lines = [
    title || 'Новая заявка «ОДИ»',
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

  if (normalizedMessage) {
    lines.push(`Комментарий: ${normalizedMessage}`)
  }

  if (source) {
    lines.push(`Источник: ${normalizeText(source, 80)}`)
  }

  lines.push(`Время: ${new Date().toLocaleString('ru-RU')}`)

  return lines.join('\n')
}

const CALC_PACKAGE_LABELS = {
  black: 'Черный ключ',
  gray: 'Серый ключ',
  white: 'Белый ключ',
}

const CALC_PACKAGE_RATES = {
  black: 60000,
  gray: 80000,
  white: 100000,
}

const CALC_DEDUP_WINDOW_MS = 30 * 60 * 1000
const CALC_FAST_SUBMIT_MS = 4000

const calcMetrics = {
  total: 0,
  sent: 0,
  quarantine: 0,
  blocked: 0,
  dedup: 0,
}

const calcDedupStore = new Map()

const normalizePhone = (value) => {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `+7${digits}`
  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`
  }
  if (digits.startsWith('7')) return `+${digits}`
  return `+${digits}`
}

const formatRubles = (value) => {
  const formatted = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)
  return `${formatted.replace(/\u00A0/g, ' ')} ₽`
}

const formatKaliningradTimestamp = (date) => {
  const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Kaliningrad',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Kaliningrad',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${timeFormatter.format(date)} ${dateFormatter.format(date)}`
}

const hashValue = (value) => {
  return crypto.createHash('sha256').update(`${value}|${LOG_HASH_SALT}`).digest('hex').slice(0, 12)
}

const buildCalcMessage = ({
  timestamp,
  floors,
  area,
  packageLabel,
  name,
  phone,
  estimate,
}) => {
  return [
    'Заявка: Расчет стоимости',
    `Время: ${timestamp}`,
    `Этажность: ${floors}`,
    `Площадь: ${area} м²`,
    `Комплектация: ${packageLabel}`,
    `Имя: ${normalizeText(name, 80)}`,
    `Телефон: ${normalizeText(phone, 20)}`,
    `Ориентировочная стоимость: ${estimate}`,
  ].join('\n')
}

const createSlidingWindowLimiter = (limits) => {
  const events = new Map()
  const maxWindow = Math.max(...limits.map((limit) => limit.windowMs))

  const check = (key, now = Date.now()) => {
    if (!key) return { allowed: true }
    const history = events.get(key) || []
    const fresh = history.filter((timestamp) => now - timestamp < maxWindow)
    fresh.push(now)
    events.set(key, fresh)

    for (const limit of limits) {
      const count = fresh.filter((timestamp) => now - timestamp < limit.windowMs).length
      if (count > limit.max) {
        return { allowed: false, limit }
      }
    }

    return { allowed: true }
  }

  return { check }
}

const calcIpLimiter = createSlidingWindowLimiter([
  { windowMs: 60 * 1000, max: 3 },
  { windowMs: 60 * 60 * 1000, max: 10 },
  { windowMs: 24 * 60 * 60 * 1000, max: 30 },
])

const calcPhoneLimiter = createSlidingWindowLimiter([
  { windowMs: 10 * 60 * 1000, max: 1 },
  { windowMs: 24 * 60 * 60 * 1000, max: 2 },
])

const calcGlobalLimiter = createSlidingWindowLimiter([{ windowMs: 10 * 60 * 1000, max: 20 }])

const isCalcDuplicate = (hashKey, now) => {
  for (const [key, timestamp] of calcDedupStore.entries()) {
    if (now - timestamp > CALC_DEDUP_WINDOW_MS) {
      calcDedupStore.delete(key)
    }
  }

  const lastSeen = calcDedupStore.get(hashKey)
  if (lastSeen && now - lastSeen < CALC_DEDUP_WINDOW_MS) {
    return true
  }
  calcDedupStore.set(hashKey, now)
  return false
}

const logCalcEvent = ({ event, reason, ip, phone, userAgent, details }) => {
  server.log.info(
    {
      event,
      reason,
      ipHash: hashValue(ip || 'unknown'),
      phoneHash: phone ? hashValue(phone) : null,
      userAgent: userAgent || 'unknown',
      time: new Date().toISOString(),
      metrics: { ...calcMetrics },
      details,
    },
    'calc_event',
  )
}

const logCalcQuarantine = ({ reason, ip, phone, userAgent, details }) => {
  server.log.warn(
    {
      event: 'calc_quarantine_log',
      reason,
      ipHash: hashValue(ip || 'unknown'),
      phoneHash: phone ? hashValue(phone) : null,
      userAgent: userAgent || 'unknown',
      time: new Date().toISOString(),
      metrics: { ...calcMetrics },
      details,
    },
    'calc_quarantine_log',
  )
}

const sendCalculatorMessage = async (chatId, text) => {
  if (!CALC_BOT_TOKEN || !chatId) {
    return { ok: false, skipped: true }
  }

  const response = await fetch(`https://api.telegram.org/bot${CALC_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    server.log.error(
      {
        status: response.status,
        error: errorText.slice(0, 200),
      },
      'Telegram API error (calculator)',
    )
    return { ok: false }
  }

  return { ok: true }
}

const costSchema = {
  body: {
    type: 'object',
    required: ['floors', 'area', 'packageType', 'name', 'phone', 'consent', 'openedAt', 'submittedAt'],
    additionalProperties: false,
    properties: {
      floors: { type: 'integer', enum: [1, 2] },
      area: { type: 'number', minimum: 1, maximum: 10000 },
      packageType: { type: 'string', enum: ['black', 'gray', 'white'] },
      name: { type: 'string', minLength: 2, maxLength: 80 },
      phone: {
        type: 'string',
        minLength: 7,
        maxLength: 20,
        pattern: '^[0-9+()\\s-]{7,20}$',
      },
      consent: { type: 'boolean' },
      website: { type: 'string', maxLength: 120 },
      openedAt: { type: 'number' },
      submittedAt: { type: 'number' },
      action: { type: 'string', maxLength: 40 },
      clientSuspected: { type: 'boolean' },
      clientSuspectedReason: { type: 'string', maxLength: 40 },
      captchaToken: { type: 'string', maxLength: 200 },
    },
  },
}

server.post('/api/cost-estimate', { schema: costSchema }, async (request, reply) => {
  const {
    floors,
    area,
    packageType,
    name,
    phone,
    consent,
    website,
    openedAt,
    submittedAt,
    action,
    clientSuspected,
    clientSuspectedReason,
    captchaToken,
  } = request.body

  calcMetrics.total += 1
  const now = Date.now()
  const ip = request.ip
  const userAgent = request.headers['user-agent']

  if (!consent) {
    calcMetrics.blocked += 1
    logCalcEvent({ event: 'calc_blocked', reason: 'missing_consent', ip, phone, userAgent })
    reply.code(400).send({ error: 'Consent is required' })
    return
  }

  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone) {
    calcMetrics.blocked += 1
    logCalcEvent({ event: 'calc_blocked', reason: 'invalid_phone', ip, phone, userAgent })
    reply.code(400).send({ error: 'Invalid phone' })
    return
  }

  const areaRounded = Math.round(Number(area))
  const floorsValue = Number(floors)
  const packageLabel = CALC_PACKAGE_LABELS[packageType]
  const estimateValue = areaRounded * CALC_PACKAGE_RATES[packageType]
  const formattedEstimate = formatRubles(estimateValue)
  const responsePayload = { ok: true, estimate: estimateValue, formattedEstimate }

  if (website) {
    calcMetrics.blocked += 1
    logCalcEvent({ event: 'calc_dropped', reason: 'honeypot', ip, phone: normalizedPhone, userAgent })
    reply.code(200).send(responsePayload)
    return
  }

  if (CAPTCHA_ENABLED && !captchaToken) {
    calcMetrics.blocked += 1
    logCalcEvent({ event: 'calc_blocked', reason: 'captcha_required', ip, phone: normalizedPhone, userAgent })
    reply.code(400).send({ error: 'Captcha required' })
    return
  }

  const ipCheck = calcIpLimiter.check(ip, now)
  if (!ipCheck.allowed) {
    calcMetrics.blocked += 1
    logCalcEvent({
      event: 'calc_blocked',
      reason: 'ip_rate_limit',
      ip,
      phone: normalizedPhone,
      userAgent,
      details: { windowMs: ipCheck.limit.windowMs, max: ipCheck.limit.max },
    })
    reply.code(429).send({ error: 'Too many requests' })
    return
  }

  const phoneCheck = calcPhoneLimiter.check(normalizedPhone, now)
  if (!phoneCheck.allowed) {
    calcMetrics.blocked += 1
    logCalcEvent({
      event: 'calc_blocked',
      reason: 'phone_rate_limit',
      ip,
      phone: normalizedPhone,
      userAgent,
      details: { windowMs: phoneCheck.limit.windowMs, max: phoneCheck.limit.max },
    })
    reply.code(429).send({ error: 'Too many requests' })
    return
  }

  const dedupKey = hashValue(
    `${normalizedPhone}|${packageType}|${areaRounded}|${floorsValue}|${action || 'cost_estimate'}`,
  )
  if (isCalcDuplicate(dedupKey, now)) {
    calcMetrics.dedup += 1
    logCalcEvent({ event: 'calc_dedup', reason: 'duplicate', ip, phone: normalizedPhone, userAgent })
    reply.code(200).send(responsePayload)
    return
  }

  const submitDelta = Number(submittedAt) - Number(openedAt)
  const quarantineReasons = []
  const addQuarantineReason = (reason) => {
    if (reason && !quarantineReasons.includes(reason)) {
      quarantineReasons.push(reason)
    }
  }

  if (Number.isFinite(submitDelta) && submitDelta < CALC_FAST_SUBMIT_MS) {
    addQuarantineReason('fast_submit')
  }

  if (clientSuspected) {
    addQuarantineReason(clientSuspectedReason || 'client_suspected')
  }

  if (quarantineReasons.length === 0) {
    const globalCheck = calcGlobalLimiter.check('global', now)
    if (!globalCheck.allowed) {
      quarantineReasons.push('global_send_limit')
    }
  }

  const timestamp = formatKaliningradTimestamp(new Date(now))
  const message = buildCalcMessage({
    timestamp,
    floors: floorsValue,
    area: areaRounded,
    packageLabel,
    name,
    phone: normalizedPhone,
    estimate: formattedEstimate,
  })

  if (quarantineReasons.length > 0) {
    calcMetrics.quarantine += 1
    const quarantineMessage = `${message}\nПричина: ${quarantineReasons.join(', ')}`
    const result = await sendCalculatorMessage(QUARANTINE_CHAT_ID, quarantineMessage)
    logCalcEvent({
      event: 'calc_quarantine',
      reason: quarantineReasons.join(','),
      ip,
      phone: normalizedPhone,
      userAgent,
      details: {
        sent: result.ok,
        skipped: result.skipped || false,
        clientSuspected: Boolean(clientSuspected),
        clientSuspectedReason: clientSuspectedReason || null,
      },
    })
    logCalcQuarantine({
      reason: quarantineReasons.join(','),
      ip,
      phone: normalizedPhone,
      userAgent,
      details: {
        sent: result.ok,
        skipped: result.skipped || false,
        clientSuspected: Boolean(clientSuspected),
        clientSuspectedReason: clientSuspectedReason || null,
      },
    })
    reply.code(200).send(responsePayload)
    return
  }

  if (!CALC_BOT_TOKEN || !CALC_CHAT_ID) {
    logCalcEvent({
      event: 'calc_skipped',
      reason: 'missing_telegram_config',
      ip,
      phone: normalizedPhone,
      userAgent,
    })
    reply.code(200).send(responsePayload)
    return
  }

  const sendResult = await sendCalculatorMessage(CALC_CHAT_ID, message)
  if (!sendResult.ok) {
    reply.code(502).send({ error: 'Failed to deliver message' })
    return
  }

  calcMetrics.sent += 1
  logCalcEvent({ event: 'calc_sent', reason: 'ok', ip, phone: normalizedPhone, userAgent })
  reply.code(200).send(responsePayload)
})

server.post('/api/lead', { schema: leadSchema }, async (request, reply) => {
  const { name, phone, message, projectId, projectName, source, consent, website } =
    request.body
  const isConsultation = source === 'consultation'
  const normalizedMessage = normalizeText(message, 500)

  if (!consent) {
    reply.code(400).send({ error: 'Consent is required' })
    return
  }

  if (isConsultation && !normalizedMessage) {
    reply.code(400).send({ error: 'Message is required' })
    return
  }

  if (website) {
    reply.code(202).send({ ok: true })
    return
  }

  const payload = {
    name,
    phone,
    message: normalizedMessage,
    projectId,
    projectName,
    source,
    title: isConsultation ? 'Запрос консультации' : undefined,
  }

  const telegramMessage = buildTelegramMessage(payload)
  const botToken = isConsultation ? CALC_BOT_TOKEN : TELEGRAM_BOT_TOKEN
  const chatId = isConsultation ? CALC_CHAT_ID : TELEGRAM_CHAT_ID

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
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
        hasMessage: Boolean(normalizedMessage),
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
