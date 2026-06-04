const { expect } = require('chai')
const request = require('supertest')
const { resetDatabase, setupTestApp, teardownTestApp } = require('./helpers/test-app')

describe('Auth routes', () => {
  let app: any

  before(async () => {
    app = await setupTestApp()
  })

  beforeEach(async () => {
    await resetDatabase()
  })

  after(async () => {
    await teardownTestApp()
  })

  it('registers a user with valid credentials', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    expect(response.status).to.equal(201)
    expect(response.body.user.email).to.equal('admin@test.com')
  })

  it('rejects invalid register payloads', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'bad-email',
      password: '123',
    })

    expect(response.status).to.equal(400)
  })

  it('rejects duplicate emails', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    const response = await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    expect(response.status).to.equal(409)
  })

  it('logs in with valid credentials', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    expect(response.status).to.equal(200)
    expect(response.body.token).to.be.a('string')
  })

  it('rejects invalid credentials on login', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'bad-pass',
    })

    expect(response.status).to.equal(401)
  })
})
