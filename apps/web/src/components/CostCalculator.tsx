import { useState } from 'react'

import type { FormEvent } from 'react'

import Button from './Button'
import Input from './Input'
import { formatRubles } from '../utils/format'

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const LOCAL_ATTEMPTS_KEY = 'odi_calc_attempts'
const LOCAL_LIMIT_WINDOW_MS = 2 * 60 * 1000
const LOCAL_LIMIT_MAX = 2
const SOFT_DELAY_MS = 300
const FAST_SUBMIT_MS = 4000

const readLocalAttempts = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_ATTEMPTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => typeof item === 'number')
  } catch {
    return []
  }
}

const writeLocalAttempts = (attempts: number[]) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(attempts))
  } catch {
    // ignore storage errors
  }
}

const getRecentAttempts = (now: number) => {
  const attempts = readLocalAttempts().filter((timestamp) => now - timestamp < LOCAL_LIMIT_WINDOW_MS)
  writeLocalAttempts(attempts)
  return attempts
}

const recordAttempt = (now: number) => {
  const attempts = getRecentAttempts(now)
  attempts.push(now)
  writeLocalAttempts(attempts)
  return attempts.length
}

const packageOptions = [
  {
    value: 'black',
    label: 'Черный ключ',
    description:
      'Фундамент, коробка (черновые стены и перекрытия), кровля без утепления. Оптимально, если хотите продолжить работы поэтапно.',
  },
  {
    value: 'gray',
    label: 'Серый ключ',
    description:
      'Теплый контур и инженерия: утеплённая кровля, оштукатуренные стены, окна и входная дверь, отопление (тёплый пол или радиаторы), электрика, септик и скважина, фасад с декоративной штукатуркой.',
  },
  {
    value: 'white',
    label: 'Белый ключ',
    description:
      'Дом «заезжай и живи»: чистовая отделка во всех помещениях, потолки, установленная сантехника и всё необходимое для комфортного проживания.',
  },
]

const CostCalculator = () => {
  const [floors, setFloors] = useState('')
  const [area, setArea] = useState('')
  const [packageType, setPackageType] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [estimate, setEstimate] = useState('')
  const [activeInfo, setActiveInfo] = useState<string | null>(null)
  const [openedAt] = useState(() => Date.now())

  const resetResult = () => {
    if (estimate) setEstimate('')
    if (status !== 'idle') setStatus('idle')
    if (error) setError('')
  }

  const resetForm = () => {
    setFloors('')
    setArea('')
    setPackageType('')
    setName('')
    setPhone('')
    setConsent(false)
    setHoneypot('')
    setStatus('idle')
    setError('')
    setEstimate('')
    setActiveInfo(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!consent) {
      setError('Подтвердите согласие на обработку персональных данных.')
      setStatus('error')
      return
    }

    if (!floors) {
      setError('Выберите этажность дома.')
      setStatus('error')
      return
    }

    if (!packageType) {
      setError('Выберите комплектацию строительства.')
      setStatus('error')
      return
    }

    const areaValue = Number(area)
    if (!Number.isFinite(areaValue) || areaValue <= 0) {
      setError('Введите площадь дома в м².')
      setStatus('error')
      return
    }

    if (name.trim().length < 2) {
      setError('Введите имя и фамилию.')
      setStatus('error')
      return
    }

    const attemptTime = Date.now()
    const recentAttempts = getRecentAttempts(attemptTime)
    if (recentAttempts.length >= LOCAL_LIMIT_MAX) {
      setError('Слишком частые запросы. Попробуйте снова через пару минут.')
      setStatus('error')
      return
    }

    recordAttempt(attemptTime)
    setStatus('loading')

    try {
      await new Promise((resolve) => setTimeout(resolve, SOFT_DELAY_MS))
      const submittedAt = Date.now()
      const clientSuspected = submittedAt - openedAt < FAST_SUBMIT_MS

      const requestPayload = {
        floors: Number(floors),
        area: areaValue,
        packageType,
        name: name.trim(),
        phone,
        consent,
        website: honeypot,
        openedAt,
        submittedAt,
        action: 'cost_estimate',
        ...(clientSuspected
          ? { clientSuspected: true, clientSuspectedReason: 'fast_submit' }
          : {}),
      }

      const response = await fetch(`${API_BASE}/api/cost-estimate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestPayload),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || 'Ошибка отправки')
      }

      const formattedEstimate =
        payload?.formattedEstimate || (payload?.estimate ? formatRubles(payload.estimate) : '')

      if (formattedEstimate) {
        setEstimate(formattedEstimate)
      }

      setStatus('success')
    } catch {
      setStatus('error')
      setError('Не удалось выполнить расчет. Попробуйте позже или позвоните нам.')
    }
  }

  return (
    <div className="stack" style={{ gap: 'var(--space-4)' }}>
      <p className="muted">
        Укажите основные параметры будущего дома — рассчитаем ориентировочную стоимость и свяжемся
        с вами в течение двух часов.
      </p>
      <form className="calculator-form" onSubmit={handleSubmit}>
        <div className="calculator-grid">
          <label className="field">
            <span>Количество этажей</span>
            <select
              className="select"
              value={floors}
              required
              onChange={(event) => {
                setFloors(event.target.value)
                resetResult()
              }}
            >
              <option value="" disabled>
                Выберите
              </option>
              <option value="1">1 этаж</option>
              <option value="2">2 этажа</option>
            </select>
          </label>
          <label className="field">
            <span>Площадь дома</span>
            <div className="input-suffix">
              <input
                className="input input-suffix-field"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={area}
                onChange={(event) => {
                  setArea(event.target.value)
                  resetResult()
                }}
                placeholder="100"
                required
              />
              <span className="input-suffix-text">м²</span>
            </div>
          </label>
        </div>

        <div className="stack" style={{ gap: 'var(--space-3)' }}>
          <div className="field">
            <span>Комплектация</span>
          </div>
          <div className="calculator-options">
            {packageOptions.map((option, index) => {
              const isActive = packageType === option.value
              const isInfoOpen = activeInfo === option.value
              return (
                <div key={option.value} className={`calculator-option ${isActive ? 'is-active' : ''}`}>
                  <label className="calculator-option-main">
                    <input
                      type="radio"
                      name="packageType"
                      value={option.value}
                      checked={isActive}
                      required={index === 0}
                      onChange={(event) => {
                        setPackageType(event.target.value)
                        resetResult()
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                  <button
                    type="button"
                    className="calculator-option-info"
                    aria-label={`Описание комплектации ${option.label}`}
                    aria-expanded={isInfoOpen}
                    onClick={() =>
                      setActiveInfo((current) => (current === option.value ? null : option.value))
                    }
                  >
                    i
                  </button>
                  {isInfoOpen && <div className="calculator-option-desc">{option.description}</div>}
                </div>
              )
            })}
          </div>
        </div>

        <Input
          label="Имя и фамилия"
          name="name"
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            resetResult()
          }}
          placeholder="Например, Антон Титов"
        />
        <Input
          label="Телефон"
          name="phone"
          type="tel"
          required
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value)
            resetResult()
          }}
          placeholder="+7 (___) ___-__-__"
          pattern="[0-9+() -]{7,20}"
        />

        <label className="field" style={{ display: 'none' }} aria-hidden="true">
          <span>Website</span>
          <input
            className="input"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked)
              resetResult()
            }}
            required
          />
          <span>
            Я соглашаюсь с{' '}
            <a href="/consent" className="chip" target="_blank" rel="noreferrer">
              условиями обработки персональных данных
            </a>
            .
          </span>
        </label>

        {status === 'error' && error && (
          <div className="calculator-alert calculator-alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="calculator-actions">
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Считаем...' : 'Расчет стоимости'}
          </Button>
          <Button type="button" variant="outline" onClick={resetForm}>
            Сбросить
          </Button>
        </div>

        {status === 'success' && estimate && (
          <div className="calculator-result" role="status" aria-live="polite">
            <span className="eyebrow">Ориентировочная стоимость</span>
            <strong>{estimate}</strong>
            <span className="muted">
              Заявка отправлена. Мы свяжемся с вами в течении двух часов.
            </span>
          </div>
        )}
      </form>
    </div>
  )
}

export default CostCalculator
