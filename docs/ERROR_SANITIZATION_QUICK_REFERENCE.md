# Error Sanitization Quick Reference

## One-Line Summaries

| What | Before | After |
|------|--------|-------|
| **DB Error** | `mongodb://admin:pass@host` exposed | `[REDACTED]` hidden |
| **File Path** | `/home/app/secret.pem` visible | `[PATH]` masked |
| **IP Address** | `192.168.1.1` shown | `[IP]` hidden |
| **Email** | `admin@company.com` leaked | `[EMAIL]` obscured |
| **Token** | `eyJhbGciOiJIUz...` exposed | `[TOKEN]` removed |
| **Hash** | Full hash string visible | `[HASH]` masked |
| **SQL** | `SELECT * FROM users` shown | `[SQL]` blocked |
| **Env Var** | `${DB_PASSWORD}` exposed | `[ENV]` hidden |

## Sanitization Functions

### sanitizeError(error, isDevelopment)
```javascript
// Remove sensitive data from error message
const safe = sanitizeError(dbError, false);
console.log(safe.message); // Generic safe message
```

### createSafeErrorResponse(error, req, isDevelopment)
```javascript
// Create response + log full error internally
const response = createSafeErrorResponse(err, req, false);
res.status(response.statusCode).json(response);
```

### sanitizeObject(obj, keysToRedact)
```javascript
// Hide sensitive object properties
const safe = sanitizeObject(userData, ['password', 'token']);
```

### sanitizeLogData(data)
```javascript
// Prepare safe data for logging
logger.info('Action', sanitizeLogData(userData));
```

### formatValidationErrors(errors)
```javascript
// Format Mongoose errors safely
const formatted = formatValidationErrors(validationErrors);
```

### isSafeToExpose(error)
```javascript
// Check if error is safe for client
if (!isSafeToExpose(err)) {
  err = sanitizeError(err);
}
```

## Patterns Redacted

```
✗ mongodb://user:pass@host → ✓ [REDACTED]
✗ /path/to/file.js         → ✓ [PATH]
✗ 192.168.1.100            → ✓ [IP]
✗ user@example.com         → ✓ [EMAIL]
✗ eyJhbGciOiJI...          → ✓ [TOKEN]
✗ a1b2c3d4e5f6g7h8         → ✓ [HASH]
✗ SELECT * FROM users      → ✓ [SQL]
✗ ${DB_PASSWORD}           → ✓ [ENV]
```

## Key Behaviors

| Feature | Behavior |
|---------|----------|
| **Logging** | Full errors logged internally (never exposed) |
| **Responses** | Sanitized before sent to client |
| **Stack Traces** | Development only |
| **Injection Detection** | Blocked + logged with warning |
| **Development Mode** | Full details visible |
| **Production Mode** | Generic safe messages |

## Error Handler Flow

```
Error Thrown
    ↓
Full Error Logged (internal use only)
    ↓
Check: Is it safe to expose?
    ↓
   YES                    NO
    ↓                      ↓
Send as-is         Sanitize & Generic Message
    ↓                      ↓
Client Response    Client Response (Safe)
```

## Common Scenarios

### Unauthorized
```json
→ Client receives:
{
  "error": {
    "message": "Invalid token. Please login again."
  }
}
```

### Database Error
```json
→ Client receives:
{
  "error": {
    "message": "Database connection failed"
  }
}
```

### Validation Error
```json
→ Client receives:
{
  "error": {
    "message": "Validation failed",
    "details": [
      {"field": "email", "message": "Invalid format"}
    ]
  }
}
```

### Injection Attempt
```json
→ Client receives:
{
  "error": {
    "message": "Invalid request"
  }
}

→ Server logs:
[WARN] Injection attack detected
  pattern: <script> tag
  ip: 203.0.113.45
  path: /api/login
```

## Sensitive Keys Auto-Redacted

```
password          → [REDACTED]
token             → [REDACTED]
secret            → [REDACTED]
api_key           → [REDACTED]
refresh_token     → [REDACTED]
access_token      → [REDACTED]
authorization     → [REDACTED]
```

## Testing Checklist

- [ ] Errors with DB URLs redacted
- [ ] File paths hidden
- [ ] IP addresses masked
- [ ] Email addresses obscured
- [ ] Tokens removed
- [ ] Hashes masked
- [ ] SQL patterns blocked
- [ ] Env vars hidden
- [ ] Injection attempts detected
- [ ] Stack traces absent in production
- [ ] Full details logged internally

## Environment Variable

```bash
# Development: Full error details + stack
NODE_ENV=development

# Production: Sanitized error messages only
NODE_ENV=production
```

## Code Locations

| File | Purpose |
|------|---------|
| `server/utils/errorSanitizer.js` | Sanitization functions |
| `server/middlewares/errorHandler.js` | Error catching + sanitization |
| `server/utils/response.js` | Response formatting |

## Files Affected

- ✅ `errorSanitizer.js` - NEW
- ✅ `errorHandler.js` - UPDATED
- ✅ `response.js` - UPDATED
- ⏳ Next: Service layers

---

**Quick Deploy**: Zero breaking changes, just safer error messages.

**Quick Test**: Throw error with sensitive data, verify sanitization.

---
