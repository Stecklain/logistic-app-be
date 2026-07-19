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

  it('rejects invalid state transitions', async () => {
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

    await request(app)
      .patch(`/api/pedidos/${created.body.id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'entregado' })

    const response = await request(app)
      .patch(`/api/pedidos/${created.body.id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'cancelado' })

    expect(response.status).to.equal(400)
  })

  it('finds pedidos by localidad ignoring accents', async () => {
    await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        direccionDestino: 'Av. Santa Fe 1111',
        localidad: 'Córdoba',
        fechaEntrega: '2026-06-05',
        lat: -31.4,
        lng: -64.2,
      })

    const response = await request(app)
      .get('/api/pedidos?localidad=cordoba')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).to.equal(200)
    expect(response.body.items).to.have.length(1)
  })

  it('rejects editing a delivered pedido', async () => {
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

    await request(app)
      .patch(`/api/pedidos/${created.body.id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'entregado' })

    const response = await request(app)
      .put(`/api/pedidos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ direccionDestino: 'Otra direccion 999' })

    expect(response.status).to.equal(400)
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

  it('returns aggregated report data', async () => {
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
      .get('/api/pedidos/reporte')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).to.equal(200)
    expect(response.body).to.have.all.keys(
      'porLocalidadYMes',
      'porEstado',
      'porEstadoYMes'
    )
    expect(response.body.porLocalidadYMes).to.be.an('array').with.length.greaterThan(0)
    expect(response.body.porEstado).to.be.an('array').with.length.greaterThan(0)
    expect(response.body.porEstadoYMes).to.be.an('array')
  })

  it('only aggregates entregado/cancelado in porEstadoYMes', async () => {
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

    await request(app)
      .patch(`/api/pedidos/${created.body.id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'entregado' })

    const response = await request(app)
      .get('/api/pedidos/reporte')
      .set('Authorization', `Bearer ${token}`)

    const estados = response.body.porEstadoYMes.map((row: { estado: string }) => row.estado)
    expect(estados.every((estado: string) => ['entregado', 'cancelado'].includes(estado))).to
      .be.true
    expect(estados).to.include('entregado')
  })

  it('filters the report by year and month', async () => {
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

    const now = new Date()
    const futureYear = now.getFullYear() + 5

    const response = await request(app)
      .get(`/api/pedidos/reporte?anio=${futureYear}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).to.equal(200)
    expect(response.body.porEstado).to.have.length(0)
  })
})
