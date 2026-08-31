# WhatsApp Marketing

## Purpose

WhatsApp Marketing now has two clear areas: poster creatives and official WhatsApp Business test messaging.
The poster gallery still supports local personalization, PNG download, browser share, and manual `wa.me` sharing.
Phase 1 adds real Meta WhatsApp Business Platform foundation for one approved-template test send only.

## Current Architecture

Frontend: `WhatsAppMarketing.jsx` -> `src/services/whatsappBusinessService.js`.
Backend: `/api/auth/whatsapp`, `/api/whatsapp-business/*`, `/api/whatsapp/webhook`.
Graph API calls stay backend-only; tokens and App Secret are never exposed to Vite.

## Files Created

- `server/src/config/whatsappOAuth.js`: WhatsApp OAuth and backend test-mode config.
- `server/src/services/whatsappOAuthService.js`: WhatsApp OAuth state, callback token exchange, JSON Graph POST.
- `server/src/services/whatsappConnectionStore.js`: temporary in-memory connection, source, selection, readiness state.
- `server/src/services/whatsappBusinessService.js`: real WABA, phone number, template fetch, and template test send.
- `server/src/routes/whatsappAuth.js`: OAuth connect/callback/status/disconnect plus test env connect.
- `server/src/routes/whatsappBusiness.js`: asset selection and one-recipient test send routes.
- `server/src/routes/whatsappWebhook.js`: webhook verification and event receiver foundation.
- `src/services/whatsappBusinessService.js`: frontend API client.

## Files Changed

- `src/pages/BusinessGrowth/WhatsAppMarketing.jsx`: added WhatsApp Business panel; poster UI preserved.
- `server/src/index.js`: mounted WhatsApp auth/business/webhook routes.
- `server/.env.example`: added WhatsApp OAuth/webhook env placeholders.

## Real Flow

Connect WhatsApp Business -> Meta OAuth -> fetch businesses/WABAs -> select WABA -> fetch phone numbers/templates -> select phone number and approved template -> confirm opted-in test recipient -> send one real template message through `/{phone-number-id}/messages`.

Current testing can also use backend env test mode: load configured test WABA/phone IDs -> fetch real templates -> select approved template -> send one opted-in test message.

## Environment / Meta Setup

OAuth env: `META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_API_VERSION`, `WHATSAPP_REDIRECT_URI`, optional `WHATSAPP_LOGIN_CONFIG_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
Test-mode env: `WHATSAPP_TEST_ACCESS_TOKEN`, `WHATSAPP_TEST_WABA_ID`, `WHATSAPP_TEST_PHONE_NUMBER_ID`, optional `WHATSAPP_TEST_BUSINESS_ID`, `WHATSAPP_TEST_BUSINESS_NAME`.
Meta app must request `business_management`, `whatsapp_business_management`, and `whatsapp_business_messaging`.
Configure callback URL `/api/auth/whatsapp/callback` and webhook URL `/api/whatsapp/webhook` in Meta Dashboard.

## Security Notes

Temporary connection/token storage is in server memory only and is not final production persistence.
PostgreSQL later must store encrypted tokens, WABAs, phone numbers, contacts/consent, templates, campaigns, recipients, message IDs, webhook events, retries, and audit logs.
Webhook delivery/read analytics are not processed yet.
Backend test mode uses Meta dashboard test credentials only; it is not client onboarding.

## Phase 2+

Add Embedded Signup/client OAuth, SQL persistence, real production phone numbers, contact import/selection, consent/opt-out records, template creation/submission, queued bulk sending, retries, message status webhooks, analytics, and tenant isolation.

## Manager Summary

The existing poster creator remains intact.
The new panel can use backend test credentials to send one real approved-template message through WhatsApp Cloud API.
OAuth remains prepared for later client onboarding but is not required for current Meta test-number development.
Bulk marketing is intentionally not implemented yet.
