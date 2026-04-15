'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/context/WalletContext'
import { useToast } from '@/context/ToastContext'
import { createBounty } from '@/lib/api'
import { truncateAddress } from '@/lib/algorand'
import { ConfirmationOverlay } from './ConfirmationOverlay'

const CATS = ['Frontend', 'Backend', 'Smart Contracts', 'Data Tasks', 'General']
const defaultDeadline = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] }
const minDeadline = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }

export function CreateBountyForm() {
  const router = useRouter()
  const { address, isConnected, connect } = useWallet()
  const { addToast } = useToast()
  const [form, setForm] = useState({ title: '', description: '', category: 'General', rewardAlgo: 1, deadline: defaultDeadline() })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required'
    else if (form.title.length > 200) e.title = 'Max 200 characters'
    if (!form.description.trim()) e.description = 'Description is required'
    else if (form.description.length > 5000) e.description = 'Max 5000 characters'
    if (form.rewardAlgo < 1 || form.rewardAlgo > 100) e.rewardAlgo = 'Must be 1–100 ALGO'
    if (!form.deadline) e.deadline = 'Required'
    else if (new Date(form.deadline) <= new Date()) e.deadline = 'Must be in the future'
    setErrors(e); return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!validate() || !address) return
    setIsSubmitting(true)
    try {
      const result = await createBounty({ ...form, title: form.title.trim(), description: form.description.trim(), deadline: new Date(form.deadline).toISOString(), posterAddress: address })
      addToast({ type: 'success', message: 'Bounty Created!', sub: `Tx: ${result.data.txId.slice(0, 12)}...` })
      router.push(`/bounty/${result.data.bountyId}`)
    } catch (err: unknown) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to create bounty' })
      setIsSubmitting(false)
    }
  }

  if (!isConnected) return (
    <div className="glass-card p-8 text-center max-w-lg mx-auto">
      <div className="text-4xl mb-4">⬡</div>
      <h2 className="text-text-primary font-semibold text-lg mb-2">Connect your wallet</h2>
      <p className="text-text-secondary text-sm mb-6">Connect your Pera Wallet to post a bounty and lock ALGO.</p>
      <button onClick={connect} className="px-6 py-3 bg-algo-teal text-bg-base font-semibold rounded-btn hover:bg-algo-teal/90 transition-colors">Connect Wallet</button>
    </div>
  )

  const field = (label: string, name: keyof typeof form, el: React.ReactNode) => (
    <div className="mb-5">
      <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>
      {el}
      {errors[name] && <p className="text-color-error text-xs mt-1">{errors[name]}</p>}
    </div>
  )

  const inputCls = "w-full bg-surface border border-border-glass rounded-btn px-4 py-2.5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-algo-teal/50 transition-colors"

  return (
    <>
      <ConfirmationOverlay isVisible={isSubmitting} />
      <form onSubmit={handleSubmit} className="glass-card p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Post a Bounty</h1>
          <p className="text-text-secondary text-sm mt-1">Posting as: <span className="font-mono text-algo-teal">{truncateAddress(address ?? '')}</span></p>
        </div>
        {field('Title', 'title', <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={200} placeholder="Build a React button component..." className={inputCls} />)}
        {field('Description', 'description', <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={5000} rows={4} placeholder="Describe requirements and deliverables..." className={`${inputCls} resize-y`} />)}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Reward (ALGO)</label>
            <input type="number" value={form.rewardAlgo} onChange={e => setForm(f => ({ ...f, rewardAlgo: parseFloat(e.target.value) }))} min={1} max={100} step={0.5} className={inputCls} />
            {errors.rewardAlgo && <p className="text-color-error text-xs mt-1">{errors.rewardAlgo}</p>}
          </div>
        </div>
        {field('Deadline', 'deadline', <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} min={minDeadline()} className={`${inputCls} [color-scheme:dark]`} />)}
        <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-algo-teal text-bg-base font-semibold rounded-btn hover:bg-algo-teal/90 transition-colors disabled:opacity-50 text-sm mt-3">
          Post Bounty & Lock ALGO →
        </button>
      </form>
    </>
  )
}
