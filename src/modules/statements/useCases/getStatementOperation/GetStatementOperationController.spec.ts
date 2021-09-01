import { hash } from 'bcryptjs'
import { Connection, createConnection, getConnectionOptions } from 'typeorm'
import { v4 as uuidV4 } from 'uuid'
import request from 'supertest'

import { app } from '../../../../app'

let connection: Connection


describe('GetStatementOperationController', () => {
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

  it('should be able to get statement operation', async () => {
    const { body: { token } } = await request(app).post('/api/v1/sessions').send({
      email: 'admin@admin.com',
      password: 'admin'
    })

    const { body: statement } = await request(app)
      .post('/api/v1/statements/deposit')
      .set({ Authorization: `Bearer ${token}`})
      .send({ description: "Sallary", amount: 500 })

    const response = await request(app)
      .get(`/api/v1/statements/${statement.id}`)
      .set({ Authorization: `Bearer ${token}`})

    expect(response.body.id).toBe(statement.id)
  })
})
