const { expect } = require('chai')
const request = require('supertest')
const { resetDatabase, setupTestApp, teardownTestApp } = require('./helpers/test-app')
const { getDataSource } = require('../src/repositories/data-source')
const { User } = require('../src/entities/User')

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

  it('returns validation messages in Spanish', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: '',
      password: '123',
    })

    expect(response.status).to.equal(400)
    expect(response.body.message).to.equal('"email" no puede estar vacío')
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

  it('includes role in the login response', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    expect(response.body.user.role).to.equal('logistica')
  })

  it('rejects login for a deactivated user', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    const repo = getDataSource().getRepository(User)
    const user = await repo.findOneBy({ email: 'admin@test.com' })
    user.active = false
    await repo.save(user)

    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    expect(response.status).to.equal(401)
    expect(response.body.message).to.equal('Usuario deshabilitado')
  })

  it('locks the account after 3 consecutive failed login attempts', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    for (let i = 0; i < 3; i += 1) {
      await request(app).post('/api/auth/login').send({
        email: 'admin@test.com',
        password: 'bad-pass',
      })
    }

    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    expect(response.status).to.equal(401)
    expect(response.body.message).to.match(/bloqueada/i)
  })

  it('resets the failed attempt counter after a successful login', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'bad-pass',
    })
    await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'bad-pass',
    })

    const successResponse = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    })
    expect(successResponse.status).to.equal(200)

    await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'bad-pass',
    })
    await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'bad-pass',
    })

    const stillUnlockedResponse = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    expect(stillUnlockedResponse.status).to.equal(200)
  })

  it('allows login again once the lockout window has expired', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    for (let i = 0; i < 3; i += 1) {
      await request(app).post('/api/auth/login').send({
        email: 'admin@test.com',
        password: 'bad-pass',
      })
    }

    const repo = getDataSource().getRepository(User)
    const user = await repo.findOneBy({ email: 'admin@test.com' })
    user.lockedUntil = new Date(Date.now() - 1000)
    await repo.save(user)

    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    })

    expect(response.status).to.equal(200)
  })
})
