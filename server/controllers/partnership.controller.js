"use strict";
/* -------------------------------------------------------
    TravelSync - Partnership Controller
    Hotel-Agency B2B connection management
------------------------------------------------------- */

const { HotelAgencyPartnership, Organization } = require('../models');

/**
 * 🤝 PARTNERSHIP CONTROLLER
 * Manages Hotel-Agency B2B connections
 */
class PartnershipController {
    /**
     * 📋 GET ALL PARTNERSHIPS
     * Get partnerships for current organization (hotel or agency)
     */
    getAll = async (req, res) => {
        try {
            const { organization_id, role } = req.user;
            const { status, include_terminated } = req.query;

            // Get organization type
            const org = await Organization.findById(organization_id);
            if (!org) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Organization not found' },
                });
            }

            let partnerships;
            if (org.type === 'HOTEL') {
                partnerships = await HotelAgencyPartnership.findByHotel(
                    organization_id,
                    include_terminated === 'true'
                );
            } else if (org.type === 'AGENCY') {
                partnerships = await HotelAgencyPartnership.findByAgency(
                    organization_id,
                    include_terminated === 'true'
                );
            } else {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Invalid organization type' },
                });
            }

            // Filter by status if provided
            if (status) {
                partnerships = partnerships.filter((p) => p.status === status);
            }

            res.status(200).json({
                success: true,
                data: partnerships,
            });
        } catch (error) {
            console.error('[Partnership] Get all error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get partnerships' },
            });
        }
    };

    /**
     * 📨 INVITE PARTNER
     * Hotel invites agency or agency invites hotel
     */
    invite = async (req, res) => {
        try {
            const { organization_id } = req.user;
            const { partner_org_id, partner_email, commission_rate, notes } = req.body;

            // Get current organization
            const currentOrg = await Organization.findById(organization_id);
            if (!currentOrg) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Organization not found' },
                });
            }

            let hotelOrgId, agencyOrgId, invitedBy;

            if (currentOrg.type === 'HOTEL') {
                hotelOrgId = organization_id;
                invitedBy = 'hotel';

                // If partner_org_id provided, use it; otherwise will be set when accepted
                if (partner_org_id) {
                    const agencyOrg = await Organization.findOne({
                        _id: partner_org_id,
                        type: 'AGENCY',
                    });
                    if (!agencyOrg) {
                        return res.status(400).json({
                            success: false,
                            error: { message: 'Agency organization not found' },
                        });
                    }
                    agencyOrgId = partner_org_id;
                }
            } else if (currentOrg.type === 'AGENCY') {
                agencyOrgId = organization_id;
                invitedBy = 'agency';

                if (partner_org_id) {
                    const hotelOrg = await Organization.findOne({
                        _id: partner_org_id,
                        type: 'HOTEL',
                    });
                    if (!hotelOrg) {
                        return res.status(400).json({
                            success: false,
                            error: { message: 'Hotel organization not found' },
                        });
                    }
                    hotelOrgId = partner_org_id;
                }
            } else {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Only hotels and agencies can create partnerships' },
                });
            }

            // Check for existing partnership
            if (hotelOrgId && agencyOrgId) {
                const existing = await HotelAgencyPartnership.findOne({
                    hotel_org_id: hotelOrgId,
                    agency_org_id: agencyOrgId,
                    status: { $in: ['pending', 'active'] },
                });
                if (existing) {
                    return res.status(400).json({
                        success: false,
                        error: { message: 'Partnership already exists or pending' },
                    });
                }
            }

            // Create partnership
            const partnership = await HotelAgencyPartnership.create({
                hotel_org_id: hotelOrgId,
                agency_org_id: agencyOrgId,
                invited_by: invitedBy,
                invitation_email: partner_email,
                default_commission: {
                    rate: commission_rate || 10,
                    type: 'percentage',
                },
                notes,
                created_by_user_id: req.user._id,
            });

            // TODO: Send invitation email
            // await emailService.sendPartnershipInvitation(partnership);

            res.status(201).json({
                success: true,
                data: partnership,
                message: 'Partnership invitation sent',
            });
        } catch (error) {
            console.error('[Partnership] Invite error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to create partnership invitation' },
            });
        }
    };

    /**
     * ✅ ACCEPT INVITATION
     * Accept a pending partnership invitation
     */
    accept = async (req, res) => {
        try {
            const { id } = req.params;
            const { organization_id } = req.user;

            const partnership = await HotelAgencyPartnership.findById(id);
            if (!partnership) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Partnership not found' },
                });
            }

            if (partnership.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Partnership is not pending' },
                });
            }

            // Check if current org is the invited party
            const currentOrg = await Organization.findById(organization_id);
            const canAccept =
                (currentOrg.type === 'AGENCY' && partnership.invited_by === 'hotel') ||
                (currentOrg.type === 'HOTEL' && partnership.invited_by === 'agency');

            if (!canAccept) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'You cannot accept your own invitation' },
                });
            }

            // If org ID was not set during invite, set it now
            if (!partnership.hotel_org_id && currentOrg.type === 'HOTEL') {
                partnership.hotel_org_id = organization_id;
            }
            if (!partnership.agency_org_id && currentOrg.type === 'AGENCY') {
                partnership.agency_org_id = organization_id;
            }

            await partnership.accept();

            res.status(200).json({
                success: true,
                data: partnership,
                message: 'Partnership accepted',
            });
        } catch (error) {
            console.error('[Partnership] Accept error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to accept partnership' },
            });
        }
    };

    /**
     * ❌ REJECT/CANCEL INVITATION
     */
    reject = async (req, res) => {
        try {
            const { id } = req.params;
            const { organization_id } = req.user;

            const partnership = await HotelAgencyPartnership.findById(id);
            if (!partnership) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Partnership not found' },
                });
            }

            if (partnership.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Only pending partnerships can be rejected' },
                });
            }

            // Check if user's org is part of this partnership
            const isParty =
                String(partnership.hotel_org_id) === String(organization_id) ||
                String(partnership.agency_org_id) === String(organization_id);

            if (!isParty) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Not authorized' },
                });
            }

            await partnership.terminate('Invitation rejected');

            res.status(200).json({
                success: true,
                message: 'Partnership invitation rejected',
            });
        } catch (error) {
            console.error('[Partnership] Reject error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to reject partnership' },
            });
        }
    };

    /**
     * ⏸️ SUSPEND PARTNERSHIP
     */
    suspend = async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const { organization_id } = req.user;

            const partnership = await HotelAgencyPartnership.findById(id);
            if (!partnership) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Partnership not found' },
                });
            }

            // Check if user's org is part of this partnership
            const isParty =
                String(partnership.hotel_org_id) === String(organization_id) ||
                String(partnership.agency_org_id) === String(organization_id);

            if (!isParty) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Not authorized' },
                });
            }

            await partnership.suspend(reason);

            res.status(200).json({
                success: true,
                data: partnership,
                message: 'Partnership suspended',
            });
        } catch (error) {
            console.error('[Partnership] Suspend error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to suspend partnership' },
            });
        }
    };

    /**
     * ▶️ REACTIVATE PARTNERSHIP
     */
    reactivate = async (req, res) => {
        try {
            const { id } = req.params;
            const { organization_id } = req.user;

            const partnership = await HotelAgencyPartnership.findById(id);
            if (!partnership) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Partnership not found' },
                });
            }

            const isParty =
                String(partnership.hotel_org_id) === String(organization_id) ||
                String(partnership.agency_org_id) === String(organization_id);

            if (!isParty) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Not authorized' },
                });
            }

            await partnership.reactivate();

            res.status(200).json({
                success: true,
                data: partnership,
                message: 'Partnership reactivated',
            });
        } catch (error) {
            console.error('[Partnership] Reactivate error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to reactivate partnership' },
            });
        }
    };

    /**
     * 🛑 TERMINATE PARTNERSHIP
     */
    terminate = async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const { organization_id } = req.user;

            const partnership = await HotelAgencyPartnership.findById(id);
            if (!partnership) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Partnership not found' },
                });
            }

            const isParty =
                String(partnership.hotel_org_id) === String(organization_id) ||
                String(partnership.agency_org_id) === String(organization_id);

            if (!isParty) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Not authorized' },
                });
            }

            await partnership.terminate(reason);

            res.status(200).json({
                success: true,
                message: 'Partnership terminated',
            });
        } catch (error) {
            console.error('[Partnership] Terminate error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to terminate partnership' },
            });
        }
    };

    /**
     * 🔍 GET CONNECTED PARTNERS
     * Get list of active partners (for dropdowns, search, etc.)
     */
    getConnectedPartners = async (req, res) => {
        try {
            const { organization_id } = req.user;

            const org = await Organization.findById(organization_id);
            if (!org) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Organization not found' },
                });
            }

            let partners;
            if (org.type === 'HOTEL') {
                partners = await HotelAgencyPartnership.getConnectedAgencies(organization_id);
            } else if (org.type === 'AGENCY') {
                partners = await HotelAgencyPartnership.getConnectedHotels(organization_id);
            }

            res.status(200).json({
                success: true,
                data: partners,
            });
        } catch (error) {
            console.error('[Partnership] Get connected error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get connected partners' },
            });
        }
    };

    /**
     * 🔗 ACCEPT BY TOKEN
     * Public endpoint to accept invitation via token link
     */
    acceptByToken = async (req, res) => {
        try {
            const { token } = req.params;

            const partnership = await HotelAgencyPartnership.findByToken(token);
            if (!partnership) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Invalid or expired invitation token' },
                });
            }

            if (partnership.isExpired()) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Invitation has expired' },
                });
            }

            await partnership.accept();

            res.status(200).json({
                success: true,
                data: partnership,
                message: 'Partnership accepted',
            });
        } catch (error) {
            console.error('[Partnership] Accept by token error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to accept partnership' },
            });
        }
    };
}

module.exports = new PartnershipController();
