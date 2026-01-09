const asyncHandler = require('../middlewares/asyncHandler');
const { Reservation, Property } = require('../models');

const MS_DAY = 24 * 60 * 60 * 1000;

function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  // normalize to midnight
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return Math.round((e - s) / MS_DAY) + 1; // inclusive days
}

function overlapDays(aStart, aEnd, bStart, bEnd) {
  const s = new Date(Math.max(new Date(aStart).getTime(), new Date(bStart).getTime()));
  const e = new Date(Math.min(new Date(aEnd).getTime(), new Date(bEnd).getTime()));
  if (s >= e) return 0;
  // number of nights overlapping (end exclusive)
  return Math.ceil((e - s) / MS_DAY);
}

/**
 * Analytics & Reporting Controller
 */
class AnalyticsController {
  /**
   * Dashboard overview (counts + today's occupancy + today's revenue)
   */
  dashboard = asyncHandler(async (req, res) => {
    const orgId = req.user?.organization_id;

    // Properties count
    const totalProperties = await Property.countDocuments({ organization_id: orgId, deleted_at: null });

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + MS_DAY);

    // Active reservations today
    const activeReservations = await Reservation.find({
      organization_id: orgId,
      deleted_at: null,
      status: { $ne: 'cancelled' },
      $or: [
        { check_in_date: { $lt: todayEnd }, check_out_date: { $gt: todayStart } },
      ],
    }).select('property_id rooms_requested check_in_date check_out_date total_with_tax');

    const todayRevenue = activeReservations.reduce((sum, r) => sum + (r.total_with_tax || 0), 0);

    // Estimate occupancy for today (sum rooms_requested)
    const occupiedRoomsToday = activeReservations.reduce((sum, r) => sum + (r.rooms_requested || 1), 0);

    // Sum total rooms across properties for org
    const properties = await Property.find({ organization_id: orgId, deleted_at: null }).select('total_rooms');
    const totalRooms = properties.reduce((sum, p) => sum + (p.total_rooms || 0), 0);

    const occupancyRateToday = totalRooms > 0 ? occupiedRoomsToday / totalRooms : 0;

    return res.success({
      total_properties: totalProperties,
      today: {
        active_reservations: activeReservations.length,
        revenue: todayRevenue,
        occupancy_rate: occupancyRateToday,
        occupied_rooms: occupiedRoomsToday,
        total_rooms: totalRooms,
      },
    });
  });

  /**
   * Occupancy report for a property over a date range
   */
  occupancy = asyncHandler(async (req, res) => {
    const { propertyId, start_date, end_date } = req.query;

    if (!propertyId) return res.badRequest('propertyId is required');
    if (!start_date || !end_date) return res.badRequest('start_date and end_date are required');

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (start > end) return res.badRequest('start_date must be before or equal to end_date');

    const property = await Property.findById(propertyId).select('total_rooms');
    if (!property) return res.notFound('Property not found');

    const nights = daysBetween(start, end);

    // Fetch reservations overlapping the range
    const reservations = await Reservation.find({
      property_id: propertyId,
      deleted_at: null,
      status: { $ne: 'cancelled' },
      $or: [
        { check_in_date: { $lt: end }, check_out_date: { $gt: start } },
      ],
    }).select('check_in_date check_out_date rooms_requested');

    // Calculate occupied room-nights
    let occupiedRoomNights = 0;
    for (const r of reservations) {
      const overlap = overlapDays(r.check_in_date, r.check_out_date, start, end);
      occupiedRoomNights += (r.rooms_requested || 1) * overlap;
    }

    const capacity = (property.total_rooms || 0) * nights;
    const occupancyRate = capacity > 0 ? occupiedRoomNights / capacity : 0;

    return res.success({
      propertyId,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      nights,
      occupied_room_nights: occupiedRoomNights,
      capacity,
      occupancy_rate: occupancyRate,
    });
  });

  /**
   * Revenue report for property or organization over date range
   */
  revenue = asyncHandler(async (req, res) => {
    const { propertyId, start_date, end_date } = req.query;

    if (!start_date || !end_date) return res.badRequest('start_date and end_date are required');

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (start > end) return res.badRequest('start_date must be before or equal to end_date');

    const match = {
      deleted_at: null,
      status: { $ne: 'cancelled' },
      check_in_date: { $gte: start, $lte: end },
    };
    if (propertyId) match.property_id = propertyId;
    if (req.user?.organization_id) match.organization_id = req.user.organization_id;

    const agg = await Reservation.aggregate([
      { $match: match },
      { $group: { _id: null, revenue: { $sum: { $ifNull: ['$total_with_tax', 0] } }, count: { $sum: 1 } } },
    ]);

    const revenue = (agg[0] && agg[0].revenue) || 0;
    const count = (agg[0] && agg[0].count) || 0;

    return res.success({ propertyId: propertyId || null, start_date: start.toISOString().split('T')[0], end_date: end.toISOString().split('T')[0], revenue, reservations: count });
  });

  /**
   * Reservation statistics: counts by status, avg length of stay, avg revenue
   */
  reservationStats = asyncHandler(async (req, res) => {
    const { propertyId } = req.query;

    const match = { deleted_at: null };
    if (propertyId) match.property_id = propertyId;
    if (req.user?.organization_id) match.organization_id = req.user.organization_id;

    const stats = await Reservation.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avg_nights: { $avg: { $divide: [{ $subtract: ['$check_out_date', '$check_in_date'] }, MS_DAY] } },
          avg_revenue: { $avg: { $ifNull: ['$total_with_tax', 0] } },
        },
      },
    ]);

    const formatted = stats.reduce((acc, s) => {
      acc[s._id] = { count: s.count, avg_nights: Number((s.avg_nights || 0).toFixed(2)), avg_revenue: Number((s.avg_revenue || 0).toFixed(2)) };
      return acc;
    }, {});

    return res.success({ propertyId: propertyId || null, stats: formatted });
  });
}

module.exports = new AnalyticsController();
