const { expect } = require('chai')
const request = require('supertest')
const { resetDatabase, setupTestApp, teardownTestApp } = require('./helpers/test-app')
const { getDataSource } = require('../src/repositories/data-source')
const { User } = require('../src/entities/User')

describe('User routes', () => {
  let app: any
  let adminToken = ''
  let logisticaToken = ''
  let logisticaUserId = ''

  before(async () => {
    app = await setupTestApp()
  })

  beforeEach(async () => {
    await resetDatabase()

    await request(app).post('/api/auth/register').send({
      email: 'admin@test.com',
      password: 'password123',
    })
    const repo = getDataSource().getRepository(User)
    const adminUser = await repo.findOneBy({ email: 'admin@test.com' })
    adminUser.role = 'admin'
    await repo.save(adminUser)

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    })
    adminToken = adminLogin.body.token

    const logisticaRegister = await request(app).post('/api/auth/register').send({
      email: 'logistica@test.com',
      password: 'password123',
    })
    logisticaUserId = logisticaRegister.body.user.id

    const logisticaLogin = await request(app).post('/api/auth/login').send({
      email: 'logistica@test.com',
      password: 'password123',
    })
    logisticaToken = logisticaLogin.body.token
  })

  after(async () => {
    await teardownTestApp()
  })

  it('lets an admin create a user', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'nuevo@test.com', password: 'password123', role: 'logistica' })

    expect(response.status).to.equal(201)
    expect(response.body.email).to.equal('nuevo@test.com')
    expect(response.body.passwordHash).to.equal(undefined)
  })

  it('lets an admin list users', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(response.status).to.equal(200)
    expect(response.body.items.length).to.be.greaterThan(0)
  })

  it('filters users by email ignoring accents', async () => {
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'ramon@test.com', password: 'password123', role: 'logistica' })

    const response = await request(app)
      .get('/api/users?email=ramon')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(response.status).to.equal(200)
    expect(response.body.items).to.have.length(1)
    expect(response.body.items[0].email).to.equal('ramon@test.com')
  })

  it('filters users by role and active status', async () => {
    const roleResponse = await request(app)
      .get('/api/users?role=admin')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(roleResponse.status).to.equal(200)
    expect(roleResponse.body.items.every((u: { role: string }) => u.role === 'admin')).to.be
      .true

    await request(app)
      .put(`/api/users/${logisticaUserId}/role-active`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false })

    const activeResponse = await request(app)
      .get('/api/users?active=false')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(activeResponse.status).to.equal(200)
    expect(
      activeResponse.body.items.some((u: { id: string }) => u.id === logisticaUserId)
    ).to.be.true
  })

  it('paginates the users list', async () => {
    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `paginado${i}@test.com`, password: 'password123', role: 'logistica' })
    }

    const response = await request(app)
      .get('/api/users?page=1&pageSize=2')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(response.status).to.equal(200)
    expect(response.body.items).to.have.length(2)
    expect(response.body.totalPages).to.be.greaterThan(1)
  })

  it("lets an admin edit another user's email", async () => {
    const response = await request(app)
      .put(`/api/users/${logisticaUserId}/email`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'editado@test.com' })

    expect(response.status).to.equal(200)
    expect(response.body.email).to.equal('editado@test.com')
  })

  it("lets an admin reset another user's password", async () => {
    const resetResponse = await request(app)
      .put(`/api/users/${logisticaUserId}/password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: 'newpassword123' })

    expect(resetResponse.status).to.equal(200)

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'logistica@test.com',
      password: 'newpassword123',
    })

    expect(loginResponse.status).to.equal(200)
  })

  it('lets an admin deactivate a user, blocking their login', async () => {
    const deactivateResponse = await request(app)
      .put(`/api/users/${logisticaUserId}/role-active`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false })

    expect(deactivateResponse.status).to.equal(200)

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'logistica@test.com',
      password: 'password123',
    })

    expect(loginResponse.status).to.equal(401)
  })

  it('rejects non-admin access to admin-only routes', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${logisticaToken}`)

    expect(response.status).to.equal(403)
  })

  it('lets any authenticated user change their own password', async () => {
    const response = await request(app)
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${logisticaToken}`)
      .send({ currentPassword: 'password123', newPassword: 'nuevaClave123' })

    expect(response.status).to.equal(200)

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'logistica@test.com',
      password: 'nuevaClave123',
    })
    expect(loginResponse.status).to.equal(200)
  })

  it('rejects self password change with wrong current password', async () => {
    const response = await request(app)
      .put('/api/users/me/password')
      .set('Authorization', `Bearer ${logisticaToken}`)
      .send({ currentPassword: 'wrong-pass', newPassword: 'nuevaClave123' })

    expect(response.status).to.equal(400)
  })
})
