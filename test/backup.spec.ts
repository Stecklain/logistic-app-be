const { expect } = require('chai')
const fs = require('fs')
const { createBackup, restoreBackup } = require('../src/services/backup.service')

describe('Backup service', () => {
  const connection = {
    host: process.env.TEST_DB_HOST,
    port: process.env.TEST_DB_PORT,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME,
  }
  let backupPath: string

  after(() => {
    if (backupPath && fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath)
    }
  })

  it('creates a non-empty SQL dump file', async () => {
    backupPath = await createBackup(connection)

    expect(fs.existsSync(backupPath)).to.be.true

    const contents = fs.readFileSync(backupPath, 'utf-8')
    expect(contents.length).to.be.greaterThan(0)
    expect(contents).to.include('PostgreSQL database dump')
  })

  it('restores from a backup file without throwing', async () => {
    await restoreBackup(backupPath, connection)
  })

  it('rejects restoring from a missing file', async () => {
    let error: unknown
    try {
      await restoreBackup('/no/existe/archivo.sql', connection)
    } catch (err) {
      error = err
    }

    expect(error).to.be.instanceOf(Error)
  })
})
