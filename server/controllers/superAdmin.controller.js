"use strict";
/* -------------------------------------------------------
    TravelSync - Super Admin Controller
    Global platform yönetimi için endpoint'ler
------------------------------------------------------- */

const asyncHandler = require('../middlewares/asyncHandler');
const { Organization, User, Reservation, Property, AuditLog, Agency } = require('../models');

/**
 * Super Admin Controller
 * Platform genelinde görünürlük ve yönetim
 */
class SuperAdminController {
    /**
     * Global Dashboard
     * GET /api/v1/admin/dashboard
     */
    getDashboard = asyncHandler(async (req, res) => {
        // Paralel sorgular
        const [
            totalOrganizations,
            pendingOrganizations,
            activeOrganizations,
            totalUsers,
            totalProperties,
            totalReservations,
            totalAgencies,
            recentAuditLogs
        ] = await Promise.all([
            Organization.countDocuments({ deleted_at: null }),
            Organization.countDocuments({ status: 'pending', deleted_at: null }),
            Organization.countDocuments({ status: 'active', deleted_at: null }),
            User.countDocuments({ deleted_at: null }),
            Property.countDocuments({ deleted_at: null }),
            Reservation.countDocuments({ deleted_at: null }),
            Agency.countDocuments({ is_active: true }),
            AuditLog.find()
                .sort({ created_at: -1 })
                .limit(10)
                .select('action entity_type description created_at')
                .lean()
        ]);

        // Bu ayki gelir (toplam reservation revenue)
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);

        const monthlyRevenue = await Reservation.aggregate([
            {
                $match: {
                    created_at: { $gte: thisMonthStart },
                    deleted_at: null,
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total_with_tax' }
                }
            }
        ]);

        return res.success({
            overview: {
                organizations: {
                    total: totalOrganizations,
                    pending: pendingOrganizations,
                    active: activeOrganizations
                },
                users: totalUsers,
                properties: totalProperties,
                reservations: totalReservations,
                agencies: totalAgencies,
                monthly_revenue: monthlyRevenue[0]?.total || 0
            },
            recent_activity: recentAuditLogs,
            system_health: {
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage()
            }
        });
    });

    /**
     * Tüm Organizasyonları Listele
     * GET /api/v1/admin/organizations
     */
    getOrganizations = asyncHandler(async (req, res) => {
        const { status, search, page = 1, limit = 20 } = req.query;

        const query = { deleted_at: null };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [organizations, total] = await Promise.all([
            Organization.find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Organization.countDocuments(query)
        ]);

        // Her organizasyon için kullanıcı ve property sayısı
        const enrichedOrgs = await Promise.all(
            organizations.map(async (org) => {
                const [userCount, propertyCount] = await Promise.all([
                    User.countDocuments({ organization_id: org._id, deleted_at: null }),
                    Property.countDocuments({ organization_id: org._id, deleted_at: null })
                ]);
                return {
                    ...org,
                    user_count: userCount,
                    property_count: propertyCount
                };
            })
        );

        return res.success({
            items: enrichedOrgs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    });

    /**
     * Organizasyon Durumunu Güncelle
     * PUT /api/v1/admin/organizations/:id/status
     */
    updateOrganizationStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status, reason } = req.body;

        const validStatuses = ['pending', 'active', 'suspended', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.badRequest('Geçersiz durum');
        }

        const organization = await Organization.findById(id);
        if (!organization) {
            return res.notFound('Organizasyon bulunamadı');
        }

        const oldStatus = organization.status;
        organization.status = status;
        await organization.save();

        // Audit log
        await AuditLog.create({
            user_id: req.user._id,
            action: 'UPDATE_STATUS',
            entity_type: 'organization',
            entity_id: id,
            description: `Organizasyon durumu değiştirildi: ${oldStatus} → ${status}`,
            changes: { old_status: oldStatus, new_status: status, reason }
        });

        // TODO: Email bildirimi gönder

        return res.success(
            { ...organization.toObject(), old_status: oldStatus },
            { message: `Organizasyon durumu ${status} olarak güncellendi` }
        );
    });

    /**
     * Tüm Kullanıcıları Listele
     * GET /api/v1/admin/users
     */
    getUsers = asyncHandler(async (req, res) => {
        const { organization_id, role, search, page = 1, limit = 20 } = req.query;

        const query = { deleted_at: null };

        if (organization_id) {
            query.organization_id = organization_id;
        }

        if (role) {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find(query)
                .populate('organization_id', 'name')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-password')
                .lean(),
            User.countDocuments(query)
        ]);

        return res.success({
            items: users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    });

    /**
     * Global Audit Logları
     * GET /api/v1/admin/audit-logs
     */
    getAuditLogs = asyncHandler(async (req, res) => {
        const { organization_id, action, entity_type, page = 1, limit = 50 } = req.query;

        const query = {};

        if (organization_id) {
            query.organization_id = organization_id;
        }

        if (action) {
            query.action = action;
        }

        if (entity_type) {
            query.entity_type = entity_type;
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('user_id', 'email first_name last_name')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            AuditLog.countDocuments(query)
        ]);

        return res.success({
            items: logs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    });

    /**
     * Sistem Metrikleri
     * GET /api/v1/admin/metrics
     */
    getMetrics = asyncHandler(async (req, res) => {
        // Son 7 günlük kayıt sayıları
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyRegistrations = await Organization.aggregate([
            {
                $match: {
                    created_at: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const dailyReservations = await Reservation.aggregate([
            {
                $match: {
                    created_at: { $gte: sevenDaysAgo },
                    deleted_at: null
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                    count: { $sum: 1 },
                    revenue: { $sum: '$total_with_tax' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.success({
            daily_registrations: dailyRegistrations,
            daily_reservations: dailyReservations,
            period: {
                start: sevenDaysAgo.toISOString(),
                end: new Date().toISOString()
            }
        });
    });

    /**
     * Super Admin Seed (İlk kurulum için)
     * POST /api/v1/admin/seed-superadmin
     * NOT: Production'da kaldırılmalı veya korunmalı
     */
    seedSuperAdmin = asyncHandler(async (req, res) => {
        const { email, password, first_name, last_name, secret_key } = req.body;

        // Basit güvenlik kontrolü
        if (secret_key !== process.env.ADMIN_SEED_SECRET) {
            return res.forbidden('Geçersiz secret key');
        }

        // Zaten super admin var mı?
        const existingAdmin = await User.findOne({ role: 'super_admin' });
        if (existingAdmin) {
            return res.badRequest('Super Admin zaten mevcut');
        }

        // Super Admin için organization_id gerekmiyor
        const superAdmin = await User.create({
            email,
            password,
            first_name,
            last_name,
            role: 'super_admin',
            is_active: true,
            organization_id: null // Super Admin organization'a bağlı değil
        });

        return res.created(
            { email: superAdmin.email, role: superAdmin.role },
            'Super Admin başarıyla oluşturuldu'
        );
    });
}

module.exports = new SuperAdminController();
