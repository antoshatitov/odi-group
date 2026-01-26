import { useState } from 'react'

import type { FormEvent } from 'react'

import Button from './Button'
import Input from './Input'
import TextArea from './TextArea'

type LeadFormProps = {
  source: string
  projectId?: string
  projectName?: string
}

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

const LeadForm = ({ source, projectId, projectName }: LeadFormProps) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const reset = () => {
    setName('')
    setPhone('')
    setMessage('')
    setConsent(false)
    setHoneypot('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!consent) {
      setError('Подтвердите согласие на обработку персональных данных.')
      setStatus('error')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch(`${API_BASE}/api/lead`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          message,
          projectId,
          projectName,
          source,
          consent,
          website: honeypot,
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка отправки')
      }

      setStatus('success')
      reset()
    } catch {
      setStatus('error')
      setError('Не удалось отправить заявку. Попробуйте ещё раз или позвоните.')
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <Input
        label="Имя"
        name="name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Как к вам обращаться"
      />
      <Input
        label="Телефон"
        name="phone"
        type="tel"
        required
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="+7 (___) ___-__-__"
        pattern="[0-9+()\s-]{7,20}"
      />
      <TextArea
        label="Комментарий"
        name="message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Коротко опишите задачу или пожелания"
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
          onChange={(event) => setConsent(event.target.checked)}
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
      {status === 'success' && (
        <div className="badge" role="status">
          Спасибо! Мы свяжемся с вами в ближайшее время.
        </div>
      )}
      {status === 'error' && error && (
        <div
          className="badge"
          role="alert"
          style={{ background: 'rgba(199, 126, 108, 0.2)', color: '#8b3d2f' }}
        >
          {error}
        </div>
      )}
      <Button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Отправляем...' : 'Отправить заявку'}
      </Button>
    </form>
  )
}

export default LeadForm
