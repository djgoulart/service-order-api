import { AppModule } from '@/app.module'
import { PrismaService } from '@/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

describe('Create account (E2E)', async () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[POST] /accounts', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'John Doe',
      email: 'johndoe@email.com',
      password: '123456',
    })

    expect(response.statusCode).toBe(201)

    const userWasPersistedOnDatabase = await prisma.user.findUnique({
      where: {
        email: 'johndoe@email.com',
      },
    })

    expect(userWasPersistedOnDatabase).toBeTruthy()
  })

  test('[POST] /accounts should reject duplicated e-mail', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'John Doe',
      email: 'johndoe@email.com',
      password: '123456',
    })

    expect(response.statusCode).toBe(409)
  })

  test('[POST] /accounts should reject invalid e-mail', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'John Doe',
      email: 'invalid-email.com',
      password: '123456',
    })

    expect(response.statusCode).toBe(400)

    const userWasPersistedOnDatabase = await prisma.user.findUnique({
      where: {
        email: 'invalid-email.com',
      },
    })

    expect(userWasPersistedOnDatabase).toBeFalsy()
  })

  test('[POST] /accounts should reject if no name was provided', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      email: 'valid@email.com',
      password: '123456',
    })

    expect(response.statusCode).toBe(400)

    const userWasPersistedOnDatabase = await prisma.user.findUnique({
      where: {
        email: 'valid@email.com',
      },
    })

    expect(userWasPersistedOnDatabase).toBeFalsy()
  })

  test('[POST] /accounts should reject if no password was provided', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      email: 'valid@email.com',
      name: 'John',
    })

    expect(response.statusCode).toBe(400)

    const userWasPersistedOnDatabase = await prisma.user.findUnique({
      where: {
        email: 'valid@email.com',
      },
    })

    expect(userWasPersistedOnDatabase).toBeFalsy()
  })

  test('[POST] /accounts should reject if no email was provided', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'Paul the unique',
      password: '123456',
    })

    expect(response.statusCode).toBe(400)

    const userWasPersistedOnDatabase = await prisma.user.findFirst({
      where: {
        name: 'Paul the unique',
      },
    })

    expect(userWasPersistedOnDatabase).toBeFalsy()
  })

  afterAll(async () => {
    await app.close()
  })
})
