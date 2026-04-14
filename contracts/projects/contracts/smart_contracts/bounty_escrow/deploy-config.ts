import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { BountyEscrowFactory } from '../artifacts/bounty_escrow/BountyEscrowClient'

/**
 * deploy — deploys a single BountyEscrow contract instance for testing/CI.
 *
 * In production, individual escrow contracts are deployed per-bounty
 * via the backend's algorandService.ts (not this script).
 *
 * Usage: npm run deploy (reads DEPLOYER mnemonic from .env)
 */
export async function deploy() {
  console.log('=== Deploying BountyEscrow (test/CI deploy) ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(BountyEscrowFactory, {
    defaultSender: deployer.addr,
  })

  // Test reward: 1 ALGO = 1_000_000 microALGO
  const testRewardMicroAlgo = BigInt(1_000_000)
  // Test deadline: 7 days from now
  const testDeadline = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 3600)

  const { appClient, result } = await factory.deploy({
    onUpdate: 'append',
    onSchemaBreak: 'append',
    createParams: {
      method: 'createApplication',
      args: [testRewardMicroAlgo, testDeadline],
    },
  })

  console.log(
    `Deployed BountyEscrow: appId=${appClient.appClient.appId}, address=${appClient.appAddress}`,
  )
  console.log(`Operation: ${result.operationPerformed}`)

  // Fund the escrow with 1 ALGO so it can pay out
  if (['create', 'replace'].includes(result.operationPerformed)) {
    await algorand.send.payment({
      amount: (1).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    })
    console.log(`Funded escrow with 1 ALGO`)
  }

  // Read state to verify deployment
  const state = await appClient.send.getState({ args: [] })
  console.log(
    `Escrow state: reward=${state.return?.[0]} microALGO, isPaid=${state.return?.[2]}, isRefunded=${state.return?.[3]}`,
  )

  console.log('=== BountyEscrow deployment complete ===')
}
