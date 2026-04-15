import algosdk from 'algosdk'
import { AlgorandClient, microAlgos } from '@algorandfoundation/algokit-utils'
import { BountyEscrowFactory, BountyEscrowClient } from '../contracts/BountyEscrowClient'

/**
 * algorandService.ts — Algorand integration layer for BountyChain.
 * Phase 1: deployBountyEscrow
 * Phase 6: payoutBountyEscrow, refundBountyEscrow
 */

export function getAlgorandClient(): AlgorandClient {
  const network = process.env.ALGORAND_NETWORK ?? 'localnet'
  if (network === 'localnet') return AlgorandClient.defaultLocalNet()
  return AlgorandClient.fromConfig({
    algodConfig: {
      server: process.env.ALGOD_SERVER ?? 'https://testnet-api.algonode.cloud',
      token: process.env.ALGOD_TOKEN ?? '',
      port: (process.env.ALGOD_PORT ?? '').toString(),
    },
  })
}

function getServerAccount(): algosdk.Account {
  const mnemonic = process.env.SERVER_WALLET_MNEMONIC
  if (!mnemonic) throw new Error('SERVER_WALLET_MNEMONIC is not set.')
  return algosdk.mnemonicToSecretKey(mnemonic)
}

export interface DeployResult { appId: number; appAddress: string; txId: string }
export interface PayoutResult { txId: string }

export async function deployBountyEscrow(
  posterAddress: string,
  bountyId: string,
  rewardMicroAlgo: number,
  deadlineTimestamp?: number,
): Promise<DeployResult> {
  const algorand = getAlgorandClient()
  const serverAccount = getServerAccount()
  const deadline = deadlineTimestamp ?? Math.floor(Date.now() / 1000) + 7 * 24 * 3600

  console.log(`[algorandService] Deploying BountyEscrow: bountyId=${bountyId}, reward=${rewardMicroAlgo} µALGO, deadline=${deadline}`)

  const factory = new BountyEscrowFactory({
    algorand,
    defaultSender: serverAccount.addr,
    defaultSigner: algosdk.makeBasicAccountTransactionSigner(serverAccount),
  })

  const { appClient, result } = await factory.send.create.createApplication({
    args: [BigInt(rewardMicroAlgo), BigInt(deadline)],
  })

  const appId = Number(appClient.appId)
  const appAddress = appClient.appAddress.toString()
  const txId = result.transaction.txID()

  console.log(`[algorandService] Deployed: appId=${appId}, address=${appAddress}`)

  const minBalance = 200_000
  await algorand.send.payment({
    sender: serverAccount.addr,
    signer: algosdk.makeBasicAccountTransactionSigner(serverAccount),
    receiver: appAddress,
    amount: microAlgos(rewardMicroAlgo + minBalance),
    note: `BountyChain escrow fund (bountyId=${bountyId})`,
  })

  console.log(`[algorandService] Funded escrow with ${rewardMicroAlgo + minBalance} µALGO`)
  return { appId, appAddress, txId }
}

/**
 * payoutBountyEscrow — calls BountyEscrow.payout(winnerAddress) to release ALGO to winner.
 * Only callable by the contract creator (server wallet).
 */
export async function payoutBountyEscrow(appId: number, winnerAddress: string): Promise<PayoutResult> {
  const algorand = getAlgorandClient()
  const serverAccount = getServerAccount()
  console.log(`[algorandService] Calling payout: appId=${appId}, winner=${winnerAddress}`)

  const appClient = new BountyEscrowClient({
    algorand,
    appId: BigInt(appId),
    defaultSender: serverAccount.addr,
    defaultSigner: algosdk.makeBasicAccountTransactionSigner(serverAccount),
  })

  const result = await appClient.send.payout({
    args: { winnerAccount: winnerAddress },
    extraFee: microAlgos(1000),
  })

  const txId = result.transaction.txID()
  console.log(`[algorandService] Payout complete: txId=${txId}`)
  return { txId }
}

/**
 * refundBountyEscrow — calls BountyEscrow.refund() to return ALGO to creator after deadline.
 */
export async function refundBountyEscrow(appId: number): Promise<PayoutResult> {
  const algorand = getAlgorandClient()
  const serverAccount = getServerAccount()
  console.log(`[algorandService] Calling refund: appId=${appId}`)

  const appClient = new BountyEscrowClient({
    algorand,
    appId: BigInt(appId),
    defaultSender: serverAccount.addr,
    defaultSigner: algosdk.makeBasicAccountTransactionSigner(serverAccount),
  })

  const result = await appClient.send.refund({
    args: {},
    extraFee: microAlgos(1000),
  })

  const txId = result.transaction.txID()
  console.log(`[algorandService] Refund complete: txId=${txId}`)
  return { txId }
}
