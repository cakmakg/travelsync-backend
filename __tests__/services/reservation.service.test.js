const reservationService = require('../../src/services/reservation.service');

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Reservation Service - createReservation', () => {
  let originalModels;

  beforeEach(() => {
    // Reset modules to allow fresh mocks
    jest.resetModules();
    originalModels = {
      Reservation: { create: jest.fn() },
      Inventory: { checkAvailability: jest.fn(), updateOnBooking: jest.fn() },
      Price: { calculateTotalPrice: jest.fn() },
      Agency: { findById: jest.fn() },
    };

    jest.doMock('../../src/models', () => originalModels);

    // Mock mongoose session
    const fakeSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    jest.doMock('../../src/config/database', () => ({
      mongoose: {
        startSession: jest.fn().mockResolvedValue(fakeSession),
      },
    }));
  });

  test('should create reservation when available', async () => {
    const { Reservation, Inventory, Price, Agency } = require('../../src/models');
    // Prepare mocks
    Inventory.checkAvailability.mockResolvedValue({ available: true });
    Price.calculateTotalPrice.mockResolvedValue(100);
    Reservation.create.mockResolvedValue([{ _id: 'res1', property_id: 'prop1' }]);
    Inventory.updateOnBooking.mockResolvedValue(true);

    const data = {
      property_id: 'prop1',
      room_type_id: 'rt1',
      rate_plan_id: 'rp1',
      check_in_date: '2025-12-01',
      check_out_date: '2025-12-02',
    };

    // Mock Property and Agency via require inside service
    const Property = {
      findById: jest.fn().mockResolvedValue({ _id: 'prop1', organization_id: 'org1', name: 'P1' }),
    };
    jest.doMock('../../src/models', () => ({ ...originalModels, Property }));

    const user = { _id: 'user1', organization_id: 'org1' };

    // Reload the service to pick up our model mocks
    const svc = require('../../src/services/reservation.service');

    const reservation = await svc.createReservation(data, user);
    expect(reservation).toBeDefined();
    expect(Reservation.create).toHaveBeenCalled();
    expect(Inventory.updateOnBooking).toHaveBeenCalled();
  });

  test('should throw when not available and abort transaction', async () => {
    const { Inventory } = require('../../src/models');
    Inventory.checkAvailability.mockResolvedValue({ available: false, reason: 'no_avail' });

    const Property = {
      findById: jest.fn().mockResolvedValue({ _id: 'prop1', organization_id: 'org1', name: 'P1' }),
    };
    jest.doMock('../../src/models', () => ({ ...originalModels, Property }));

    const user = { _id: 'user1', organization_id: 'org1' };

    const svc = require('../../src/services/reservation.service');

    await expect(svc.createReservation({
      property_id: 'prop1',
      room_type_id: 'rt1',
      rate_plan_id: 'rp1',
      check_in_date: '2025-12-01',
      check_out_date: '2025-12-02',
    }, user)).rejects.toThrow(/Not available/);
  });
});
