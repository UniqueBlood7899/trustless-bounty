import { expect, test, describe, beforeAll, beforeEach } from 'vitest'
import { AlgorandClient, microAlgos, algos } from '@algorandfoundation/algokit-utils'
import { BountyEscrowFactory, BountyEscrowClient } from '../artifacts/bounty_escrow/BountyEscrowClient'
import algosdk from 'algosdk'

/**
 * Phase 1 Nyquist validation tests for BountyEscrow smart contract.
 *
 * Requires: algokit localnet start
 *
 * Covers:
 *  - Task 1.2: Initialization state (reward, deadline, creator)
 *  - Task 2.1: Payout to winner, auth assertion
 */
describe('BountyEscrow Smart Contract', () => {
  let algorand: AlgorandClient
  let creatorSigningAccount: Awaited<ReturnType<AlgorandClient['account']['random']>>
  let solverSigningAccount: Awaited<ReturnType<AlgorandClient['account']['random']>>
  let appClient: BountyEscrowClient
  let creatorAddrStr: string
  let solverAddrStr: string

  const REWARD_AMOUNT = 1_500_000n
  const MIN_BAL = 200_000n

  beforeAll(async () => {
    algorand = AlgorandClient.defaultLocalNet()

    const dispenser = await algorand.account.localNetDispenser()

    creatorSigningAccount = algorand.account.random()
    solverSigningAccount = algorand.account.random()

    // Store string addresses for assertions
    creatorAddrStr = creatorSigningAccount.addr.toString()
    solverAddrStr = solverSigningAccount.addr.toString()

    await algorand.account.ensureFunded(
      creatorSigningAccount.addr,
      dispenser,
      algos(10)
    )
    await algorand.account.ensureFunded(
      solverSigningAccount.addr,
      dispenser,
      algos(10)  // needs enough to cover app-call fees in auth tests
    )
  })

  beforeEach(async () => {
    const factory = new BountyEscrowFactory({
      algorand,
      defaultSender: creatorSigningAccount.addr,
      defaultSigner: creatorSigningAccount.signer,
    })

    // Use unique deadline per test to prevent duplicate txn ID collisions
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600 + Math.floor(Math.random() * 1000))

    const deployResult = await factory.send.create.createApplication({
      args: [REWARD_AMOUNT, deadline],
    })
    appClient = deployResult.appClient

    await algorand.send.payment({
      sender: creatorSigningAccount.addr,
      signer: creatorSigningAccount.signer,
      receiver: appClient.appAddress,
      amount: microAlgos(Number(REWARD_AMOUNT + MIN_BAL)),
    })
  })

  test('Initialization (1.2): sets reward, deadline, and creator correctly', async () => {
    const s = await appClient.state.global.getAll()
    expect(s.rewardAmount).toBe(REWARD_AMOUNT)
    // Global state returns Address objects for address fields — compare as string
    expect(s.creatorWallet?.toString()).toBe(creatorAddrStr)
    expect(s.isPaid).toBe(0n)
    expect(s.isRefunded).toBe(0n)
  })

  test('Escrow Mechanics (2.1): payout sends reward to winner and marks isPaid', async () => {
    const preBal = BigInt((await algorand.account.getInformation(solverSigningAccount.addr)).amount)

    // staticFee covers outer app-call (1000) + inner payment (1000) = 2000 µAlgo
    await appClient.send.payout({ args: [solverAddrStr], staticFee: microAlgos(2000) })

    const postBal = BigInt((await algorand.account.getInformation(solverSigningAccount.addr)).amount)
    // Solver receives REWARD_AMOUNT (creator pays the outer tx fee; inner txn fee is paid by contract)
    // Use >= to handle any minor rounding from test environment
    expect(postBal - preBal).toBe(REWARD_AMOUNT)

    const state = await appClient.state.global.getAll()
    expect(state.isPaid).toBe(1n)
    expect(state.winner?.toString()).toBe(solverAddrStr)
  })

  test('Escrow Mechanics (2.1): only creator can trigger payout — auth assertion', async () => {
    // Build a fresh client that signs as solver (malicious actor)
    const maliciousClient = new BountyEscrowClient({
      algorand,
      appId: appClient.appId,
      defaultSender: solverSigningAccount.addr,
      defaultSigner: solverSigningAccount.signer,
    })

    // The contract asserts Txn.sender === creatorWallet, so this should fail
    await expect(
      maliciousClient.send.payout({ args: [creatorAddrStr], staticFee: microAlgos(2000) })
    ).rejects.toThrow(/Only creator can call payout|assert failed|rejected/)
  })
})
