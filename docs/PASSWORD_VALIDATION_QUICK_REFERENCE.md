# Password Validation Quick Reference

**Status**: ✅ ACTIVE  
**Compliance**: OWASP  

---

## Minimum Requirements

Every password **MUST** have:

| Requirement | Example |
|-------------|---------|
| **12+ characters** | `Password123!` ✅ |
| **1 Uppercase** | `Password123!` ✅ |
| **1 Lowercase** | `PASSWORD123!` ❌ |
| **1 Number** | `Password!` ❌ |
| **1 Special Char** | `Password123` ❌ |

---

## What's BLOCKED

### Pattern Detection
- ❌ Sequential: `Pass0123!`, `PassAbcd!`
- ❌ Repeated: `Pass111!`
- ❌ Keyboard: `Qwerty123!`
- ❌ Too many digits: `Pass12345!`

### Common Passwords
- ❌ `password123`
- ❌ `qwerty`
- ❌ `admin123`
- ❌ 20+ others in blocklist

### Email-Based
- ❌ Password contains email address
- Example: Email `john@example.com` → Password `john@example123!` ❌

---

## Valid Examples

### ✅ Strong Passwords
- `MySecure$Pass123`
- `Complex#Pwd2024`
- `St0ng!Password`
- `UniQue@Psw2024`

### ❌ Weak Passwords
| Password | Problem |
|----------|---------|
| `Pass123!` | Too short (9 chars) |
| `password123` | Too common |
| `PASSWORD123!` | No lowercase |
| `MyPassword!` | No numbers |
| `Pass0123!` | Sequential numbers |
| `MyQwerty!2024` | Keyboard pattern |

---

## Error Messages

### Common Errors
```
❌ Password must be at least 12 characters long
❌ Password must contain at least one uppercase letter
❌ Password must contain at least one lowercase letter
❌ Password must contain at least one number
❌ Password must contain at least one special character
❌ Password cannot contain sequential numbers
❌ Password cannot contain repeated characters
❌ Password cannot contain keyboard patterns
❌ Password cannot contain your email address
❌ Password is too common
```

---

## API Usage

### Registration
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "MySecure$Pass123",    ✅ Valid
  "first_name": "John",
  "last_name": "Doe",
  "organization_name": "My Company"
}
```

### Password Change
```bash
PUT /users/:id/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "OldPass123!",
  "new_password": "NewSecure$Pass456"  ✅ Valid
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Password does not meet security requirements",
    "details": [
      "Password must be at least 12 characters long",
      "Password must contain at least one special character"
    ],
    "strength": "fair"
  }
}
```

---

## Password Strength Levels

| Level | Criteria |
|-------|----------|
| 🔴 `invalid` | Validation failed |
| 🟠 `weak` | Has errors |
| 🟡 `fair` | 3 requirements, < 12 chars |
| 🟢 `good` | 3 requirements, 12+ chars |
| 💚 `strong` | All 4 requirements, 12+ chars |
| 💙 `very_strong` | All 4 requirements, 14+ chars |

---

## Quick Password Generator

Use these patterns to create strong passwords:

**Formula**: `[Action][Color][Number]![Month]`
- Example: `FlySky2024!May`
- Check: 13 chars ✅, uppercase ✅, lowercase ✅, number ✅, special ✅

**Formula**: `[Adjective][Noun][Year]@[Symbol]`
- Example: `BlueMoon2024@#`
- Check: 14 chars ✅, uppercase ✅, lowercase ✅, number ✅, special ✅

**Formula**: `[Verb][Pet][Date]$[Season]`
- Example: `JumpDog2024$Summer`
- Check: 17 chars ✅, all requirements ✅

---

## Settings

### Production (Default - STRICT)
```
minLength: 12
Uppercase: Required
Lowercase: Required
Numbers: Required
Special Chars: Required
Patterns: Blocked
Email: Blocked
Common: Blocked
```

### Development (RELAXED)
```
minLength: 8
Uppercase: Required
Lowercase: Required
Numbers: Required
Special Chars: Optional
Patterns: Allowed
Email: Allowed
Common: Allowed
```

---

## Related Files

- **Implementation**: `server/utils/password.js`
- **Service**: `server/services/user.service.js`
- **Controller**: `server/controllers/auth.js`
- **Full Guide**: `docs/PASSWORD_VALIDATION_STRENGTHENING.md`

---

## FAQ

**Q: Why so many requirements?**  
A: Higher entropy = stronger security against attacks.

**Q: Can I use a pass phrase instead?**  
A: Yes! `MyDogIs7YearsOld!` works (has everything needed).

**Q: What if I forget my password?**  
A: Use password reset (applies same validation).

**Q: Can admin skip these?**  
A: No. Everyone must follow security requirements.

**Q: How do I reset a forgotten password?**  
A: Use password reset link sent to your email (same validation applies).

---

**Created**: 2024  
**Status**: ✅ Active  
**Compliance**: OWASP Standard
