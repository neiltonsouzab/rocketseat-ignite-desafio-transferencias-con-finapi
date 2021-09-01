import { Connection, createConnection, getConnectionOptions } from "typeorm"
import request from 'supertest'
import { app } from "../../../../app"
import { v4 as uuidV4 } from "uuid"
import { hash } from "bcryptjs"

let connection: Connection

describe('ShowUserProfileController', () => {
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

  it('should be able to show user profile', async () => {
    const { body: { token } } = await request(app).post('/api/v1/sessions').send({
      email: 'admin@admin.com',
      password: 'admin'
    })

    const response = await request(app).get('/api/v1/profile').set({
      Authorization: `Bearer ${token}`
    });

    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('email')
  })
})
