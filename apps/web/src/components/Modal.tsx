import { useEffect } from 'react'

import type { ReactNode } from 'react'

type ModalProps = {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
  side?: ReactNode
}

const Modal = ({ isOpen, title, onClose, children, side }: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-body">
          <button className="modal-close" type="button" onClick={onClose}>
            ✕
          </button>
          <div className="stack">
            <h2 className="h2">{title}</h2>
            {children}
          </div>
        </div>
        {side && <aside className="modal-side">{side}</aside>}
      </div>
    </div>
  )
}

export default Modal
