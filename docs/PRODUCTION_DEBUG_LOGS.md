# Production Debug Logs - Suppression Guide

**Status**: ✅ Implemented  
**Date**: 17 January 2026

---

## 📋 Overview

Debug logs (console.log, console.debug, console.error) are automatically suppressed in production environment to prevent sensitive information leakage.

---

## 🔧 How It Works

### 1. **Logger Configuration** (`server/config/logger.js`)
```javascript
// Production: Only 'info' level and above
level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'

// Production: console output suppressed
console.log = () => {}      // Completely silent
console.debug = () => {}    // Completely silent
console.info → logger.info()   // Routed to Winston
console.warn → logger.warn()   // Routed to Winston
console.error → logger.error() // Routed to Winston
```

### 2. **Console Override** (`server/utils/consoleOverride.js`)
Runs at application startup (before any other requires):
```javascript
// server/server.js - First require
require('./utils/consoleOverride');
```

### 3. **Critical Files Updated**
- ✅ `server/middlewares/errorHandler.js` - Uses logger
- ✅ `server/controllers/auth.js` - Uses logger  
- ✅ `server/services/token.service.js` - Uses logger
- ✅ `server/services/user.service.js` - Uses logger
- ✅ `server/middlewares/tokenValidation.js` - Uses logger

---

## 📊 Environment Behavior

### Development (NODE_ENV=development)
```
✅ console.log → SHOWN
✅ console.debug → SHOWN
✅ console.info → SHOWN
✅ console.warn → SHOWN
✅ console.error → SHOWN
✅ Logger level: DEBUG (all)
```

### Production (NODE_ENV=production)
```
❌ console.log → SUPPRESSED
❌ console.debug → SUPPRESSED
✅ console.info → Logger (INFO level)
✅ console.warn → Logger (WARN level)
✅ console.error → Logger (ERROR level)
✅ Logger level: INFO (only important events)
```

---

## 🛡️ Security Benefits

### What Gets Blocked
- ❌ Stack traces in error responses
- ❌ Sensitive error details
- ❌ Debug variable dumps
- ❌ API call details
- ❌ Database query logs

### What Gets Logged (Safely)
- ✅ Structured error messages
- ✅ User actions (audit logs)
- ✅ System health
- ✅ Important warnings

---

## 📝 Implementation Details

### Logger Routes Console Calls
```javascript
// Before Production Override
console.error('Error:', error)  // Shows full error

// After Production Override  
console.error('Error:', error)  // Routed to logger
// Logger outputs: "[timestamp] [ERROR] Error: [error]"
```

### Winston Logger Configuration
```javascript
{
  level: 'info',  // Only info and above
  format: 'combined',  // Structured format
  transports: [
    new transports.Console(),
    // Can add File transport for production
  ]
}
```

---

## 🚀 Deployment Checklist

- [x] Logger configured with environment check
- [x] Console override module created
- [x] server.js loads override first
- [x] Critical files use logger
- [x] Error handler uses logger
- [x] Production suppress implemented
- [ ] File logging setup (optional)
- [ ] Log rotation setup (optional)
- [ ] Centralized log aggregation (optional)

---

## 📂 File Changes

| File | Change | Purpose |
|------|--------|---------|
| `server/config/logger.js` | Enhanced | Console suppression logic |
| `server/utils/consoleOverride.js` | ✨ NEW | Runtime console override |
| `server/server.js` | Updated | Load override first |
| `server/middlewares/errorHandler.js` | Updated | Use logger |
| `server/controllers/auth.js` | Updated | Use logger |
| `server/services/token.service.js` | Updated | Use logger |
| `server/services/user.service.js` | Updated | Use logger |
| `server/middlewares/tokenValidation.js` | Updated | Use logger |

---

## 🧪 Testing

### Verify Production Suppression
```bash
# Development mode - logs visible
NODE_ENV=development npm start
# See: console output visible

# Production mode - logs suppressed
NODE_ENV=production npm start
# See: Only structured logger output
```

### Test Specific Endpoints
```bash
# Login (auth logging)
curl -X POST http://localhost:5000/api/v1/auth/login

# Logout (token logging)
curl -X POST http://localhost:5000/api/v1/auth/logout

# Error handling
curl -X POST http://localhost:5000/api/v1/auth/invalid
```

---

## 🔍 Troubleshooting

### Problem: Logs not appearing in production
```bash
# Check NODE_ENV
echo $NODE_ENV  # Should be 'production'

# Check LOG_LEVEL
echo $LOG_LEVEL  # Defaults to 'info'

# Verify logger config
grep "NODE_ENV === 'production'" server/config/logger.js
```

### Problem: Important logs missing
```javascript
// Use logger instead of console
const logger = require('../config/logger');
logger.info('Important message');  // Visible in production
logger.warn('Warning message');    // Visible in production
```

### Problem: Debug logs still showing
```bash
# Check if override is loaded
grep "require.*consoleOverride" server/server.js  

# Must be FIRST require after dotenv
```

---

## 🔐 Security Best Practices

### DO ✅
- ✅ Use logger for all important information
- ✅ Log user actions and security events
- ✅ Log errors without sensitive details
- ✅ Filter sensitive data before logging

### DON'T ❌
- ❌ Log passwords, tokens, API keys
- ❌ Log full stack traces in production
- ❌ Log user input unfiltered
- ❌ Use console.log for sensitive data

---

## 📚 Additional Features (Optional)

### 1. File Logging
```javascript
// Add to logger.js
new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',
  maxSize: '20m',
  maxFiles: 5,
})
```

### 2. Log Rotation
```bash
npm install winston-daily-rotate-file
```

### 3. Centralized Logging
```javascript
// Integration with ELK, Splunk, CloudWatch, etc.
new winston.transports.Http({
  host: 'log-collector.example.com',
  port: 3001,
})
```

### 4. Correlation IDs
```javascript
// Track requests across logs
const correlationId = req.headers['x-correlation-id'];
logger.info('Request processed', { correlationId });
```

---

## 📞 Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | development | Controls log behavior |
| `LOG_LEVEL` | auto (see above) | Winston log level |

### .env Example
```dotenv
NODE_ENV=production
LOG_LEVEL=info
```

---

## ✅ Verification Checklist

```bash
# 1. Start app in production
NODE_ENV=production npm start

# 2. Test endpoint
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 3. Check output
# ❌ Should NOT show: "Register error: [object Object]"
# ✅ Should show: "[timestamp] [ERROR] Register error: ..."

# 4. Verify no sensitive data
# Should NOT contain: passwords, tokens, full errors
```

---

## 🎯 Summary

| Aspect | Before | After |
|--------|--------|-------|
| Production logs | Verbose, dangerous | Structured, safe |
| Debug output | Always visible | Suppressed |
| Error details | Full stack traces | Safe messages |
| Security | 🔴 High risk | 🟢 Protected |

**Result**: Production environment is secure, development remains verbose for debugging.

---

Generated: 17 Jan 2026  
Version: 1.0
