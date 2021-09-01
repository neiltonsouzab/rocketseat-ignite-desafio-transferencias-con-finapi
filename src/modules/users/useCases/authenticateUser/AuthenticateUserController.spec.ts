import { hash } from 'bcryptjs'
import { Connection, createConnection, getConnectionOptions } from 'typeorm'
import { v4 as uuidV4 } from 'uuid'
import request from 'supertest'

import { app } from '../../../../app'

let connection: Connection


describe('AuthenticateUserController', () => {
  beforeAll(async () => {
    let options = await getConnectionOptions()
    Object.assign(options, { database: 'fin_api_test' })
    connection = await createConnection(options)
    await connection.runMigrations()

    const id = uuidV4()
    const password = await hash('admin', 8)

    await connection.query(
      `INSERT INTO users (id, name, email, password) VALUES ('${id}', 'admin', 'admin@admin.com', '${password}')`)
  })

  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close();
  })

  it('should be able to authenticate user', async () => {
    const response = await request(app).post('/api/v1/sessions').send({
      email: 'admin@admin.com',
      password: 'admin'
    })

    expect(response.body).toHaveProperty('token')
  })

  it('should not be able to authenticate user with wrong email', async () => {
    const response = await request(app).post('/api/v1/sessions').send({
      email: 'wrong@wrong.com',
      password: 'admin'
    })

    expect(response.status).toBe(401)
  })

  it('should not be able to authenticate user with wrong password', async () => {
    const response = await request(app).post('/api/v1/sessions').send({
      email: 'admin@admin.com',
      password: 'wrong'
    })

    expect(response.status).toBe(401)
  })
})
