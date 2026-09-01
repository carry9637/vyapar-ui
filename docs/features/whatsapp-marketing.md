# WhatsApp Marketing

## Purpose

WhatsApp Marketing combines poster creatives with an official WhatsApp Business connection foundation.
The current product UX is connection-first: campaigns unlock only after the backend confirms WABA, phone number, and approved templates.
Real bulk sending still needs SQL persistence and a queue worker.

## Current User Flow

Open WhatsApp Marketing -> backend status check.
If unavailable: show retry-only connection error.
If not connected: show onboarding only with `Continue with Meta`, which starts Meta WhatsApp Embedded Signup when configured.
If connected but incomplete: show setup incomplete and keep campaign builder locked.
If ready: show compact connected bar -> Creative -> Recipients -> Message -> Preview -> Send.
Ready means connected WABA + business phone + approved templates loaded; choosing a specific template happens in the Message step.

## Files Involved

- `src/pages/BusinessGrowth/WhatsAppMarketing.jsx`: poster gallery, connection-first gating, campaign wizard, developer/test tools.
- `src/services/whatsappBusinessService.js`: frontend client for status, OAuth start, assets, selection, disconnect, and test send.
- `server/src/routes/whatsappAuth.js`: WhatsApp OAuth start/callback/status/disconnect and test env connect.
- `server/src/routes/whatsappBusiness.js`: asset/template loading, selection save, and one real test send.
- `server/src/routes/whatsappWebhook.js`: production webhook verification and event receiver foundation.
- `server/src/services/whatsappBusinessService.js`: Graph API WABA/phone/template fetch and `/messages` send.
- `server/src/services/whatsappConnectionStore.js`: temporary in-memory connection/selection/readiness interface.
- `server/src/services/whatsappTestModeService.js`: rebuilds test connection from backend env without exposing tokens.

## APIs

- `GET /api/auth/whatsapp/status`: returns connection, assets, selection, readiness, and test-mode availability without auto-connecting test assets.
- `GET /api/auth/whatsapp`: legacy redirect OAuth fallback using backend config.
- `POST /api/auth/whatsapp/embedded-signup`: exchanges Embedded Signup code, stores the server-side token, and hydrates WABA/phone/template assets.
- `POST /api/auth/whatsapp/test-connect`: explicitly rebuilds backend test setup and returns safe stage diagnostics on failure.
- `GET /api/whatsapp-business/assets`: refreshes real WABA, phone, and template lists.
- `POST /api/whatsapp-business/selection`: saves selected WABA, phone number, and approved template in temporary store.
- `POST /api/whatsapp-business/send-test`: sends one opted-in approved-template message via Cloud API.
- `GET/POST /api/whatsapp/webhook`: webhook verification and future status event intake.

## Test vs Production Connection

`Continue with Meta` now uses the Facebook JS SDK Embedded Signup flow when `WHATSAPP_LOGIN_CONFIG_ID` is configured, then completes via the backend.
Production still needs correct Meta Dashboard Embedded Signup configuration, approved permissions, production phone setup, and durable tenant storage.
Developer/Test Tools are behind `Manage Connection` and keep Meta Test Setup plus Single Real Test Send.
Normal customers are not automatically connected to `WHATSAPP_TEST_*` assets.
Test setup validates config, WABA, phone, and approved templates before returning `TEST_READY`.

## What Works

Poster personalization, download, browser share, and manual `wa.me` fallback remain preserved.
Backend-only Graph API calls can fetch real test WABA assets/templates and send one approved-template test message.
Campaign builder UI uses selected creative, recipient state, friendly template choices, variables, and preview, but bulk send is blocked.

## Pending

Production business phone rollout, PostgreSQL storage, contacts/consent, media upload for poster templates, queue-based bulk sending, retries/idempotency, webhook status persistence, analytics, and tenant isolation.

## Manager Summary

User pehle WhatsApp Business connect karega, tabhi campaign tools unlock honge.
Connected business phone aur approved templates backend se confirm hone ke baad hi campaign builder dikhega.
Test setup ab normal customer screen par nahi hai; Manage Connection ke andar Developer/Test Tools me hai.
Abhi one real approved-template test send possible hai, bulk campaign sending next backend phase hai.
