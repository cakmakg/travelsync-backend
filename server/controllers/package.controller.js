"use strict";
/* -------------------------------------------------------
    TravelSync - Package Controller
    Agency paket oluşturma ve yönetimi
------------------------------------------------------- */

const Package = require('../models/Package');

// @desc    Get all packages for agency
// @route   GET /api/v1/packages
// @access  Private (Agency)
exports.getPackages = async (req, res) => {
    try {
        const { status, package_type, destination } = req.query;

        const query = { agency_org_id: req.user.organization_id };

        if (status && status !== 'all') {
            query.status = status;
        }
        if (package_type) {
            query.package_type = package_type;
        }
        if (destination) {
            query['destination.city'] = new RegExp(destination, 'i');
        }

        const packages = await Package.find(query)
            .sort({ updatedAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: packages.length,
            data: packages,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single package
// @route   GET /api/v1/packages/:id
// @access  Private (Agency)
exports.getPackage = async (req, res) => {
    try {
        const pkg = await Package.findOne({
            _id: req.params.id,
            agency_org_id: req.user.organization_id,
        });

        if (!pkg) {
            return res.status(404).json({
                success: false,
                message: 'Package not found',
            });
        }

        res.status(200).json({
            success: true,
            data: pkg,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create package
// @route   POST /api/v1/packages
// @access  Private (Agency)
exports.createPackage = async (req, res) => {
    try {
        const packageData = {
            ...req.body,
            agency_org_id: req.user.organization_id,
            created_by: req.user._id,
        };

        const pkg = await Package.create(packageData);

        res.status(201).json({
            success: true,
            message: 'Package created successfully',
            data: pkg,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update package
// @route   PUT /api/v1/packages/:id
// @access  Private (Agency)
exports.updatePackage = async (req, res) => {
    try {
        let pkg = await Package.findOne({
            _id: req.params.id,
            agency_org_id: req.user.organization_id,
        });

        if (!pkg) {
            return res.status(404).json({
                success: false,
                message: 'Package not found',
            });
        }

        pkg = await Package.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Package updated successfully',
            data: pkg,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete package (soft delete - archive)
// @route   DELETE /api/v1/packages/:id
// @access  Private (Agency)
exports.deletePackage = async (req, res) => {
    try {
        const pkg = await Package.findOne({
            _id: req.params.id,
            agency_org_id: req.user.organization_id,
        });

        if (!pkg) {
            return res.status(404).json({
                success: false,
                message: 'Package not found',
            });
        }

        await pkg.archive();

        res.status(200).json({
            success: true,
            message: 'Package archived successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Publish package
// @route   POST /api/v1/packages/:id/publish
// @access  Private (Agency)
exports.publishPackage = async (req, res) => {
    try {
        const pkg = await Package.findOne({
            _id: req.params.id,
            agency_org_id: req.user.organization_id,
        });

        if (!pkg) {
            return res.status(404).json({
                success: false,
                message: 'Package not found',
            });
        }

        await pkg.publish();

        res.status(200).json({
            success: true,
            message: 'Package published successfully',
            data: pkg,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Pause package
// @route   POST /api/v1/packages/:id/pause
// @access  Private (Agency)
exports.pausePackage = async (req, res) => {
    try {
        const pkg = await Package.findOne({
            _id: req.params.id,
            agency_org_id: req.user.organization_id,
        });

        if (!pkg) {
            return res.status(404).json({
                success: false,
                message: 'Package not found',
            });
        }

        await pkg.pause();

        res.status(200).json({
            success: true,
            message: 'Package paused successfully',
            data: pkg,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Duplicate package
// @route   POST /api/v1/packages/:id/duplicate
// @access  Private (Agency)
exports.duplicatePackage = async (req, res) => {
    try {
        const original = await Package.findOne({
            _id: req.params.id,
            agency_org_id: req.user.organization_id,
        }).lean();

        if (!original) {
            return res.status(404).json({
                success: false,
                message: 'Package not found',
            });
        }

        // Remove fields that should be unique
        delete original._id;
        delete original.createdAt;
        delete original.updatedAt;
        delete original.code;
        original.name = `${original.name} (Copy)`;
        original.status = 'draft';
        original.stats = { views: 0, bookings: 0, revenue: 0 };
        original.created_by = req.user._id;

        const newPackage = await Package.create(original);

        res.status(201).json({
            success: true,
            message: 'Package duplicated successfully',
            data: newPackage,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get package stats
// @route   GET /api/v1/packages/stats
// @access  Private (Agency)
exports.getPackageStats = async (req, res) => {
    try {
        const stats = await Package.aggregate([
            { $match: { agency_org_id: req.user.organization_id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$stats.revenue' },
                    totalBookings: { $sum: '$stats.bookings' },
                },
            },
        ]);

        const totalPackages = await Package.countDocuments({
            agency_org_id: req.user.organization_id,
        });

        res.status(200).json({
            success: true,
            data: {
                total: totalPackages,
                byStatus: stats,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
