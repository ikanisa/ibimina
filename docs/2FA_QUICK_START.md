# 2FA/MFA QR Authentication - Quick Start Guide

## For Developers

### Deploy to Supabase

```bash
# 1. Set secrets
supabase secrets set HMAC_SHARED_SECRET=$(openssl rand -hex 32)

# 2. Deploy functions
cd /Users/jeanbosco/workspace/ibimina
supabase functions deploy auth-qr-generate
supabase functions deploy auth-qr-verify
supabase functions deploy auth-qr-poll

# 3. Apply migration
supabase db push
```

### Test PWA

```bash
cd apps/staff-admin-pwa
pnpm dev
# Open http://localhost:3100/login
# Click "QR Code" tab
```

### Implement Android Scanner

```bash
# 1. Install plugins
cd apps/staff-admin-mobile
pnpm add @capacitor-community/barcode-scanner @capgo/capacitor-native-biometric

# 2. Add to AndroidManifest.xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />

# 3. Create scanner screen (see /docs/2FA_QR_AUTHENTICATION.md)
```

## For Staff Users

### First Time Setup

1. **Download App**: Get Staff Admin app from your device management portal
2. **Login**: Use your staff credentials (email + password)
3. **Enable Biometric**: Enroll fingerprint/face in phone settings
4. **Register Device**: App will prompt to register your device
5. **Done**: You can now use QR authentication

### Daily Login (Web)

1. **Open Web App**: Navigate to staff admin portal
2. **Choose QR Code**: Click "QR Code" tab on login page
3. **Scan with Phone**: Open mobile app, tap "Scan QR"
4. **Authenticate**: Use your fingerprint or face
5. **Done**: Web app logs you in automatically

### Daily Login (Mobile)

- Mobile app stays logged in
- Uses biometric to unlock
- No QR code needed for mobile

## For Admins

### View Authentication Logs

```sql
-- Recent QR logins
SELECT
  al.created_at,
  u.email,
  sd.device_name,
  al.biometric_used
FROM auth_logs al
JOIN auth.users u ON al.staff_id = u.id
LEFT JOIN staff_devices sd ON al.device_id = sd.device_id
WHERE al.event_type = 'qr_login'
ORDER BY al.created_at DESC
LIMIT 50;
```

### Revoke a Device

```sql
-- Suspend specific device
UPDATE staff_devices
SET status = 'suspended'
WHERE device_id = 'target-device-id';

-- Revoke all devices for a staff member
UPDATE staff_devices
SET status = 'revoked'
WHERE staff_id = 'target-staff-id';
```

### View Active Sessions

```sql
-- Current QR sessions
SELECT
  session_id,
  status,
  created_at,
  expires_at
FROM auth_qr_sessions
WHERE status = 'pending'
AND expires_at > NOW();
```

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] HMAC secret set in Supabase
- [ ] Rate limiting configured
- [ ] Audit logs monitored
- [ ] Device registration required
- [ ] Biometric enrollment enforced
- [ ] Session cleanup job scheduled
- [ ] Alert system for suspicious activity

## Troubleshooting

| Problem               | Solution                                 |
| --------------------- | ---------------------------------------- |
| QR not generating     | Check Supabase edge function logs        |
| Mobile can't verify   | Ensure device is registered and active   |
| Biometric not working | Check phone settings and app permissions |
| Session expired       | Regenerate QR (sessions last 5 minutes)  |
| Device revoked        | Contact admin to reactivate device       |

## File Locations

- Edge Functions: `/supabase/functions/auth-qr-*/index.ts`
- Migration: `/supabase/migrations/20250103_qr_auth_tables.sql`
- PWA Component: `/apps/staff-admin-pwa/src/components/auth/QRAuthLogin.tsx`
- API Client: `/apps/staff-admin-pwa/src/api/qr-auth.ts`
- Full Docs: `/docs/2FA_QR_AUTHENTICATION.md`

## API Endpoints

```
POST /functions/v1/auth-qr-generate
GET  /functions/v1/auth-qr-poll?sessionId=<id>
POST /functions/v1/auth-qr-verify
```

## Support

For issues or questions:

1. Check `/docs/2FA_QR_AUTHENTICATION.md` (detailed documentation)
2. Review implementation status in `/docs/2FA_IMPLEMENTATION_STATUS.md`
3. Check Supabase logs: `supabase functions logs auth-qr-generate`
4. Contact DevOps team

---

**Last Updated**: 2025-01-03  
**Status**: Backend & PWA complete, Android pending
