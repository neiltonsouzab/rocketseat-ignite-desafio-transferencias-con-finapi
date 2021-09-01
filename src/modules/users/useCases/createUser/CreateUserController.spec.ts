import request from 'supertest'
import { Connection, createConnection, getConnectionOptions } from 'typeorm'

import { app } from '../../../../app'

let connection: Connection

describe('CreateUserController', () => {
  beforeAll(async () => {
    let options = await getConnectionOptions()
    Object.assign(options, { database: 'fin_api_test' })
    connection = await createConnection(options)
    await connection.runMigrations()
  })

  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close();
  })

  it('should be able to create a new user', async () => {
    const response = await request(app).post('/api/v1/users').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '1234'
    })

    expect(response.status).toBe(201)
  })

  it('should not be able to create a new user with email already exists', async () => {
    await request(app).post('/api/v1/users').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '1234'
    })

    const response = await request(app).post('/api/v1/users').send({
      name: 'Mary Doe',
      email: 'johndoe@example.com',
      password: '1234'
    })

    expect(response.status).toBe(400)
  })
})
