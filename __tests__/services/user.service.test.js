const userService = require('../../src/services/user.service');

jest.mock('../../src/services/audit.service', () => ({
  logAction: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('User Service - createUser', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('should throw if password missing', async () => {
    await expect(userService.createUser({ email: 'a@b.com' }, { _id: 'actor' })).rejects.toThrow(/Password is required/);
  });

  test('should throw when email already exists', async () => {
    const User = {
      findOne: jest.fn().mockResolvedValue({ _id: 'existing' }),
    };
    jest.doMock('../../src/models', () => ({ User }));
    const svc = require('../../src/services/user.service');

    await expect(svc.createUser({ email: 'a@b.com', password: 'p', organization_id: 'org1' }, { _id: 'actor' })).rejects.toThrow(/Email already exists/);
  });

  test('should create user and return sanitized object', async () => {
    const created = { _id: 'u1', email: 'a@b.com', toObject: function(){ return { _id: 'u1', email: 'a@b.com', password: 'x' }; } };
    const User = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(created),
    };
    jest.doMock('../../src/models', () => ({ User }));

    const svc = require('../../src/services/user.service');

    const user = await svc.createUser({ email: 'a@b.com', password: 'p', organization_id: 'org1' }, { _id: 'actor' });
    expect(user).toBeDefined();
    expect(user.password).toBeUndefined();
  });
});
