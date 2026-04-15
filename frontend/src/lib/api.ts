const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export interface Bounty {
  _id: string
  title: string
  description: string
  category: 'Frontend' | 'Backend' | 'Smart Contracts' | 'Data Tasks' | 'General'
  rewardMicroAlgo: number
  rewardAlgo: number
  deadline: string
  posterAddress: string
  appId: number
  creationTxId: string
  status: 'open' | 'won' | 'expired' | 'refunded'
  createdAt: string
  updatedAt: string
}

export async function fetchBounties(params: { category?: string; sort?: string; page?: number; limit?: number } = {}): Promise<{ success: boolean; data: Bounty[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams()
  if (params.category) query.set('category', params.category)
  if (params.sort) query.set('sort', params.sort)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  const res = await fetch(`${API_URL}/api/bounties?${query}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch bounties: ${res.status}`)
  return res.json()
}

export async function fetchBounty(id: string): Promise<{ success: boolean; data: Bounty }> {
  const res = await fetch(`${API_URL}/api/bounties/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch bounty: ${res.status}`)
  return res.json()
}

export async function createBounty(body: { title: string; description: string; category: string; rewardAlgo: number; deadline: string; posterAddress: string }): Promise<{ success: boolean; data: { bountyId: string; appId: number; txId: string; bounty: Bounty } }> {
  const res = await fetch(`${API_URL}/api/bounties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Failed to create bounty')
  return json
}
