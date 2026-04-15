import algosdk from 'algosdk'

const ALGOD_URL = process.env.NEXT_PUBLIC_ALGOD_URL ?? 'https://testnet-api.algonode.cloud'
export const algodClient = new algosdk.Algodv2('', ALGOD_URL, '')

export async function getAlgoBalance(address: string): Promise<number | null> {
  try {
    const info = await algodClient.accountInformation(address).do()
    return Number(info.amount) / 1_000_000
  } catch { return null }
}

export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 3) return address
  return `${address.slice(0, head)}...${address.slice(-tail)}`
}

export function explorerTxUrl(txId: string): string {
  return `https://testnet.explorer.perawallet.app/tx/${txId}`
}
