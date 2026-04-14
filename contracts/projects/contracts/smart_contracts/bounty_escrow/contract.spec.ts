import { expect, test, describe, beforeAll, beforeEach } from 'vitest'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { BountyEscrowFactory, BountyEscrowClient } from '../artifacts/bounty_escrow/BountyEscrowClient'
import * as algosdk from 'algosdk'

describe('BountyEscrow Smart Contract', () => {
  let algorand: AlgorandClient
  let creatorAccount: algosdk.Account
  let solverAccount: algosdk.Account
  let factory: BountyEscrowFactory
  let appClient: BountyEscrowClient

  const REWARD_AMOUNT = 1_500_000n
  const MIN_BAL = 200_000n

  beforeAll(async () => {
    algorand = AlgorandClient.defaultLocalNet()
    creatorAccount = algorand.account.random()
    solverAccount = algorand.account.random()

    // Fund accounts
    const dispenser = await algorand.account.dispenser()
    await algorand.send.payment({
      sender: dispenser.addr,
      signer: algosdk.makeBasicAccountTransactionSigner(dispenser),
      receiver: creatorAccount.addr,
      amount: algosdk.algos(10),
    })

    await algorand.send.payment({
      sender: dispenser.addr,
      signer: algosdk.makeBasicAccountTransactionSigner(dispenser),
      receiver: solverAccount.addr,
      amount: algosdk.algos(2),
    })
  })

  beforeEach(async () => {
    // New app creation for each test
    factory = new BountyEscrowFactory({
      algorand,
      defaultSender: creatorAccount.addr,
      defaultSigner: algosdk.makeBasicAccountTransactionSigner(creatorAccount),
    })

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now

    const deployResult = await factory.send.create.createApplication({
      args: [REWARD_AMOUNT, deadline],
    })

    appClient = deployResult.appClient

    // Fund Escrow
    await algorand.send.payment({
      sender: creatorAccount.addr,
      signer: algosdk.makeBasicAccountTransactionSigner(creatorAccount),
      receiver: appClient.appAddress,
      amount: algosdk.microAlgos(Number(REWARD_AMOUNT + MIN_BAL)),
    })
  })

  test('Initialization (1.2): sets reward, deadline, and creator correctly', async () => {
    const s = await appClient.state.global.getAll()
    expect(s.rewardAmount).toBe(REWARD_AMOUNT)
    expect(s.creatorWallet).toBe(creatorAccount.addr)
    expect(s.isPaid).toBe(0n)
    expect(s.isRefunded).toBe(0n)
  })

  test('Escrow Mechanics (2.1): payout to winner', async () => {
    const preBal = await algorand.account.getInformation(solverAccount.addr)

    // Creator calls payout
    await appClient.send.payout({ args: [solverAccount.addr] })

    const postBal = await algorand.account.getInformation(solverAccount.addr)

    // Winner gets exactly REWARD_AMOUNT + accounts for any tx fees or opt-ins if necessary
    // Because solver wasn't making the tx (creator pays fee), solver receives exact amount.
    expect(BigInt(postBal.amount) - BigInt(preBal.amount)).toBe(REWARD_AMOUNT)

    // Assert state update
    const state = await appClient.state.global.getAll()
    expect(state.isPaid).toBe(1n)
    expect(state.winner).toBe(solverAccount.addr)
  })

  test('Escrow Mechanics (2.1): payout auth assertion limits to creator', async () => {
    const maliciousClient = appClient.clone({
      sender: solverAccount.addr,
      signer: algosdk.makeBasicAccountTransactionSigner(solverAccount),
    })

    await expect(
      maliciousClient.send.payout({ args: [creatorAccount.addr] })
    ).rejects.toThrow(/Only creator can call payout/)
  })
})
