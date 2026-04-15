'use client'
import { useState } from 'react'
import { useWallet } from '@/context/WalletContext'
import { useToast } from '@/context/ToastContext'
import { createSubmission, type Submission } from '@/lib/api'

interface SubmitFormProps {
  bountyId: string
  onSuccess: (s: Submission) => void
}

export function SubmitSolutionForm({ bountyId, onSuccess }: SubmitFormProps) {
  const { address, connect } = useWallet()
  const { addToast } = useToast()
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!address) {
    return (
      <button onClick={connect} className="w-full py-3 bg-algo-teal text-bg-base font-semibold rounded-btn hover:bg-algo-teal/90 transition-colors text-sm">
        Connect Wallet to Submit
      </button>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!text.trim()) { setError('Solution text is required'); return }
    if (text.trim().length > 10000) { setError('Max 10000 characters'); return }
    if (url.trim()) {
      try { new URL(url.trim()) } catch { setError('Please enter a valid URL'); return }
    }
    setIsSubmitting(true)
    try {
      const result = await createSubmission(bountyId, { solverAddress: address!, text: text.trim(), url: url.trim() || undefined })
      addToast({ type: 'success', message: 'Solution submitted!', sub: 'Status: Pending AI verification' })
      onSuccess(result.data)
      setText(''); setUrl('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit'
      setError(msg)
      addToast({ type: 'error', message: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls = "w-full bg-surface border border-border-glass rounded-btn px-4 py-2.5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-algo-teal/50 transition-colors"

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">Your Solution *</label>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} maxLength={10000}
          placeholder="Describe your solution clearly..."
          className={`${inputCls} resize-y`} />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">GitHub / Demo URL (optional)</label>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://github.com/..."
          className={inputCls} />
      </div>
      {error && <p className="text-color-error text-xs">{error}</p>}
      <button type="submit" disabled={isSubmitting}
        className="w-full py-2.5 bg-algo-teal text-bg-base font-semibold rounded-btn hover:bg-algo-teal/90 transition-colors disabled:opacity-50 text-sm">
        {isSubmitting ? 'Submitting...' : 'Submit Solution →'}
      </button>
    </form>
  )
}
