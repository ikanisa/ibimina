# WhatsApp OTP Authentication Implementation

## Overview
This document outlines the WhatsApp OTP authentication system for the Ibimina Client Mobile App.

## Flow
1. User opens app → sees 3 exploration screens
2. User can browse features without signing in
3. When user tries to perform action (deposit, withdraw, transfer) → Auth required
4. User enters WhatsApp number → Receives OTP on WhatsApp
5. User enters OTP → Gets authenticated
6. User can now perform actions

## Implementation Components

### 1. Exploration/Onboarding Screens (3 screens)
- **Screen 1**: Welcome + "Manage Your Savings Easily"
- **Screen 2**: "Send Money Instantly"
- **Screen 3**: "Get Loans When You Need"
- Skip button → Goes to browse mode
- Get Started → Goes to WhatsApp auth

### 2. Browse Mode (Unauthenticated)
- User can view:
  - Demo dashboard
  - Sample transaction history
  - Feature list
  - FAQ/Help
- When user tries to interact → Show WhatsApp auth modal

### 3. WhatsApp OTP Auth
- Input: WhatsApp phone number (Rwanda +250...)
- Backend sends OTP via WhatsApp Business API
- User receives OTP on WhatsApp
- User enters 6-digit OTP
- Backend verifies OTP → Creates/logs in user
- Session stored in AsyncStorage

### 4. Backend Integration
- Edge Function: `whatsapp-auth-send-otp`
- Edge Function: `whatsapp-auth-verify-otp`
- Database table: `auth_otp_codes`
- WhatsApp Business API integration (Twilio/MessageBird)

## Security Considerations
- OTP expires after 5 minutes
- Maximum 3 retry attempts per phone number per 15 minutes
- Rate limiting on send-otp endpoint
- Phone number verification (Rwanda format: +250...)
- HMAC signature for OTP codes
- Store hashed OTP in database

## Database Schema

```sql
-- OTP codes table
create table if not exists auth_otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  otp_code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  verified bool not null default false,
  created_at timestamptz not null default now()
);

create index if not exists auth_otp_codes_phone_idx on auth_otp_codes(phone_number, created_at desc);
create index if not exists auth_otp_codes_expires_idx on auth_otp_codes(expires_at);

-- Cleanup old OTPs (run daily)
create or replace function cleanup_expired_otps()
returns void as $$
begin
  delete from auth_otp_codes
  where expires_at < now() - interval '1 day';
end;
$$ language plpgsql security definer;
```

## WhatsApp Business API Setup

### Option 1: Twilio
```typescript
// Send OTP via Twilio WhatsApp
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER"); // e.g., +14155238886

const message = `Your Ibimina verification code is: ${otpCode}\n\nThis code expires in 5 minutes.`;

const response = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
  {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: `whatsapp:${twilioWhatsAppNumber}`,
      To: `whatsapp:${phoneNumber}`,
      Body: message,
    }),
  }
);
```

### Option 2: MessageBird (Africa-optimized)
```typescript
// MessageBird has better Africa coverage
const messageBirdAccessKey = Deno.env.get("MESSAGEBIRD_ACCESS_KEY");

const message = {
  to: phoneNumber,
  from: "Ibimina",
  type: "text",
  content: {
    text: `Your Ibimina verification code is: ${otpCode}\n\nThis code expires in 5 minutes.`,
  },
  channelId: Deno.env.get("MESSAGEBIRD_WHATSAPP_CHANNEL_ID"),
};

const response = await fetch("https://conversations.messagebird.com/v1/send", {
  method: "POST",
  headers: {
    Authorization: `AccessKey ${messageBirdAccessKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(message),
});
```

## Implementation Checklist

### Frontend
- [ ] Create OnboardingScreen.tsx (3 swipeable slides)
- [ ] Create BrowseMode screens (demo data)
- [ ] Create WhatsAppAuthScreen.tsx (phone input)
- [ ] Create OTPVerificationScreen.tsx (6-digit input)
- [ ] Add auth interceptor for protected actions
- [ ] Update navigation to support browse mode
- [ ] Add WhatsApp auth to Zustand store
- [ ] Handle OTP expiry/retry logic
- [ ] Add loading states and error handling

### Backend
- [ ] Create auth_otp_codes table migration
- [ ] Create send-whatsapp-otp Edge Function
- [ ] Create verify-whatsapp-otp Edge Function
- [ ] Set up WhatsApp Business API (Twilio or MessageBird)
- [ ] Add rate limiting (max 3 OTPs per 15 min)
- [ ] Add phone number validation (Rwanda format)
- [ ] Add OTP cleanup cron job
- [ ] Add logging and monitoring
- [ ] Test OTP delivery in Rwanda

### Testing
- [ ] Test exploration screens flow
- [ ] Test browse mode restrictions
- [ ] Test WhatsApp OTP send
- [ ] Test OTP verification success/failure
- [ ] Test OTP expiry
- [ ] Test rate limiting
- [ ] Test phone number validation
- [ ] Test session persistence
- [ ] End-to-end test: onboarding → auth → deposit

## Environment Variables

```bash
# .env.local (backend)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886

# OR MessageBird
MESSAGEBIRD_ACCESS_KEY=xxxxx
MESSAGEBIRD_WHATSAPP_CHANNEL_ID=xxxxx

# OTP Settings
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_MINUTES=15
```

## User Experience Flow

```
┌─────────────────────────────────────┐
│   App Launch                        │
│   ↓                                 │
│   First time? → Onboarding (3 screens)
│   Returning? → Check session        │
│   ↓                                 │
│   ┌─────────────┐  ┌──────────────┐│
│   │ Skip →      │  │ Get Started →││
│   │ Browse Mode │  │ WhatsApp Auth││
│   └─────────────┘  └──────────────┘│
│                                     │
│   Browse Mode:                      │
│   - View demo dashboard             │
│   - View sample transactions        │
│   - View features                   │
│   - Click action → Auth required    │
│                                     │
│   WhatsApp Auth:                    │
│   1. Enter phone: +250 7XX XXX XXX  │
│   2. Receive OTP on WhatsApp        │
│   3. Enter 6-digit OTP              │
│   4. Verify → Authenticated         │
│   5. Create profile (if new user)   │
│                                     │
│   Authenticated:                    │
│   - Full app access                 │
│   - Deposit/Withdraw/Transfer       │
│   - View real data                  │
│   - Apply for loans                 │
└─────────────────────────────────────┘
```

## Error Handling

| Error Case | User Message | Action |
|------------|--------------|--------|
| Invalid phone format | "Please enter a valid Rwanda phone number (+250...)" | Show inline error |
| OTP send failed | "Could not send OTP. Please try again." | Retry button |
| OTP expired | "This code has expired. Request a new one." | Resend OTP |
| Wrong OTP | "Incorrect code. X attempts remaining." | Allow retry |
| Max attempts | "Too many failed attempts. Try again in 15 minutes." | Disable for 15 min |
| Rate limited | "Too many requests. Please wait X minutes." | Show countdown |
| Network error | "No internet connection. Please check and try again." | Retry button |

## Success Metrics

- **OTP Delivery Rate**: > 95% delivered within 30 seconds
- **OTP Verification Rate**: > 85% first-attempt success
- **Auth Abandonment**: < 20% drop-off between phone entry and OTP verification
- **Browse-to-Auth Conversion**: > 40% of browsers complete auth

## Future Enhancements

1. **Biometric Re-auth**: After initial WhatsApp auth, enable Face ID/Touch ID
2. **Social Auth Backup**: Google/Apple Sign-In as alternative
3. **SMS Fallback**: If WhatsApp fails, fallback to SMS OTP
4. **Voice Call OTP**: For users with reading difficulties
5. **Auto-fill OTP**: Use Android SMS Retriever API / iOS SMS autofill

---

**Status**: 🚧 Ready for implementation
**Estimated Time**: 12-15 hours
**Priority**: High (Required for launch)
