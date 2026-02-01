# NutriScan Pre-Launch Deployment Checklist

This document outlines all remaining tasks before NutriScan can be submitted to the App Store and Play Store.

## Overview

| Category                 | Status      | Priority         |
| ------------------------ | ----------- | ---------------- |
| In-App Purchases         | Not Started | P0 - Blocker     |
| App Store Configuration  | Not Started | P0 - Blocker     |
| Play Store Configuration | Not Started | P0 - Blocker     |
| Server Deployment        | Not Started | P0 - Blocker     |
| Database Migration       | Not Started | P0 - Blocker     |
| Security Hardening       | Partial     | P1 - Required    |
| Testing                  | Partial     | P1 - Required    |
| Monitoring & Analytics   | Not Started | P1 - Required    |
| Legal & Compliance       | Not Started | P1 - Required    |
| Marketing Assets         | Not Started | P2 - Pre-Launch  |
| Video Recording Feature  | Not Started | P3 - Post-Launch |

---

## P0 - Launch Blockers

### 1. In-App Purchases (expo-iap)

The subscription system is wired up with stubs. Actual IAP integration is required.

#### 1.1 Install and Configure expo-iap

```bash
# Install expo-iap
npx expo install expo-iap

# Update app.json with IAP plugin
```

- [ ] Install `expo-iap` package
- [ ] Add expo-iap plugin to `app.json`
- [ ] Wrap app with `IAPProvider` in `App.tsx`

#### 1.2 Create Custom Development Client

expo-iap requires a custom dev client (cannot use Expo Go).

```bash
# Build development client
eas build --profile development --platform ios
eas build --profile development --platform android
```

- [ ] Configure `eas.json` with development profile
- [ ] Build iOS development client
- [ ] Build Android development client
- [ ] Test that dev client launches correctly

#### 1.3 Implement Purchase Flow

Replace stub implementations in:

- `client/screens/ScanScreen.tsx:227-254`
- `client/screens/ProfileScreen.tsx:237-260`

- [ ] Create `client/hooks/usePurchase.ts` hook
- [ ] Implement `useIAP` integration
- [ ] Handle `currentPurchase` effect correctly
- [ ] Always call `finishTransaction()` after purchase
- [ ] Handle all error codes (especially `E_USER_CANCELLED`)
- [ ] Implement restore purchases flow
- [ ] Test purchase flow end-to-end

#### 1.4 Implement Receipt Validation

Replace stub in `server/services/receipt-validation.ts`:

- [ ] Implement Apple receipt validation (App Store Server API)
- [ ] Implement Google receipt validation (Play Developer API)
- [ ] Store App Store Server API credentials securely
- [ ] Store Google Play service account credentials securely
- [ ] Test validation with sandbox receipts

### 2. App Store Configuration (iOS)

#### 2.1 App Store Connect Setup

- [ ] Create app in App Store Connect
- [ ] Configure bundle identifier: `com.nutriscan.app`
- [ ] Upload app icon (1024x1024)
- [ ] Write app description and keywords
- [ ] Add screenshots for all required device sizes
- [ ] Set app category: Health & Fitness
- [ ] Set age rating (likely 4+)
- [ ] Configure app privacy labels

#### 2.2 In-App Purchase Product

- [ ] Create subscription product in App Store Connect
- [ ] Product ID: `com.nutriscan.premium.annual`
- [ ] Set price point (e.g., $29.99/year)
- [ ] Configure 3-day free trial
- [ ] Write subscription description
- [ ] Submit for review (can be reviewed before app)

#### 2.3 Certificates and Provisioning

- [ ] Create distribution certificate
- [ ] Create App Store provisioning profile
- [ ] Configure push notification certificate (if needed)
- [ ] Set up App Store Server Notifications endpoint (optional but recommended)

### 3. Play Store Configuration (Android)

#### 3.1 Play Console Setup

- [ ] Create app in Google Play Console
- [ ] Configure package name: `com.nutriscan.app`
- [ ] Upload app icon and feature graphic
- [ ] Write app description
- [ ] Add screenshots for phone and tablet
- [ ] Set content rating
- [ ] Configure data safety section

#### 3.2 In-App Purchase Product

- [ ] Create subscription product in Play Console
- [ ] Product ID: `com.nutriscan.premium.annual`
- [ ] Set price point matching iOS
- [ ] Configure 3-day free trial
- [ ] Enable subscription management

#### 3.3 App Signing

- [ ] Generate upload key
- [ ] Configure Play App Signing
- [ ] Store keystore securely

### 4. Server Deployment

#### 4.1 Production Environment

- [ ] Choose hosting provider (Railway, Render, Fly.io, AWS, etc.)
- [ ] Set up production PostgreSQL database
- [ ] Configure environment variables:
  - `DATABASE_URL`
  - `SESSION_SECRET` (generate strong secret)
  - `AI_INTEGRATIONS_OPENAI_API_KEY`
  - `AI_INTEGRATIONS_OPENAI_BASE_URL` (if custom)
  - `APPLE_SHARED_SECRET` (for receipt validation)
  - `GOOGLE_SERVICE_ACCOUNT_KEY` (for receipt validation)
- [ ] Set up SSL/TLS
- [ ] Configure domain and DNS
- [ ] Set up health check endpoint

#### 4.2 Build and Deploy

```bash
npm run server:build
# Deploy server_dist/ to production
```

- [ ] Test production build locally
- [ ] Deploy to staging environment
- [ ] Test all endpoints in staging
- [ ] Deploy to production
- [ ] Verify production health

#### 4.3 Database Setup

- [ ] Run migrations on production database
- [ ] Verify all tables created correctly
- [ ] Set up database backups
- [ ] Test connection pooling under load

### 5. Database Migration

- [ ] Run `npm run db:push` on production database
- [ ] Verify `transactions` table created with correct enums
- [ ] Verify indexes created on `transactions` table
- [ ] Test subscription upgrade flow end-to-end

---

## P1 - Required Before Launch

### 6. Security Hardening

#### 6.1 Authentication

- [ ] Verify password hashing strength (bcrypt rounds)
- [ ] Implement rate limiting on all auth endpoints
- [ ] Add account lockout after failed attempts
- [ ] Secure session configuration for production

#### 6.2 API Security

- [ ] Verify all endpoints require authentication where needed
- [ ] Add request validation on all endpoints
- [ ] Implement CORS properly for production domain
- [ ] Add security headers (Helmet.js)
- [ ] Remove any debug/development endpoints

#### 6.3 Data Protection

- [ ] Encrypt sensitive data at rest
- [ ] Secure API keys and secrets
- [ ] Implement proper error messages (no stack traces in prod)
- [ ] Audit logs for sensitive operations

### 7. Testing

#### 7.1 Unit Tests

- [x] Server tests passing (39 tests)
- [x] Client tests passing (multiple test files)
- [x] Shared schema tests passing
- [ ] Achieve minimum 80% code coverage

#### 7.2 Integration Tests

- [ ] Test complete purchase flow (sandbox)
- [ ] Test restore purchases flow
- [ ] Test subscription expiration handling
- [ ] Test scan limit enforcement

#### 7.3 Device Testing

- [ ] Test on iPhone (various sizes)
- [ ] Test on iPad
- [ ] Test on Android phone (various sizes)
- [ ] Test on Android tablet
- [ ] Test camera/barcode scanning on all devices
- [ ] Test in low-light conditions
- [ ] Test offline behavior

#### 7.4 Sandbox Testing

- [ ] Create sandbox test accounts (Apple)
- [ ] Create test accounts (Google Play)
- [ ] Test new subscription purchase
- [ ] Test subscription renewal (accelerated in sandbox)
- [ ] Test subscription cancellation
- [ ] Test restore purchases
- [ ] Test trial-to-paid conversion

### 8. Monitoring & Analytics

#### 8.1 Error Tracking

- [ ] Set up Sentry (or similar) for crash reporting
- [ ] Configure source maps for meaningful stack traces
- [ ] Set up error alerting

#### 8.2 Analytics

- [ ] Set up analytics (Amplitude, Mixpanel, or similar)
- [ ] Track key events:
  - App open
  - Scan completed
  - Upgrade modal shown
  - Purchase initiated
  - Purchase completed
  - Trial started
- [ ] Set up conversion funnel tracking

#### 8.3 Server Monitoring

- [ ] Set up uptime monitoring
- [ ] Configure performance metrics
- [ ] Set up alerting for errors/downtime
- [ ] Monitor database performance

### 9. Legal & Compliance

#### 9.1 Privacy Policy

- [ ] Draft privacy policy
- [ ] Include data collection disclosures
- [ ] Include third-party services (OpenAI, analytics)
- [ ] Host privacy policy at accessible URL
- [ ] Link in app settings

#### 9.2 Terms of Service

- [ ] Draft terms of service
- [ ] Include subscription terms
- [ ] Include auto-renewal disclosure
- [ ] Host ToS at accessible URL
- [ ] Link in app settings

#### 9.3 App Store Requirements

- [ ] Display "Restore Purchases" prominently
- [ ] Show subscription terms near purchase button
- [ ] Include auto-renewal disclosure text
- [ ] Comply with App Store Review Guidelines 3.1.2

#### 9.4 GDPR/CCPA Compliance

- [ ] Implement data export functionality
- [ ] Implement data deletion functionality
- [ ] Add consent management where required

---

## P2 - Pre-Launch (Can Be Done in Parallel)

### 10. Marketing Assets

#### 10.1 App Store Assets

- [ ] App icon (1024x1024)
- [ ] iPhone screenshots (6.7", 6.5", 5.5")
- [ ] iPad screenshots (12.9", 11")
- [ ] App preview video (optional but recommended)
- [ ] Promotional text (170 characters)
- [ ] Description (4000 characters)
- [ ] Keywords (100 characters)
- [ ] What's New text

#### 10.2 Play Store Assets

- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Phone screenshots (min 2)
- [ ] Tablet screenshots (min 1)
- [ ] Short description (80 characters)
- [ ] Full description (4000 characters)
- [ ] Promo video (optional)

#### 10.3 Landing Page (Optional)

- [ ] Create nutriscan.app landing page
- [ ] Include app store badges
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Support/contact page

---

## P3 - Post-Launch Features

### 11. Video Recording Feature

Listed as "coming soon" in premium benefits. Plan implementation after launch.

- [ ] Create plan document for video recording feature
- [ ] Implement video capture with `react-native-vision-camera`
- [ ] Implement video analysis with AI
- [ ] Update premium benefits to remove "(coming soon)"

### 12. Future Enhancements

- [ ] Push notifications for daily reminders
- [ ] Apple Health / Google Fit integration
- [ ] Social sharing features
- [ ] Recipe suggestions
- [ ] Meal planning

---

## Launch Day Checklist

### Before Submission

- [ ] All P0 items complete
- [ ] All P1 items complete
- [ ] Version number set correctly in `app.json`
- [ ] Build number incremented
- [ ] Production server deployed and healthy
- [ ] Database migrated
- [ ] All secrets configured in production

### Build and Submit

```bash
# Build for App Store
eas build --platform ios --profile production

# Build for Play Store
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Post-Submission

- [ ] Monitor App Store Connect for review status
- [ ] Monitor Play Console for review status
- [ ] Respond to any review feedback promptly
- [ ] Prepare for potential rejection reasons:
  - Missing restore purchases (App Store)
  - Privacy policy issues
  - Subscription disclosure issues

### Launch

- [ ] Apps approved by both stores
- [ ] Coordinate release timing
- [ ] Release apps simultaneously
- [ ] Monitor crash reports
- [ ] Monitor reviews
- [ ] Monitor subscription purchases

---

## Environment Variables Reference

### Production Server

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/nutriscan

# Security
SESSION_SECRET=<generate-256-bit-secret>
JWT_SECRET=<generate-256-bit-secret>

# AI
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# Receipt Validation
APPLE_SHARED_SECRET=<from-app-store-connect>
GOOGLE_SERVICE_ACCOUNT_KEY=<base64-encoded-json>

# Optional
SENTRY_DSN=<sentry-dsn>
```

### Mobile App (via Expo)

```env
EXPO_PUBLIC_DOMAIN=https://api.nutriscan.app
```

---

## Estimated Timeline

| Phase               | Items   | Estimated Duration |
| ------------------- | ------- | ------------------ |
| IAP Integration     | 1.1-1.4 | 3-5 days           |
| Store Configuration | 2, 3    | 2-3 days           |
| Server Deployment   | 4, 5    | 1-2 days           |
| Security & Testing  | 6, 7    | 3-5 days           |
| Monitoring & Legal  | 8, 9    | 2-3 days           |
| Marketing Assets    | 10      | 2-3 days           |
| **Total**           |         | **2-3 weeks**      |

Note: Many tasks can be parallelized. The timeline assumes sequential work by one developer.

---

## Resources

- [expo-iap Documentation](https://hyochan.github.io/expo-iap)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Store Policy Center](https://play.google.com/console/about/policies/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
