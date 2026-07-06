import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

const [action, target] = process.argv.slice(2)

if (!['create', 'drop'].includes(action) || !['dev', 'test'].includes(target)) {
  console.error('Uso: node ./scripts/manage-database.mjs <create|drop> <dev|test>')
  process.exit(1)
}

const prefix = target === 'test' ? 'TEST_DB_' : 'DB_'
const connection = {
  host: process.env[`${prefix}HOST`] || 'localhost',
  port: parseInt(process.env[`${prefix}PORT`] || '5432', 10),
  user: process.env[`${prefix}USER`] || 'logistic_app',
  password: process.env[`${prefix}PASSWORD`] || 'logistic_app',
}
const database =
  process.env[`${prefix}NAME`] || (target === 'test' ? 'logistic_db_test' : 'logistic_db')

async function run() {
  const client = new Client({ ...connection, database: 'postgres' })
  await client.connect()

  try {
    if (action === 'create') {
      const { rowCount } = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [database]
      )

      if (rowCount === 0) {
        await client.query(`CREATE DATABASE "${database}"`)
        console.log(`Base "${database}" creada.`)
      } else {
        console.log(`Base "${database}" ya existe, no se recrea.`)
      }
    } else {
      await client.query(
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
        [database]
      )
      await client.query(`DROP DATABASE IF EXISTS "${database}"`)
      console.log(`Base "${database}" eliminada.`)
    }
  } finally {
    await client.end()
  }
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
