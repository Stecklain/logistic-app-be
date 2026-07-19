const { expect } = require('chai')
const request = require('supertest')
const { setupTestApp, teardownTestApp } = require('./helpers/test-app')

describe('Error handling', () => {
  let app: any

  before(async () => {
    app = await setupTestApp()
  })

  after(async () => {
    await teardownTestApp()
  })

  it('returns a JSON 404 for unknown routes', async () => {
    const response = await request(app).get('/api/does-not-exist')

    expect(response.status).to.equal(404)
    expect(response.body.message).to.be.a('string')
  })

  it('returns a JSON error for malformed request bodies instead of crashing', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": invalid}')

    expect(response.status).to.equal(400)
    expect(response.body.message).to.be.a('string')
  })
})
