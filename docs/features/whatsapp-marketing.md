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

- `server/src/config/whatsappOAuth.js`: WhatsApp OAuth scopes/config.
- `server/src/services/whatsappOAuthService.js`: WhatsApp OAuth state, callback token exchange, JSON Graph POST.
- `server/src/services/whatsappConnectionStore.js`: temporary in-memory WhatsApp connection/readiness state.
- `server/src/services/whatsappBusinessService.js`: real WABA, phone number, template fetch, and template test send.
- `server/src/routes/whatsappAuth.js`: connect/callback/status/disconnect routes.
- `server/src/routes/whatsappBusiness.js`: asset selection and one-recipient test send routes.
- `server/src/routes/whatsappWebhook.js`: webhook verification and event receiver foundation.
- `src/services/whatsappBusinessService.js`: frontend API client.

## Files Changed

- `src/pages/BusinessGrowth/WhatsAppMarketing.jsx`: added WhatsApp Business panel; poster UI preserved.
- `server/src/index.js`: mounted WhatsApp auth/business/webhook routes.
- `server/.env.example`: added WhatsApp OAuth/webhook env placeholders.

## Real Flow

Connect WhatsApp Business -> Meta OAuth -> fetch businesses/WABAs -> select WABA -> fetch phone numbers/templates -> select phone number and approved template -> confirm opted-in test recipient -> send one real template message through `/{phone-number-id}/messages`.

## Environment / Meta Setup

Required server env: `META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_API_VERSION`, `WHATSAPP_REDIRECT_URI`, optional `WHATSAPP_LOGIN_CONFIG_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
Meta app must request `business_management`, `whatsapp_business_management`, and `whatsapp_business_messaging`.
Configure callback URL `/api/auth/whatsapp/callback` and webhook URL `/api/whatsapp/webhook` in Meta Dashboard.

## Security Notes

Temporary connection/token storage is in server memory only and is not final production persistence.
PostgreSQL later must store encrypted tokens, WABAs, phone numbers, contacts/consent, templates, campaigns, recipients, message IDs, webhook events, retries, and audit logs.
Webhook delivery/read analytics are not processed yet.

## Phase 2+

Add SQL persistence, contact import/selection, consent/opt-out records, template creation/submission, queued bulk sending, retries, message status webhooks, analytics, and tenant isolation.

## Manager Summary

The existing poster creator remains intact.
The new panel starts the real WhatsApp Cloud API path without fake WABAs or phone IDs.
Phase 1 is ready for Meta configuration and one opted-in approved-template test message.
Bulk marketing is intentionally not implemented yet.
