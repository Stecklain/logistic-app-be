const { expect } = require('chai')
const request = require('supertest')
const { resetDatabase, setupTestApp, teardownTestApp } = require('./helpers/test-app')

describe('Pedido routes', () => {
  let app: any
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
  })

  after(async () => {
    await teardownTestApp()
  })

  it('creates a pedido', async () => {
    const response = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        direccionDestino: 'Av. Santa Fe 1111',
        localidad: 'Buenos Aires',
        fechaEntrega: '2026-06-05',
        lat: -34.6,
        lng: -58.4,
      })

    expect(response.status).to.equal(201)
    expect(response.body.codigoTracking).to.match(/^TRK-/)
  })

  it('rejects unauthenticated access', async () => {
    const response = await request(app).get('/api/pedidos')
    expect(response.status).to.equal(401)
  })

  it('rejects invalid tokens', async () => {
    const response = await request(app)
      .get('/api/pedidos')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).to.equal(401)
  })

  it('lists paginated pedidos', async () => {
    await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        direccionDestino: 'Av. Santa Fe 1111',
        localidad: 'Buenos Aires',
        fechaEntrega: '2026-06-05',
        lat: -34.6,
        lng: -58.4,
      })

    const response = await request(app)
      .get('/api/pedidos?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).to.equal(200)
    expect(response.body.items).to.have.length(1)
  })

  it('updates pedido state', async () => {
    const created = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        direccionDestino: 'Av. Santa Fe 1111',
        localidad: 'Buenos Aires',
        fechaEntrega: '2026-06-05',
        lat: -34.6,
        lng: -58.4,
      })

    const response = await request(app)
      .patch(`/api/pedidos/${created.body.id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'entregado' })

    expect(response.status).to.equal(200)
    expect(response.body.estado).to.equal('entregado')
  })

  it('deletes pedido', async () => {
    const created = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        direccionDestino: 'Av. Santa Fe 1111',
        localidad: 'Buenos Aires',
        fechaEntrega: '2026-06-05',
        lat: -34.6,
        lng: -58.4,
      })

    const response = await request(app)
      .delete(`/api/pedidos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).to.equal(204)
  })
})
