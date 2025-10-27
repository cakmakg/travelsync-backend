/**
 * 🏨 PROPERTY CONTROLLER
 * 
 * Hotel/Property management
 * Features: CRUD, address management, amenities
 */

const BaseController = require('./base');
const { Property } = require('../models');

class PropertyController extends BaseController {
  constructor() {
    super(Property, 'property');
    
    // Search fields for getAll
    this.searchFields = ['name', 'code', 'address.city', 'address.country'];
    
    // Populate fields
    this.populateFields = 'organization_id';
  }

  /**
   * Custom validation for create
   */
  validateCreate = async (data) => {
    // Check if property code already exists in this organization
    if (data.code) {
      const exists = await Property.findOne({
        code: data.code,
        organization_id: data.organization_id,
        deleted_at: null
      });

      if (exists) {
        return 'Property code already exists in this organization';
      }
    }

    // Validate property type
    const validTypes = ['hotel', 'resort', 'apartment', 'guesthouse', 'hostel', 'villa'];
    if (data.property_type && !validTypes.includes(data.property_type)) {
      return `Invalid property type. Must be one of: ${validTypes.join(', ')}`;
    }

    // Validate star rating
    if (data.star_rating && (data.star_rating < 1 || data.star_rating > 5)) {
      return 'Star rating must be between 1 and 5';
    }

    return null;
  };

  /**
   * Custom validation for update
   */
  validateUpdate = async (data, existing) => {
    // Check if updating code and it already exists
    if (data.code && data.code !== existing.code) {
      const exists = await Property.findOne({
        code: data.code,
        organization_id: existing.organization_id,
        _id: { $ne: existing._id },
        deleted_at: null
      });

      if (exists) {
        return 'Property code already exists in this organization';
      }
    }

    // Validate property type if updating
    const validTypes = ['hotel', 'resort', 'apartment', 'guesthouse', 'hostel', 'villa'];
    if (data.property_type && !validTypes.includes(data.property_type)) {
      return `Invalid property type. Must be one of: ${validTypes.join(', ')}`;
    }

    // Validate star rating if updating
    if (data.star_rating && (data.star_rating < 1 || data.star_rating > 5)) {
      return 'Star rating must be between 1 and 5';
    }

    return null;
  };

  /**
   * 🌆 GET BY CITY
   * Get all properties in a city
   */
  getByCity = async (req, res) => {
    try {
      const { city } = req.params;

      const properties = await Property.findByCity(city);

      res.status(200).json({
        success: true,
        data: properties
      });
    } catch (error) {
      console.error('[Property] Get by city error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get properties',
          details: error.message
        }
      });
    }
  };

  /**
   * 🌍 GET BY COUNTRY
   * Get all properties in a country
   */
  getByCountry = async (req, res) => {
    try {
      const { country } = req.params;

      const properties = await Property.find({
        'address.country': country,
        organization_id: req.user?.organization_id,
        deleted_at: null
      }).populate('organization_id');

      res.status(200).json({
        success: true,
        data: properties
      });
    } catch (error) {
      console.error('[Property] Get by country error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get properties',
          details: error.message
        }
      });
    }
  };

  /**
   * ⭐ GET BY RATING
   * Get properties by star rating
   */
  getByRating = async (req, res) => {
    try {
      const { rating } = req.params;
      const ratingNum = parseInt(rating);

      if (ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({
          success: false,
          error: { message: 'Star rating must be between 1 and 5' }
        });
      }

      const properties = await Property.find({
        star_rating: ratingNum,
        organization_id: req.user?.organization_id,
        deleted_at: null
      }).populate('organization_id');

      res.status(200).json({
        success: true,
        data: properties
      });
    } catch (error) {
      console.error('[Property] Get by rating error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get properties',
          details: error.message
        }
      });
    }
  };

  /**
   * 🏷️ UPDATE AMENITIES
   * Update property amenities
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

      const property = await Property.findOne({
        _id: id,
        organization_id: req.user?.organization_id,
        deleted_at: null
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          error: { message: 'Property not found' }
        });
      }

      property.amenities = amenities;
      await property.save();

      res.status(200).json({
        success: true,
        data: property,
        message: 'Amenities updated successfully'
      });
    } catch (error) {
      console.error('[Property] Update amenities error:', error);
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
   * 📍 GET FULL ADDRESS
   * Get formatted full address
   */
  getFullAddress = async (req, res) => {
    try {
      const { id } = req.params;

      const property = await Property.findOne({
        _id: id,
        organization_id: req.user?.organization_id,
        deleted_at: null
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          error: { message: 'Property not found' }
        });
      }

      const fullAddress = property.getFullAddress();

      res.status(200).json({
        success: true,
        data: {
          property_id: property._id,
          property_name: property.name,
          full_address: fullAddress,
          coordinates: {
            latitude: property.address.latitude,
            longitude: property.address.longitude
          }
        }
      });
    } catch (error) {
      console.error('[Property] Get full address error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get address',
          details: error.message
        }
      });
    }
  };

  /**
   * 📊 GET STATISTICS
   * Get property statistics
   */
  getStats = async (req, res) => {
    try {
      const { id } = req.params;

      const property = await Property.findOne({
        _id: id,
        organization_id: req.user?.organization_id,
        deleted_at: null
      }).populate('organization_id');

      if (!property) {
        return res.status(404).json({
          success: false,
          error: { message: 'Property not found' }
        });
      }

      // Calculate stats
      const stats = {
        property: {
          id: property._id,
          name: property.name,
          type: property.property_type,
          star_rating: property.star_rating
        },
        capacity: {
          total_rooms: property.total_rooms,
          status: property.status
        },
        contact: property.contact,
        address: property.getFullAddress(),
        amenities_count: property.amenities?.length || 0
      };

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[Property] Get stats error:', error);
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
module.exports = new PropertyController();