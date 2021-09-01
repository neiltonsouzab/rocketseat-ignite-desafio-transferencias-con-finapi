import { hash } from 'bcryptjs'
import { Connection, createConnection, getConnectionOptions } from 'typeorm'
import { v4 as uuidV4 } from 'uuid'
import request from 'supertest'

import { app } from '../../../../app'

let connection: Connection


describe('CreateStatementController', () => {
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

  it('should be able to create statement the type deposit', async () => {
    const { body: { token } } = await request(app).post('/api/v1/sessions').send({
      email: 'admin@admin.com',
      password: 'admin'
    })

    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .set({ Authorization: `Bearer ${token}`})
      .send({ description: "Sallary", amount: 500 })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('amount')
  })

  it('should be able to create statement the type withdraw', async () => {
    const { body: { token } } = await request(app).post('/api/v1/sessions').send({
      email: 'admin@admin.com',
      password: 'admin'
    })

    const response = await request(app)
      .post('/api/v1/statements/withdraw')
      .set({ Authorization: `Bearer ${token}`})
      .send({ description: "Sallary", amount: 100 })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('amount')
  })
})
