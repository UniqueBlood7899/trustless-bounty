'use client'
export function ConfirmationOverlay({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-base/85 backdrop-blur-[20px]">
      <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-algo-teal animate-spin mb-6" />
      <h2 className="text-text-primary text-xl font-semibold mb-2">Awaiting network confirmation…</h2>
      <p className="text-text-secondary text-sm">Check your Pera Wallet to approve the transaction.</p>
    </div>
  )
}
