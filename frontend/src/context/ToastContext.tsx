'use client'
import React, { createContext, useContext, useState, useCallback } from 'react'

export interface Toast { id: string; type: 'success' | 'error'; message: string; sub?: string }
interface ToastCtx { toasts: Toast[]; addToast: (t: Omit<Toast, 'id'>) => void; removeToast: (id: string) => void }

const ToastContext = createContext<ToastCtx>({ toasts: [], addToast: () => {}, removeToast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(p => [...p, { ...t, id }])
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 5000)
  }, [])
  const removeToast = useCallback((id: string) => setToasts(p => p.filter(x => x.id !== id)), [])
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {toasts.map(t => (
            <div key={t.id} className={`glass-card p-4 min-w-[280px] border-l-4 ${t.type === 'success' ? 'border-l-algo-teal' : 'border-l-color-error'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{t.type === 'success' ? '✓ ' : '✕ '}{t.message}</p>
                  {t.sub && <p className="text-xs text-text-muted mt-1 font-mono break-all">{t.sub}</p>}
                </div>
                <button onClick={() => removeToast(t.id)} className="text-text-muted hover:text-text-primary text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
