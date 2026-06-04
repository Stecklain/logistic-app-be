const { expect } = require('chai')
const request = require('supertest')
const { setupTestApp, teardownTestApp } = require('./helpers/test-app')

describe('Health route', () => {
  let app: any

  before(async () => {
    app = await setupTestApp()
  })

  after(async () => {
    await teardownTestApp()
  })

  it('returns ok status', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).to.equal(200)
    expect(response.body).to.deep.equal({ status: 'ok' })
  })
})
