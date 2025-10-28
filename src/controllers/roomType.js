/**
 * 🛏️ ROOM TYPE CONTROLLER
 * 
 * Room template management
 * Features: CRUD, capacity management, availability
 */

const BaseController = require('./base');
const { RoomType } = require('../models');

class RoomTypeController extends BaseController {
  constructor() {
    super(RoomType, 'room_type');
    
    // Disable organization filtering (rooms don't directly filter by org, they filter by property)
    this.useOrganizationFilter = false;
    
    // Search fields for getAll
    this.searchFields = ['name', 'code', 'bed_configuration'];
    
    // Populate fields
    this.populateFields = 'property_id';
  }

  /**
   * Custom validation for create
   */
  validateCreate = async (data) => {
    // Check if room type code already exists in this property
    if (data.code && data.property_id) {
      const exists = await RoomType.findOne({
        code: data.code,
        property_id: data.property_id,
        deleted_at: null
      });

      if (exists) {
        return 'Room type code already exists in this property';
      }
    }

    // Validate capacity
    if (data.capacity) {
      if (data.capacity.adults < 1) {
        return 'Adults capacity must be at least 1';
      }
      if (data.capacity.children < 0) {
        return 'Children capacity cannot be negative';
      }
    }

    // Validate quantity
    if (data.total_quantity && data.total_quantity < 1) {
      return 'Total quantity must be at least 1';
    }

    return null;
  };

  /**
   * Custom validation for update
   */
  validateUpdate = async (data, existing) => {
    // Check if updating code and it already exists
    if (data.code && data.code !== existing.code) {
      const exists = await RoomType.findOne({
        code: data.code,
        property_id: existing.property_id,
        _id: { $ne: existing._id },
        deleted_at: null
      });

      if (exists) {
        return 'Room type code already exists in this property';
      }
    }

    // Validate capacity if updating
    if (data.capacity) {
      if (data.capacity.adults < 1) {
        return 'Adults capacity must be at least 1';
      }
      if (data.capacity.children < 0) {
        return 'Children capacity cannot be negative';
      }
    }

    // Validate quantity if updating
    if (data.total_quantity && data.total_quantity < 1) {
      return 'Total quantity must be at least 1';
    }

    return null;
  };

  /**
   * 🏨 GET BY PROPERTY
   * Get all room types for a property
   */
  getByProperty = async (req, res) => {
    try {
      const { propertyId } = req.params;

      const roomTypes = await RoomType.findByProperty(propertyId);

      res.status(200).json({
        success: true,
        data: roomTypes
      });
    } catch (error) {
      console.error('[RoomType] Get by property error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get room types',
          details: error.message
        }
      });
    }
  };

  /**
   * 📦 GET BOOKABLE
   * Get all bookable room types for a property
   */
  getBookable = async (req, res) => {
    try {
      const { propertyId } = req.params;

      const roomTypes = await RoomType.findBookable(propertyId);

      res.status(200).json({
        success: true,
        data: roomTypes
      });
    } catch (error) {
      console.error('[RoomType] Get bookable error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get bookable room types',
          details: error.message
        }
      });
    }
  };

  /**
   * ✅ TOGGLE ACTIVE STATUS
   * Activate or deactivate room type
   */
  toggleActive = async (req, res) => {
    try {
      const { id } = req.params;

      const roomType = await RoomType.findOne({
        _id: id,
        deleted_at: null
      });

      if (!roomType) {
        return res.status(404).json({
          success: false,
          error: { message: 'Room type not found' }
        });
      }

      roomType.is_active = !roomType.is_active;
      await roomType.save();

      res.status(200).json({
        success: true,
        data: roomType,
        message: `Room type ${roomType.is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('[RoomType] Toggle active error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to toggle active status',
          details: error.message
        }
      });
    }
  };

  /**
   * 📚 TOGGLE BOOKABLE STATUS
   * Enable or disable bookability
   */
  toggleBookable = async (req, res) => {
    try {
      const { id } = req.params;

      const roomType = await RoomType.findOne({
        _id: id,
        deleted_at: null
      });

      if (!roomType) {
        return res.status(404).json({
          success: false,
          error: { message: 'Room type not found' }
        });
      }

      roomType.is_bookable = !roomType.is_bookable;
      await roomType.save();

      res.status(200).json({
        success: true,
        data: roomType,
        message: `Room type ${roomType.is_bookable ? 'enabled' : 'disabled'} for booking`
      });
    } catch (error) {
      console.error('[RoomType] Toggle bookable error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to toggle bookable status',
          details: error.message
        }
      });
    }
  };

  /**
   * 🏷️ UPDATE AMENITIES
   * Update room type amenities
   */
  updateAmenities = async (req, res) => {
    try {
      const { id } = req.params;
      const { amenities } = req.body;

      if (!Array.isArray(amenities)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Amenities must be an array' }
        });
      }

      const roomType = await RoomType.findOne({
        _id: id,
        deleted_at: null
      });

      if (!roomType) {
        return res.status(404).json({
          success: false,
          error: { message: 'Room type not found' }
        });
      }

      roomType.amenities = amenities;
      await roomType.save();

      res.status(200).json({
        success: true,
        data: roomType,
        message: 'Amenities updated successfully'
      });
    } catch (error) {
      console.error('[RoomType] Update amenities error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update amenities',
          details: error.message
        }
      });
    }
  };

  /**
   * 📊 GET STATISTICS
   * Get room type statistics
   */
  getStats = async (req, res) => {
    try {
      const { id } = req.params;

      const roomType = await RoomType.findOne({
        _id: id,
        deleted_at: null
      }).populate('property_id');

      if (!roomType) {
        return res.status(404).json({
          success: false,
          error: { message: 'Room type not found' }
        });
      }

      const stats = {
        room_type: {
          id: roomType._id,
          name: roomType.name,
          code: roomType.code
        },
        capacity: {
          adults: roomType.capacity.adults,
          children: roomType.capacity.children,
          total: roomType.capacity.total
        },
        inventory: {
          total_quantity: roomType.total_quantity,
          is_active: roomType.is_active,
          is_bookable: roomType.is_bookable
        },
        details: {
          bed_configuration: roomType.bed_configuration,
          size_sqm: roomType.size_sqm,
          amenities_count: roomType.amenities?.length || 0
        }
      };

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[RoomType] Get stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get statistics',
          details: error.message
        }
      });
    }
  };
}

// Export controller instance
module.exports = new RoomTypeController();