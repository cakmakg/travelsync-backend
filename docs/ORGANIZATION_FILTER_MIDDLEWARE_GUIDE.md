# Organization Filter Middleware - Route Integration Guide

**Date**: 2024  
**Purpose**: Quick reference for applying organization filter middleware to all routes

---

## Quick Summary

All routes must now apply organization filter middleware to ensure multi-tenant data isolation. This guide shows the exact pattern to follow.

---

## Import Required Middleware

```javascript
const {
  ensureOrganizationId,
  validateOrganizationOwnership,
  validateParamOrganization,
  bypassForSuperAdmin
} = require('../middlewares/organizationFilter');
```

---

## Route Pattern Templates

### Template 1: Simple List Routes
```javascript
// ✅ PROTECTED LIST
router.get('/',
  authenticateJWT,                    // Verify JWT
  ensureOrganizationId,               // Verify org_id in JWT
  controller.getAll                   // BaseController enforces org_id in query
);
```

### Template 2: Create Routes (with ownership validation)
```javascript
// ✅ PROTECTED CREATE
router.post('/',
  authenticateJWT,                    // Verify JWT
  ensureOrganizationId,               // Verify org_id in JWT
  validateOrganizationOwnership,      // Check request body org_id matches
  controller.create                   // BaseController forces org_id from auth
);
```

### Template 3: Get By ID Routes
```javascript
// ✅ PROTECTED GET BY ID
router.get('/:id',
  authenticateJWT,                    // Verify JWT
  ensureOrganizationId,               // Verify org_id in JWT
  controller.getById                  // BaseController enforces org_id in query
);
```

### Template 4: Update Routes
```javascript
// ✅ PROTECTED UPDATE
router.put('/:id',
  authenticateJWT,                    // Verify JWT
  ensureOrganizationId,               // Verify org_id in JWT
  controller.update                   // BaseController enforces org_id in query
);
```

### Template 5: Delete Routes
```javascript
// ✅ PROTECTED DELETE
router.delete('/:id',
  authenticateJWT,                    // Verify JWT
  ensureOrganizationId,               // Verify org_id in JWT
  controller.delete                   // BaseController enforces org_id in query
);
```

### Template 6: Routes with Organization in URL
```javascript
// ✅ PROTECTED PARAMETERIZED
router.get('/org/:orgId/resources',
  authenticateJWT,                    // Verify JWT
  ensureOrganizationId,               // Verify org_id in JWT
  validateParamOrganization('orgId'), // Verify URL orgId matches user's org
  controller.getByOrganization
);
```

### Template 7: Admin Routes (with super admin bypass)
```javascript
// ✅ PROTECTED ADMIN ROUTE (with audit logging)
router.post('/admin/revoke-tokens',
  authenticateJWT,                    // Verify JWT
  ensureOrganizationId,               // Verify org_id in JWT
  bypassForSuperAdmin,                // Log if super_admin bypass used
  admin.revokeUserTokens              // Admin operation
);
```

---

## Routes to Update - Checklist

### Authentication Routes (`routes/auth.js`)
- [x] POST `/register` - Public (no org filter needed)
- [x] POST `/login` - Public (no org filter needed)
- [x] POST `/logout` - ✅ Authenticated, ensureOrganizationId
- [x] POST `/refresh` - ✅ Authenticated, ensureOrganizationId (already updated)
- [x] GET `/profile` - ✅ Authenticated, ensureOrganizationId

### User Routes (`routes/users.js` or controller)
- [ ] GET `/` - ensureOrganizationId
- [ ] POST `/` - ensureOrganizationId, validateOrganizationOwnership
- [ ] GET `/:id` - ensureOrganizationId
- [ ] PUT `/:id` - ensureOrganizationId
- [ ] DELETE `/:id` - ensureOrganizationId

### Property Routes
- [ ] GET `/` - ensureOrganizationId
- [ ] POST `/` - ensureOrganizationId, validateOrganizationOwnership
- [ ] GET `/:id` - ensureOrganizationId
- [ ] PUT `/:id` - ensureOrganizationId
- [ ] DELETE `/:id` - ensureOrganizationId

### Reservation Routes
- [ ] GET `/` - ensureOrganizationId
- [ ] POST `/` - ensureOrganizationId, validateOrganizationOwnership
- [ ] GET `/:id` - ensureOrganizationId
- [ ] PUT `/:id` - ensureOrganizationId
- [ ] DELETE `/:id` - ensureOrganizationId

### Agency Routes
- [ ] GET `/` - ensureOrganizationId
- [ ] POST `/` - ensureOrganizationId, validateOrganizationOwnership
- [ ] GET `/:id` - ensureOrganizationId
- [ ] PUT `/:id` - ensureOrganizationId
- [ ] DELETE `/:id` - ensureOrganizationId

### RoomType Routes
- [ ] GET `/` - ensureOrganizationId
- [ ] POST `/` - ensureOrganizationId, validateOrganizationOwnership
- [ ] GET `/:id` - ensureOrganizationId
- [ ] PUT `/:id` - ensureOrganizationId
- [ ] DELETE `/:id` - ensureOrganizationId

### RatePlan Routes
- [ ] GET `/` - ensureOrganizationId
- [ ] POST `/` - ensureOrganizationId, validateOrganizationOwnership
- [ ] GET `/:id` - ensureOrganizationId
- [ ] PUT `/:id` - ensureOrganizationId
- [ ] DELETE `/:id` - ensureOrganizationId

### Inventory Routes
- [ ] GET `/` - ensureOrganizationId
- [ ] POST `/` - ensureOrganizationId, validateOrganizationOwnership
- [ ] GET `/:id` - ensureOrganizationId
- [ ] PUT `/:id` - ensureOrganizationId
- [ ] DELETE `/:id` - ensureOrganizationId

### Admin Routes (`routes/admin.js`)
- [ ] All routes - ensureOrganizationId, bypassForSuperAdmin

### Analytics Routes
- [ ] GET `/analytics` - ensureOrganizationId
- [ ] GET `/dashboard` - ensureOrganizationId

---

## Implementation Steps

### Step 1: Identify All Route Files
```bash
# Find all route files
find server/routes -name "*.js" -type f
```

### Step 2: Add Import at Top of Route File
```javascript
const {
  ensureOrganizationId,
  validateOrganizationOwnership,
  validateParamOrganization,
  bypassForSuperAdmin
} = require('../middlewares/organizationFilter');
```

### Step 3: Apply Middleware to Each Route

**BEFORE:**
```javascript
router.get('/:id', authenticateJWT, controller.getById);
```

**AFTER:**
```javascript
router.get('/:id', 
  authenticateJWT, 
  ensureOrganizationId, 
  controller.getById
);
```

### Step 4: Test Each Route
```bash
# Test with valid organization_id in JWT
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/resource

# Test with missing organization_id
# Should return 403 Forbidden
```

---

## Code Example: Complete Route File

```javascript
const express = require('express');
const authenticateJWT = require('../middlewares/auth');
const {
  ensureOrganizationId,
  validateOrganizationOwnership,
  validateParamOrganization,
  bypassForSuperAdmin
} = require('../middlewares/organizationFilter');
const propertyController = require('../controllers/property');

const router = express.Router();

// ✅ List all properties for user's organization
router.get('/',
  authenticateJWT,
  ensureOrganizationId,
  propertyController.getAll
);

// ✅ Create new property in user's organization
router.post('/',
  authenticateJWT,
  ensureOrganizationId,
  validateOrganizationOwnership,
  propertyController.create
);

// ✅ Get single property (must belong to user's org)
router.get('/:id',
  authenticateJWT,
  ensureOrganizationId,
  propertyController.getById
);

// ✅ Update property (must belong to user's org)
router.put('/:id',
  authenticateJWT,
  ensureOrganizationId,
  propertyController.update
);

// ✅ Delete property (must belong to user's org)
router.delete('/:id',
  authenticateJWT,
  ensureOrganizationId,
  propertyController.delete
);

// ✅ Restore deleted property (must belong to user's org)
router.post('/:id/restore',
  authenticateJWT,
  ensureOrganizationId,
  propertyController.restore
);

module.exports = router;
```

---

## Middleware Decision Tree

```
Request arrives
    ↓
Is it a public route?
├─ YES → No middleware needed
└─ NO → Proceed

Is it authenticated?
├─ NO → Return 401 Unauthorized
└─ YES → Apply ensureOrganizationId

Does it create/update data?
├─ YES → Apply validateOrganizationOwnership
└─ NO → Proceed

Does it have organization in URL?
├─ YES → Apply validateParamOrganization
└─ NO → Proceed

Is it an admin operation?
├─ YES → Apply bypassForSuperAdmin
└─ NO → Proceed

Call controller method (enforces org_id in BaseController)
    ↓
Return response
```

---

## Error Responses to Expect

### Missing Organization Context
```
Status: 403 Forbidden
{
  "success": false,
  "error": "Organization context missing"
}
```

### Cross-Organization Access Attempt
```
Status: 403 Forbidden
{
  "success": false,
  "error": "Cannot access resources from other organizations"
}
```

### Resource Not Found (includes cross-org attempts)
```
Status: 404 Not Found
{
  "success": false,
  "error": "<ResourceName> not found"
}
```

---

## Testing Checklist

- [ ] List route returns only own org's resources
- [ ] Create route prevents creating for other org
- [ ] Get route cannot access other org's resources
- [ ] Update route cannot modify other org's resources
- [ ] Delete route cannot delete other org's resources
- [ ] Attempting cross-org access returns 403
- [ ] Missing organization_id returns 403
- [ ] Super admin bypass is logged

---

## Common Mistakes to Avoid

### ❌ Don't: Forget ensureOrganizationId
```javascript
// BAD - organization filter missing
router.get('/:id', authenticateJWT, controller.getById);
```

### ✅ Do: Always add ensureOrganizationId
```javascript
// GOOD - organization filter enforced
router.get('/:id', 
  authenticateJWT, 
  ensureOrganizationId,
  controller.getById
);
```

### ❌ Don't: Override organization_id in controller
```javascript
// BAD - trying to bypass in controller
req.body.organization_id = req.params.orgId;
```

### ✅ Do: Let BaseController enforce it
```javascript
// GOOD - BaseController handles organization_id
// Just call the controller method
propertyController.create(req, res);
```

### ❌ Don't: Create separate org checking logic
```javascript
// BAD - duplicated logic
if (req.body.organization_id !== req.user.organization_id) {
  return res.status(403).json(...);
}
```

### ✅ Do: Use the middleware
```javascript
// GOOD - centralized logic
validateOrganizationOwnership
```

---

## Next Steps

1. Apply organization filter middleware to all routes
2. Run full test suite with multi-organization scenarios
3. Test super admin bypass behavior
4. Verify audit logs capture all bypass attempts
5. Monitor production for any 403 errors from legitimate users
6. Document any special cases or exceptions

---

**Related Documentation**:
- [Organization Filter Enforcement System](./ORGANIZATION_FILTER_ENFORCEMENT.md)
- [Token Blacklist System](./TOKEN_BLACKLIST_SYSTEM.md)
- [Security Architecture](./AGENCY_SYSTEM_REVIEW.md)

