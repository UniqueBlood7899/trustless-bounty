import {
  Contract,
  uint64,
  Uint64,
  Account,
  Global,
  GlobalState,
  assert,
  itxn,
  Txn,
} from '@algorandfoundation/algorand-typescript'

/**
 * BountyEscrow — per-bounty escrow smart contract for BountyChain.
 *
 * Lifecycle:
 *  1. Backend deploys contract by calling createApplication(reward, deadline).
 *  2. Backend funds the contract address with rewardAmount microALGO.
 *  3. AI verification approves → backend calls payout(winnerAccount).
 *  4. Deadline passes with no winner → backend calls refund().
 *
 * Security:
 *  - Only the contract creator (backend server wallet) can call payout/refund.
 *  - Each operation is gated: cannot pay twice, cannot refund after payout, etc.
 */
export class BountyEscrow extends Contract {
  /** Address of the server wallet that deployed this contract */
  creatorWallet = GlobalState<Account>({ initialValue: Global.creatorAddress })

  /** Reward in microALGO locked in this escrow */
  rewardAmount = GlobalState<uint64>({ initialValue: Uint64(0) })

  /** Unix timestamp after which the poster can reclaim funds */
  deadline = GlobalState<uint64>({ initialValue: Uint64(0) })

  /** Winner account — set on payout */
  winner = GlobalState<Account>({ initialValue: Global.creatorAddress })

  /** Whether the reward has been released to a winner */
  isPaid = GlobalState<boolean>({ initialValue: false })

  /** Whether the reward has been refunded to the poster */
  isRefunded = GlobalState<boolean>({ initialValue: false })

  /**
   * createApplication — called once at contract creation.
   * Sets reward amount and deadline. The caller must fund the contract
   * address separately with rewardAmount microALGO after creation.
   *
   * @param reward - reward in microALGO
   * @param deadlineTimestamp - Unix timestamp (seconds) of expiry
   */
  createApplication(reward: uint64, deadlineTimestamp: uint64): void {
    this.creatorWallet.value = Txn.sender
    this.rewardAmount.value = reward
    this.deadline.value = deadlineTimestamp
    this.isPaid.value = false
    this.isRefunded.value = false
  }

  /**
   * payout — release escrowed ALGO to the winning solver.
   * Only callable by the contract creator (backend server wallet).
   * Executes an inner payment transaction to winnerAccount.
   *
   * @param winnerAccount - solver account that receives the reward
   */
  payout(winnerAccount: Account): void {
    assert(Txn.sender === this.creatorWallet.value, 'Only creator can call payout')
    assert(!this.isPaid.value, 'Already paid out')
    assert(!this.isRefunded.value, 'Already refunded')

    this.winner.value = winnerAccount
    this.isPaid.value = true

    // Inner transaction: send rewardAmount microALGO to winner
    itxn
      .payment({
        receiver: winnerAccount,
        amount: this.rewardAmount.value,
        note: 'BountyChain escrow payout',
      })
      .submit()
  }

  /**
   * refund — return escrowed ALGO to the original poster (via creator address).
   * Only callable by the contract creator after deadline has passed.
   * Executes an inner payment transaction back to the creator.
   */
  refund(): void {
    assert(Txn.sender === this.creatorWallet.value, 'Only creator can call refund')
    assert(!this.isPaid.value, 'Already paid out')
    assert(!this.isRefunded.value, 'Already refunded')
    assert(
      Global.latestTimestamp >= this.deadline.value,
      'Deadline has not passed yet',
    )

    this.isRefunded.value = true

    // Inner transaction: return funds to the escrow creator
    itxn
      .payment({
        receiver: this.creatorWallet.value,
        amount: this.rewardAmount.value,
        note: 'BountyChain escrow refund',
      })
      .submit()
  }

  /**
   * getState — read-only view of the current escrow state.
   * Returns [rewardAmount, deadline, isPaid, isRefunded]
   */
  getState(): readonly [uint64, uint64, boolean, boolean] {
    return [
      this.rewardAmount.value,
      this.deadline.value,
      this.isPaid.value,
      this.isRefunded.value,
    ] as const
  }
}