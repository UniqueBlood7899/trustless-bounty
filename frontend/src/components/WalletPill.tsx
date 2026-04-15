'use client'
import { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { getAlgoBalance, truncateAddress } from '@/lib/algorand'

export function WalletPill() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!address) { setBalance(null); return }
    getAlgoBalance(address).then(setBalance)
  }, [address])

  if (!isConnected) {
    return (
      <button onClick={connect} disabled={isConnecting}
        className="px-4 py-2 rounded-btn border border-algo-teal text-algo-teal text-sm font-medium hover:bg-algo-teal-dim transition-colors disabled:opacity-50">
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-4 py-2 rounded-btn bg-algo-teal-dim border border-algo-teal/30 text-sm font-medium hover:border-algo-teal/60 transition-colors">
        <span className="text-algo-teal font-mono text-xs">⬡</span>
        {balance !== null && <span className="text-algo-teal font-semibold">{balance.toFixed(2)} ALGO</span>}
        <span className="text-text-secondary">|</span>
        <span className="text-text-primary font-mono text-xs">{truncateAddress(address!)}</span>
        <span className="text-text-muted text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 glass-card py-2 z-50">
          <button onClick={() => { navigator.clipboard.writeText(address!); setOpen(false) }}
            className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            Copy address
          </button>
          <button onClick={() => { disconnect(); setOpen(false) }}
            className="w-full px-4 py-2 text-left text-sm text-color-error hover:bg-white/5 transition-colors">
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
