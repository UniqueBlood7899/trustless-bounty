'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { PeraWalletConnect } from '@perawallet/connect'

const peraWallet = new PeraWalletConnect()

interface WalletContextValue {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
})

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    peraWallet.reconnectSession()
      .then((accounts: string[]) => { if (accounts.length > 0) setAddress(accounts[0]) })
      .catch(() => {})
    peraWallet.connector?.on('disconnect', () => setAddress(null))
  }, [])

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true)
      const accounts = await peraWallet.connect()
      setAddress(accounts[0])
    } catch {}
    finally { setIsConnecting(false) }
  }, [])

  const disconnect = useCallback(() => { peraWallet.disconnect(); setAddress(null) }, [])

  return (
    <WalletContext.Provider value={{ address, isConnected: !!address, isConnecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => useContext(WalletContext)
