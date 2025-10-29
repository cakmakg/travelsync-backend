"use strict";
/* -------------------------------------------------------
    TravelSync - Agency Controller
------------------------------------------------------- */

const { Agency } = require('../models');
const baseCRUD = require('./base');

const crud = baseCRUD.createCRUDController(Agency, 'Agency');

module.exports = {
  ...crud,

  // Get agency bookings
  getBookings: async (req, res) => {
    const { Reservation } = require('../models');
    
    const bookings = await Reservation.find({
      agency_id: req.params.id,
    })
      .populate('property_id', 'name code')
      .populate('room_type_id', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  },

  // Get commission report
  getCommissionReport: async (req, res) => {
    const { Reservation } = require('../models');
    const { start_date, end_date, status } = req.query;

    const query = {
      agency_id: req.params.id,
      check_in_date: {
        $gte: new Date(start_date || '2024-01-01'),
        $lte: new Date(end_date || new Date()),
      },
    };

    if (status) {
      query['commission.status'] = status;
    }

    const bookings = await Reservation.find(query);

    const report = {
      total_bookings: bookings.length,
      total_revenue: bookings.reduce((sum, b) => sum + b.total_price, 0),
      total_commission: bookings.reduce((sum, b) => sum + (b.commission?.amount || 0), 0),
      pending_commission: bookings
        .filter(b => b.commission?.status === 'PENDING')
        .reduce((sum, b) => sum + (b.commission?.amount || 0), 0),
      paid_commission: bookings
        .filter(b => b.commission?.status === 'PAID')
        .reduce((sum, b) => sum + (b.commission?.amount || 0), 0),
    };

    res.json({ success: true, data: report });
  },

  // Mark commission as paid
  markCommissionPaid: async (req, res) => {
    const { Reservation } = require('../models');
    const { booking_ids } = req.body;

    await Reservation.updateMany(
      {
        _id: { $in: booking_ids },
        agency_id: req.params.id,
      },
      {
        $set: {
          'commission.status': 'PAID',
          'commission.paid_date': new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: `Commission marked as paid for ${booking_ids.length} bookings`,
    });
  },
};