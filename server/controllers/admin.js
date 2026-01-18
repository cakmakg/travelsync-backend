"use strict";
/* -------------------------------------------------------
    TravelSync - Admin Controller
    Super Admin endpoints for system management
------------------------------------------------------- */

const { User, Organization } = require('../models');
const tokenService = require('../services/token.service');

/**
 * @desc    Get all organizations (hotels and agencies)
 * @route   GET /api/v1/admin/organizations
 * @access  Super Admin
 */
const getOrganizations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            status,
            search
        } = req.query;

        // Build filter
        const filter = {};

        if (type && type !== 'all') {
            filter.type = type.toUpperCase();
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        // Get total count
        const total = await Organization.countDocuments(filter);

        // Get organizations with pagination
        const organizations = await Organization.find(filter)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get user count for each organization
        const orgsWithStats = await Promise.all(
            organizations.map(async (org) => {
                const userCount = await User.countDocuments({
                    organization_id: org._id
                });
                return {
                    ...org.toObject(),
                    user_count: userCount,
                };
            })
        );

        res.json({
            success: true,
            data: orgsWithStats,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get organizations error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch organizations' },
        });
    }
};

/**
 * @desc    Get all users across all organizations
 * @route   GET /api/v1/admin/users
 * @access  Super Admin
 */
const getUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            role,
            status,
            search,
            organization_id
        } = req.query;

        // Build filter
        const filter = {};

        if (role && role !== 'all') {
            filter.role = role;
        }

        if (status && status !== 'all') {
            filter.is_active = status === 'active';
        }

        if (organization_id) {
            filter.organization_id = organization_id;
        }

        if (search) {
            filter.$or = [
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        // Get total count
        const total = await User.countDocuments(filter);

        // Get users with pagination
        const users = await User.find(filter)
            .select('-password')
            .populate('organization_id', 'name type')
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch users' },
        });
    }
};

/**
 * @desc    Get system statistics
 * @route   GET /api/v1/admin/stats
 * @access  Super Admin
 */
const getStats = async (req, res) => {
    try {
        const [
            totalOrganizations,
            totalHotels,
            totalAgencies,
            totalUsers,
            activeUsers,
            superAdmins,
        ] = await Promise.all([
            Organization.countDocuments(),
            Organization.countDocuments({ type: 'HOTEL' }),
            Organization.countDocuments({ type: 'AGENCY' }),
            User.countDocuments(),
            User.countDocuments({ is_active: true }),
            User.countDocuments({ role: 'super_admin' }),
        ]);

        // Get recent organizations
        const recentOrganizations = await Organization.find()
            .sort({ created_at: -1 })
            .limit(5)
            .select('name type status created_at');

        // Get recent users
        const recentUsers = await User.find()
            .sort({ created_at: -1 })
            .limit(5)
            .select('first_name last_name email role created_at')
            .populate('organization_id', 'name');

        res.json({
            success: true,
            data: {
                organizations: {
                    total: totalOrganizations,
                    hotels: totalHotels,
                    agencies: totalAgencies,
                },
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    super_admins: superAdmins,
                },
                recent: {
                    organizations: recentOrganizations,
                    users: recentUsers,
                },
            },
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch statistics' },
        });
    }
};

/**
 * @desc    Update organization status (suspend/activate)
 * @route   PATCH /api/v1/admin/organizations/:id/status
 * @access  Super Admin
 */
const updateOrganizationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'suspended', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid status value' },
            });
        }

        const organization = await Organization.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!organization) {
            return res.status(404).json({
                success: false,
                error: { message: 'Organization not found' },
            });
        }

        res.json({
            success: true,
            data: organization,
            message: `Organization ${status === 'active' ? 'activated' : 'suspended'} successfully`,
        });
    } catch (error) {
        console.error('Update organization status error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update organization status' },
        });
    }
};

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PATCH /api/v1/admin/users/:id/status
 * @access  Super Admin
 */
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        // Prevent deactivating self
        if (req.user._id.toString() === id && !is_active) {
            return res.status(400).json({
                success: false,
                error: { message: 'Cannot deactivate your own account' },
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { is_active },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' },
            });
        }

        res.json({
            success: true,
            data: user,
            message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update user status' },
        });
    }
};

/**
 * @desc    Cleanup expired token blacklist entries
 * @route   POST /api/v1/admin/tokens/cleanup
 * @access  Super Admin
 */
const cleanupTokenBlacklist = async (req, res) => {
    try {
        const result = await tokenService.cleanupExpiredBlacklist();

        return res.json({
            success: true,
            data: {
                deleted_count: result.deletedCount,
                acknowledged: result.acknowledged,
            },
            message: `Cleaned up ${result.deletedCount} expired blacklist entries`,
        });
    } catch (error) {
        console.error('Cleanup token blacklist error:', error);

        return res.status(500).json({
            success: false,
            error: { message: 'Failed to cleanup token blacklist' },
        });
    }
};

/**
 * @desc    Revoke all tokens for a user (security incident)
 * @route   POST /api/v1/admin/users/:id/revoke-tokens
 * @access  Super Admin
 */
const revokeUserTokens = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'admin_revoke', notes } = req.body;

        // Verify user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' },
            });
        }

        // Revoke tokens
        const result = await tokenService.revokeUserTokens(id, reason, { notes });

        // Log audit action
        try {
            await require('../services/audit.service').logAction({
                action: 'REVOKE_TOKENS',
                entity_type: 'user',
                entity_id: id,
                description: `All tokens revoked - Reason: ${reason}`,
            }, { _id: req.user?._id, organization_id: req.user?.organization_id, ip: req.ip, user_agent: req.headers['user-agent'] });
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return res.json({
            success: true,
            data: result,
            message: `Revoked ${result.revoked_count} active tokens for user ${user.email}`,
        });
    } catch (error) {
        console.error('Revoke user tokens error:', error);

        return res.status(500).json({
            success: false,
            error: { message: 'Failed to revoke user tokens' },
        });
    }
};

/**
 * @desc    Get token blacklist statistics for a user
 * @route   GET /api/v1/admin/users/:id/token-stats
 * @access  Super Admin
 */
const getUserTokenStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' },
            });
        }

        // Get stats
        const stats = await tokenService.getUserTokenStats(id);

        return res.json({
            success: true,
            data: {
                user_id: id,
                user_email: user.email,
                token_revocation_stats: stats,
            },
        });
    } catch (error) {
        console.error('Get user token stats error:', error);

        return res.status(500).json({
            success: false,
            error: { message: 'Failed to get token statistics' },
        });
    }
};

module.exports = {
    getOrganizations,
    getUsers,
    getStats,
    updateOrganizationStatus,
    updateUserStatus,
    cleanupTokenBlacklist,
    revokeUserTokens,
    getUserTokenStats,
};
