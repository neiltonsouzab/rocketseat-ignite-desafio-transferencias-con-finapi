import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { OperationType } from "../../entities/Statement"
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository"
import { CreateStatementError } from "./CreateStatementError"
import { CreateStatementUseCase } from "./CreateStatementUseCase"

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryStatementsRepository: InMemoryStatementsRepository
let createStatementUseCase: CreateStatementUseCase

describe('CreateStatementUseCase', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryStatementsRepository = new InMemoryStatementsRepository()
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository)
  })

  it('should be able to create a new statement of type deposit', async () => {
    const user = await inMemoryUsersRepository.create({
      name: 'user-name',
      email: 'user-email',
      password: 'user-password'
    })

    const statement = await createStatementUseCase.execute({
      description: 'statement-description',
      type: OperationType.DEPOSIT,
      amount: 100,
      user_id: user.id || '',
    });

    const userBalance = await inMemoryStatementsRepository.getUserBalance({ user_id: user.id || '' });

    expect(statement).toHaveProperty('id');
    expect(userBalance.balance).toEqual(100);
  })

  it('should be able to create a new statement of type withdraw', async () => {
    const user = await inMemoryUsersRepository.create({
      name: 'user-name',
      email: 'user-email',
      password: 'user-password'
    })

    await inMemoryStatementsRepository.create({
      amount: 500,
      description: 'statement-description',
      type: OperationType.DEPOSIT,
      user_id: user.id || ''
    });

    const statement = await createStatementUseCase.execute({
      description: 'statement-description',
      type: OperationType.WITHDRAW,
      amount: 100,
      user_id: user.id || '',
    })

    const userBalance = await inMemoryStatementsRepository.getUserBalance({ user_id: user.id || '' });

    expect(statement).toHaveProperty('id')
    expect(userBalance.balance).toEqual(400);
  })

  it('should be able to create a new statement of type transfer', async () => {
    const userEmitter = await inMemoryUsersRepository.create({
      name: 'user-name',
      email: 'user-email',
      password: 'user-password'
    })

    const userSender = await inMemoryUsersRepository.create({
      name: 'user-sender-name',
      email: 'user-sender-email',
      password: 'user-sender-password'
    })

    await inMemoryStatementsRepository.create({
      amount: 500,
      description: 'statement-description',
      type: OperationType.DEPOSIT,
      user_id: userEmitter.id || ''
    });


    const statement = await createStatementUseCase.execute({
      description: 'statement-description',
      type: OperationType.TRANSFER,
      amount: 100,
      user_id: userEmitter.id || '',
      sender_id: userSender.id
    })

    const userSenderBalance = await inMemoryStatementsRepository.getUserBalance({ user_id: userSender.id || '' })
    const userEmitterBalance = await inMemoryStatementsRepository.getUserBalance({ user_id: userEmitter.id || '' })


    expect(statement).toHaveProperty('id')
    expect(userSenderBalance.balance).toEqual(100);
    expect(userEmitterBalance.balance).toEqual(400);
  })

  it('should not be able to create a new statement of non-exists user', async () => {
    await expect(createStatementUseCase.execute({
      description: 'statement-description',
      type: OperationType.DEPOSIT,
      amount: 100,
      user_id: 'non-exists',
    })).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
  })

  it('should not be able to create a new statement of type withdraw if balance less than amount', async () => {
     const user = await inMemoryUsersRepository.create({
      name: 'user-name',
      email: 'user-email',
      password: 'user-password'
    })

    await createStatementUseCase.execute({
      description: 'statement-description',
      type: OperationType.DEPOSIT,
      amount: 100,
      user_id: user.id || '',
    })

    await expect(createStatementUseCase.execute({
      description: 'statement-description',
      type: OperationType.WITHDRAW,
      amount: 200,
      user_id: user.id || '',
    })).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
  });

  it('should not be able to create a new statement of type transfer if balance less than amount', async () => {
    const user = await inMemoryUsersRepository.create({
     name: 'user-name',
     email: 'user-email',
     password: 'user-password'
   })

   await createStatementUseCase.execute({
     description: 'statement-description',
     type: OperationType.DEPOSIT,
     amount: 100,
     user_id: user.id || '',
   })

   await expect(createStatementUseCase.execute({
     description: 'statement-description',
     type: OperationType.TRANSFER,
     amount: 200,
     user_id: user.id || '',
     sender_id: 'user-sender'
   })).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
 })


  it('should not be able to create a new statement of type deposit passing sender user', async () => {
    const user = await inMemoryUsersRepository.create({
      name: 'user-name',
      email: 'user-email',
      password: 'user-password'
    });

    await expect(createStatementUseCase.execute({
      description: 'statement-description',
      type: OperationType.DEPOSIT,
      amount: 200,
      user_id: user.id || '',
      sender_id: 'sender-id'
    })).rejects.toBeInstanceOf(CreateStatementError.OperationNotAllowed)

  })

  it('should not be able to create a new statement of type withdraw passing sender user', async () => {
    const user = await inMemoryUsersRepository.create({
      name: 'user-name',
      email: 'user-email',
      password: 'user-password'
    });

    await expect(createStatementUseCase.execute({
      description: 'statement-description',
      type: OperationType.WITHDRAW,
      amount: 200,
      user_id: user.id || '',
      sender_id: 'sender-id'
    })).rejects.toBeInstanceOf(CreateStatementError.OperationNotAllowed)

  })

  it('should not be able to create a new statement of type transfer with non-exists sender user', async () => {
    const user = await inMemoryUsersRepository.create({
      name: 'user-name',
      email: 'user-email',
      password: 'user-password'
    })

    await inMemoryStatementsRepository.create({
      amount: 500,
      description: 'statement-description',
      type: OperationType.DEPOSIT,
      user_id: user.id || ''
    });

    await expect(createStatementUseCase.execute({
      description: 'statement-description',
      type: OperationType.TRANSFER,
      amount: 200,
      user_id: user.id || '',
      sender_id: 'non-exists'
    })).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
  })
})
