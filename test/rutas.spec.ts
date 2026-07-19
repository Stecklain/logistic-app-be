const { expect } = require('chai')
const request = require('supertest')
const { resetDatabase, setupTestApp, teardownTestApp } = require('./helpers/test-app')

describe('Ruta routes', () => {
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

    await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        direccionDestino: 'Av. Santa Fe 1111',
        localidad: 'Buenos Aires',
        fechaEntrega: '2026-06-05',
        lat: -34.6,
        lng: -58.44,
      })

    await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        direccionDestino: 'Av. Corrientes 2222',
        localidad: 'Buenos Aires',
        fechaEntrega: '2026-06-05',
        lat: -34.61,
        lng: -58.39,
      })
  })

  after(async () => {
    await teardownTestApp()
  })

  it('generates a route for the day', async () => {
    const response = await request(app)
      .post('/api/rutas/generar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fecha: '2026-06-05',
        origenTexto: 'Depósito central',
        origenLat: -34.58,
        origenLng: -58.45,
      })

    expect(response.status).to.equal(201)
    expect(response.body).to.have.length(1)
    expect(response.body[0].zona).to.equal('Buenos Aires')
    expect(response.body[0].rutaPedidos).to.have.length(2)
  })

  it('generates one route per zone when pedidos are far apart', async () => {
    await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        direccionDestino: 'Av. Cabildo 3000',
        localidad: 'Belgrano',
        fechaEntrega: '2026-06-05',
        lat: -34.56,
        lng: -58.46,
      })

    const response = await request(app)
      .post('/api/rutas/generar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fecha: '2026-06-05',
        origenTexto: 'Depósito central',
        origenLat: -34.58,
        origenLng: -58.45,
      })

    expect(response.status).to.equal(201)
    expect(response.body).to.have.length(2)
    const totalParadas = response.body.reduce(
      (total: number, ruta: { rutaPedidos: unknown[] }) => total + ruta.rutaPedidos.length,
      0
    )
    expect(totalParadas).to.equal(3)
  })

  it('lists routes', async () => {
    await request(app)
      .post('/api/rutas/generar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fecha: '2026-06-05',
        origenTexto: 'Depósito central',
        origenLat: -34.58,
        origenLng: -58.45,
      })

    const response = await request(app)
      .get('/api/rutas?fecha=2026-06-05')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).to.equal(200)
    expect(response.body).to.have.length(1)
  })
})
