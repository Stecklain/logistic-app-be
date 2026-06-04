const { expect } = require('chai')
const request = require('supertest')
const { resetDatabase, setupTestApp, teardownTestApp } = require('./helpers/test-app')

describe('Tracking route', () => {
  let app: any
  let trackingCode = ''
  let token = ''

  before(async () => {
    app = await setupTestApp()
  })

  beforeEach(async () => {
    await resetDatabase()
    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    token = loginResponse.body.token

    const created = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        direccionDestino: 'Av. Santa Fe 1111',
        localidad: 'Buenos Aires',
        fechaEntrega: '2026-06-05',
        lat: -34.6,
        lng: -58.44,
      })

    trackingCode = created.body.codigoTracking
  })

  after(async () => {
    await teardownTestApp()
  })

  it('returns public tracking without sensitive data', async () => {
    const response = await request(app).get(`/api/tracking/${trackingCode}`)

    expect(response.status).to.equal(200)
    expect(response.body.codigoTracking).to.equal(trackingCode)
    expect(response.body).to.not.have.property('direccionDestino')
  })

  it('returns 404 for unknown tracking code', async () => {
    const response = await request(app).get('/api/tracking/TRK-UNKNOWN')
    expect(response.status).to.equal(404)
  })
})
