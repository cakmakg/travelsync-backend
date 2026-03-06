const mongoose = require('mongoose');
const reservationService = require('../services/reservation.service');
const { Reservation, RatePlan } = require('../models');

// Mock Data
const mockSession = {
    startTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    endSession: jest.fn(),
};

mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

describe('B2B Reservation service validations', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('cancelReservation should throw error if rate plan is non_refundable', async () => {

        Reservation.findById = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            session: jest.fn().mockResolvedValue({
                _id: 'res_123',
                status: 'confirmed',
                rate_plan_id: 'rp_123',
                check_in_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days later
            })
        });

        RatePlan.findById = jest.fn().mockReturnValue({
            session: jest.fn().mockResolvedValue({
                cancellation_policy: 'non_refundable'
            })
        });

        await expect(reservationService.cancelReservation('res_123', 'Changed mind', {}))
            .rejects
            .toThrow('B2B Policy: Cannot cancel a non-refundable reservation.');

        expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    test('cancelReservation should throw error for strict policy under 7 days', async () => {
        Reservation.findById = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            session: jest.fn().mockResolvedValue({
                _id: 'res_999',
                status: 'confirmed',
                rate_plan_id: 'rp_strict',
                check_in_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days later
            })
        });

        RatePlan.findById = jest.fn().mockReturnValue({
            session: jest.fn().mockResolvedValue({
                cancellation_policy: 'strict'
            })
        });

        await expect(reservationService.cancelReservation('res_999', 'Too late', {}))
            .rejects
            .toThrow('B2B Policy: Strict reservations cannot be cancelled within 7 days of check-in.');
    });


    test('createReservation should block agency with 5 or more active options', async () => {

        const Property = require('../models').Property;
        const Agency = require('../models').Agency;
        const Inventory = require('../models').Inventory;

        Property.findById = jest.fn().mockReturnValue({
            session: jest.fn().mockResolvedValue({
                _id: 'prop_1',
                organization_id: 'org_1'
            })
        });

        Agency.findById = jest.fn().mockReturnValue({
            session: jest.fn().mockResolvedValue({
                _id: 'agency_1',
                name: 'Test Agency',
                is_active: true
            })
        });

        Reservation.countDocuments = jest.fn().mockReturnValue({
            session: jest.fn().mockResolvedValue(5) // Agency already has 5 options
        });

        const data = {
            property_id: 'prop_1',
            agency_id: 'agency_1',
            check_in_date: new Date(),
            check_out_date: new Date()
        };

        const user = { organization_id: 'org_1' };

        await expect(reservationService.createReservation(data, user))
            .rejects
            .toThrow('B2B Limit: You cannot hold more than 5 reservations simultaneously.');

        expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
});
