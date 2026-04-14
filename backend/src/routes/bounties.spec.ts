import request from 'supertest'
import express from 'express'
import bountiesRouter from './bounties'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

const app = express()
app.use(express.json())
app.use('/api/bounties', bountiesRouter)

// Simple error handler for tests
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({ success: false, error: err.message })
})

// Mock algorandService
jest.mock('../services/algorandService', () => ({
  deployBountyEscrow: jest.fn().mockResolvedValue({
    appId: 1001,
    appAddress: 'MOCKAPPADDRESS',
    txId: 'MOCKTXID',
  }),
}))

describe('Bounty API (Task 4.2)', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  describe('POST /api/bounties', () => {
    it('fails validation on missing fields', async () => {
      const res = await request(app).post('/api/bounties').send({ title: 'Missing Things' })
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toMatch(/All fields are required/)
    })

    it('fails validation on invalid reward range', async () => {
      const res = await request(app).post('/api/bounties').send({
        title: 'Task',
        description: 'Do work',
        category: 'Backend',
        rewardAlgo: 500, // Invalid reward (>100)
        deadline: '2026-12-31T00:00:00Z',
        posterAddress: 'dummy'
      })
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toMatch(/rewardAlgo must be a number between 1 and 100/)
    })

    it('successfully creates bounty, saves to DB and calls mocked algokit layer', async () => {
      const res = await request(app).post('/api/bounties').send({
        title: 'Valid Bounty',
        description: 'Valid Desc',
        category: 'Smart Contracts',
        rewardAlgo: 1.5,
        deadline: '2027-01-01T00:00:00Z',
        posterAddress: 'DUMMYALGOADDRESS'
      })
      
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.appId).toBe(1001)
      expect(res.body.data.txId).toBe('MOCKTXID')
      expect(res.body.data.bounty.creationTxId).toBe('MOCKTXID')
      expect(res.body.data.bounty.rewardMicroAlgo).toBe(1500000)
    })
  })
})
