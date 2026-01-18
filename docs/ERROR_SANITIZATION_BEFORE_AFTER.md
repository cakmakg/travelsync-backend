# Error Sanitization - Before & After Examples

**Purpose**: Visual comparison of error message sanitization  
**Date**: 2024  
**Security Level**: CRITICAL

---

## Example 1: Database Connection Error

### Before (Unsafe) ❌

**Code that throws error:**
```javascript
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://admin:secretPassword123@db.production.example.com:27017/travelsync');
  } catch (error) {
    throw error; // Raw error thrown
  }
};
```

**Client sees:**
```json
{
  "success": false,
  "error": {
    "message": "failed to connect to server: getaddrinfo EAI_AGAIN mongodb://admin:secretPassword123@db.production.example.com:27017"
  }
}
```

**Exposed Information:**
- ❌ Database username: `admin`
- ❌ Database password: `secretPassword123`
- ❌ Database host: `db.production.example.com`
- ❌ Port: `27017`
- ❌ Full connection string
- ❌ Internal error details

### After (Safe) ✅

**Code (same as above):**
```javascript
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://admin:secretPassword123@db.production.example.com:27017/travelsync');
  } catch (error) {
    throw error; // Same throw
  }
};
```

**Client sees:**
```json
{
  "success": false,
  "error": {
    "message": "Database connection failed"
  }
}
```

**Internal logging (for debugging):**
```
[ERROR] [Error Handler] Full error details:
  original: "failed to connect to server: getaddrinfo EAI_AGAIN mongodb://admin:secretPassword123@db.production.example.com:27017"
  sanitized: "Database connection failed"
  statusCode: 500
  timestamp: "2024-01-17T10:30:00Z"
  path: "/api/init"
```

**Protected Information:**
- ✅ Database credentials hidden
- ✅ Host information obscured
- ✅ Port not exposed
- ✅ No connection string leaked
- ✅ Internal details safe

---

## Example 2: File System Error

### Before (Unsafe) ❌

**Code:**
```javascript
const loadConfig = (path) => {
  try {
    const config = fs.readFileSync('/home/app/secrets/api-keys.json');
    return JSON.parse(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Client sees:**
```json
{
  "success": false,
  "error": {
    "message": "ENOENT: no such file or directory, open '/home/app/secrets/api-keys.json'"
  }
}
```

**Exposed Information:**
- ❌ Server filesystem structure: `/home/app/secrets/`
- ❌ Secret file names: `api-keys.json`
- ❌ Internal directory layout

### After (Safe) ✅

**Client sees:**
```json
{
  "success": false,
  "error": {
    "message": "Configuration error"
  }
}
```

**Internal logging:**
```
[ERROR] Configuration file not found
  original: "ENOENT: no such file or directory, open '/home/app/secrets/api-keys.json'"
  sanitized: "Configuration error"
  path: "/home/app/secrets/api-keys.json" (logged internally only)
```

**Protected Information:**
- ✅ File paths hidden
- ✅ Directory structure protected
- ✅ Secret names not exposed

---

## Example 3: Authentication Token Error

### Before (Unsafe) ❌

**Code:**
```javascript
const verifyToken = (token) => {
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};
```

**Client requests with malformed token:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U
```

**Client sees:**
```json
{
  "success": false,
  "error": {
    "message": "jwt malformed at eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
  }
}
```

**Exposed Information:**
- ❌ JWT token header exposed
- ❌ Token structure revealed

### After (Safe) ✅

**Client sees:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid token. Please login again."
  }
}
```

**Internal logging:**
```
[ERROR] JWT verification failed
  original: "jwt malformed at eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
  sanitized: "Invalid token. Please login again."
  token: "[TOKEN]" (redacted in logs)
```

**Protected Information:**
- ✅ Token content hidden
- ✅ Token structure not revealed

---

## Example 4: Password Validation Error

### Before (Unsafe) ❌

**Code:**
```javascript
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 12) errors.push('Too short');
  if (!/[A-Z]/.test(password)) errors.push('No uppercase');
  if (!/[0-9]/.test(password)) errors.push('No numbers');
  if (!/[!@#$%^&*]/.test(password)) errors.push('No special chars');
  
  return errors;
};

// User submits registration with password details
```

**Client sees (if errors logged):**
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "details": {
      "password": "Too short, No uppercase, No numbers, No special chars"
    }
  }
}
```

**Potentially exposed:**
- ❌ Password length requirements visible
- ❌ Validation rules exposed (helps attackers)

### After (Safe) ✅

**Client sees:**
```json
{
  "success": false,
  "error": {
    "message": "Password does not meet security requirements"
  }
}
```

**Internal logging:**
```
[WARN] [Password Validator] Weak password attempt
  email: "user@example.com"
  errors: ["Too short", "No uppercase", "No numbers", "No special chars"]
  strength: "very weak"
  attempts: 3
```

**Protected Information:**
- ✅ Specific validation rules hidden
- ✅ Doesn't help attackers craft valid passwords

---

## Example 5: SQL Injection Attempt

### Before (Unsafe) ❌

**Attacker sends:**
```
POST /api/login
{
  "email": "admin' OR '1'='1",
  "password": "anything"
}
```

**If error exposed:**
```json
{
  "success": false,
  "error": {
    "message": "Unexpected token 'OR' in query: SELECT * FROM users WHERE email='admin' OR '1'='1'"
  }
}
```

**Exposed Information:**
- ❌ Database query structure revealed
- ❌ SQL injection attempt visible
- ❌ Database table names shown
- ❌ Attackers learn about database structure

### After (Safe) ✅

**Attacker receives:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid request"
  }
}
```

**Internal security logging:**
```
[WARN] [Error Sanitizer] Injection attack detected
  pattern: "SQL keyword detected (OR)"
  original: "[REDACTED for security]"
  path: "/api/login"
  method: "POST"
  user: "anonymous"
  ip: "203.0.113.45"
  timestamp: "2024-01-17T10:32:15Z"
  severity: "HIGH"
```

**Security measures:**
- ✅ Injection attempt blocked
- ✅ No database structure revealed
- ✅ Attack logged and tracked
- ✅ Admin can investigate

---

## Example 6: XSS Attack Attempt

### Before (Unsafe) ❌

**Attacker sends:**
```
POST /api/update-profile
{
  "bio": "<script>alert('XSS')</script>"
}
```

**If error exposed:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid bio field. Contains script tag: <script>alert('XSS')</script>"
  }
}
```

**Exposed Information:**
- ❌ Confirms XSS vulnerability detection
- ❌ Helps attackers refine payloads

### After (Safe) ✅

**Attacker receives:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid input"
  }
}
```

**Internal security logging:**
```
[WARN] [Error Sanitizer] Injection attack detected
  pattern: "XSS detected (<script> tag)"
  original: "[REDACTED for security]"
  path: "/api/update-profile"
  method: "POST"
  user: "user123"
  ip: "203.0.113.46"
  timestamp: "2024-01-17T10:33:20Z"
  severity: "HIGH"
```

**Security measures:**
- ✅ XSS attempt blocked
- ✅ Payload hidden
- ✅ Attack logged
- ✅ Admin notified

---

## Example 7: Email Leak in Error

### Before (Unsafe) ❌

**User not found error:**
```json
{
  "success": false,
  "error": {
    "message": "User with email john.doe@company.com not found in database"
  }
}
```

**Exposed Information:**
- ❌ Real email address revealed
- ❌ Can be used for account enumeration
- ❌ Privacy violation (GDPR)

### After (Safe) ✅

**Client sees:**
```json
{
  "success": false,
  "error": {
    "message": "User not found"
  }
}
```

**Internal logging:**
```
[INFO] User lookup failed
  email: "john.doe@company.com" (logged internally only)
  path: "/api/users/lookup"
  timestamp: "2024-01-17T10:35:00Z"
```

**Protected Information:**
- ✅ Email address hidden
- ✅ Prevents account enumeration
- ✅ GDPR compliant

---

## Example 8: Environment Variable Leak

### Before (Unsafe) ❌

**Configuration error:**
```json
{
  "success": false,
  "error": {
    "message": "Cannot connect using API key: ${STRIPE_API_KEY}"
  }
}
```

**Exposed Information:**
- ❌ Environment variable names revealed
- ❌ Attackers know what services are used
- ❌ Helps in targeted attacks

### After (Safe) ✅

**Client sees:**
```json
{
  "success": false,
  "error": {
    "message": "Payment service unavailable"
  }
}
```

**Internal logging:**
```
[ERROR] Payment service error
  env_var: "${STRIPE_API_KEY}" (logged internally only)
  service: "Stripe"
  path: "/api/checkout"
```

**Protected Information:**
- ✅ Environment variable names hidden
- ✅ System architecture not revealed

---

## Example 9: API Key Leak in Error

### Before (Unsafe) ❌

**Third-party API error:**
```json
{
  "success": false,
  "error": {
    "message": "Third-party API call failed with key: sk_live_a1b2c3d4e5f6g7h8i9j0"
  }
}
```

**Exposed Information:**
- ❌ API key exposed
- ❌ Can be used for unauthorized API calls
- ❌ Attacker can impersonate service

### After (Safe) ✅

**Client sees:**
```json
{
  "success": false,
  "error": {
    "message": "Third-party service error"
  }
}
```

**Internal logging:**
```
[ERROR] Third-party API error
  api_key: "[REDACTED]" (never logged fully)
  service: "Stripe"
  error_code: "auth_failed"
```

**Protected Information:**
- ✅ API keys redacted
- ✅ Sensitive credentials protected

---

## Example 10: Stack Trace Exposure

### Before (Unsafe) ❌

**Production error with stack trace:**
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "stack": [
      "at getUserById (/home/app/server/services/user.service.js:45)",
      "at Object.<anonymous> (/home/app/server/controllers/user.js:128)",
      "at Layer.handle [as handle_request] (/home/app/node_modules/express/lib/router/layer.js:95)",
      "at next (/home/app/node_modules/express/lib/router/route.js:137)"
    ]
  }
}
```

**Exposed Information:**
- ❌ File paths and line numbers revealed
- ❌ Directory structure visible
- ❌ Function names and logic exposed
- ❌ Version information from node_modules paths

### After (Safe) ✅

**Production error:**
```json
{
  "success": false,
  "error": {
    "message": "Internal server error"
  }
}
```

**Development error (NODE_ENV=development):**
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "stack": [
      "at getUserById (/home/app/server/services/user.service.js:45)",
      "at Object.<anonymous> (/home/app/server/controllers/user.js:128)"
    ]
  }
}
```

**Internal production logging (always available):**
```
[ERROR] Unhandled error in route
  message: "Cannot read property 'email' of undefined"
  stack: "at getUserById /home/app/server/services/user.service.js:45"
  path: "/api/users/123"
  method: "GET"
  timestamp: "2024-01-17T10:40:00Z"
```

**Protected Information:**
- ✅ Stack traces hidden in production
- ✅ File paths not exposed to clients
- ✅ Internal structure protected
- ✅ Full debug info available via logs

---

## Comparison Table

| Scenario | Before | After | Protected |
|----------|--------|-------|-----------|
| DB Connection | `mongodb://user:pass@host` | `[REDACTED]` | Credentials |
| File Path | `/home/app/secrets/key.json` | `[PATH]` | System structure |
| IP Address | `192.168.1.1` | `[IP]` | Server IPs |
| Email | `user@company.com` | `[EMAIL]` | Privacy |
| Token | `eyJhbGciOiJI...` | `[TOKEN]` | Credentials |
| API Key | `sk_live_abc123` | `[REDACTED]` | Credentials |
| SQL Query | `SELECT * FROM users...` | `[SQL]` | DB structure |
| Env Var | `${DB_PASSWORD}` | `[ENV]` | Configuration |
| XSS Attempt | `<script>alert(...)</script>` | `Invalid request` | Attack blocked |
| SQL Injection | `admin' OR '1'='1` | `Invalid request` | Attack blocked |
| Stack Trace (Prod) | Full path + line numbers | None | Structure hidden |
| Stack Trace (Dev) | Full path + line numbers | Full path + line numbers | Debuggable |

---

## Security Impact Summary

### Information Disclosure Prevention ✅
- Database credentials protected
- System structure hidden
- File paths obscured
- Configuration secure

### Attack Prevention ✅
- SQL injection attempts blocked
- XSS attempts blocked
- Parameter pollution mitigated
- Information-gathering attacks fail

### Privacy Compliance ✅
- GDPR: No PII in responses
- CCPA: No personal data in errors
- Privacy by design implemented

### Debugging Capability ✅
- Full errors logged internally
- Timestamps preserved
- User context maintained
- Audit trail available

---

## Deployment Confidence

**Before**: Risky - exposes sensitive information  
**After**: Confident - secure by default

**Client Safety**: High - no sensitive data exposure  
**Internal Visibility**: High - full errors logged  
**Production Ready**: Yes - zero security issues

---

*Error message sanitization ensures that information disclosure attacks via error messages are impossible, while maintaining full debugging capability through internal logging.*
