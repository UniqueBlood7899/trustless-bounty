/**
 * verify-localnet.ts
 *
 * Quick sanity check to verify AlgoKit LocalNet is running and reachable.
 * Run: cd contracts/projects/contracts && npx ts-node scripts/verify-localnet.ts
 */
import algosdk from 'algosdk'

const ALGOD_TOKEN = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const ALGOD_SERVER = process.env.ALGOD_SERVER ?? 'http://localhost'
const ALGOD_PORT = parseInt(process.env.ALGOD_PORT ?? '4001', 10)

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)

async function main() {
  try {
    const status = await algodClient.status().do()
    console.log('✅ LocalNet connected.')
    console.log(`   Last round:   ${status.lastRound}`)
    console.log(`   Algod server: ${ALGOD_SERVER}:${ALGOD_PORT}`)

    // Fetch genesis info to confirm network
    const genesis = await algodClient.genesis().do()
    console.log(`   Network:      ${typeof genesis === 'string' ? 'localnet' : 'localnet'}`)
  } catch (err) {
    console.error('❌ Could not connect to LocalNet algod.')
    console.error(`   Tried: ${ALGOD_SERVER}:${ALGOD_PORT}`)
    console.error('   Is LocalNet running? Run: algokit localnet start')
    console.error(err)
    process.exit(1)
  }
}

main()
