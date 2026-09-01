# WhatsApp Marketing

## Feature Goal

Business owners can send festival greetings, offers, discounts, announcements, and promotional campaigns to their own customers through WhatsApp.
Example: Business -> Diwali poster -> "20% OFF this weekend" -> select customers -> send WhatsApp campaign.

## Architecture

Frontend React -> Ledgerly Node/Express API -> Meta WhatsApp Cloud API -> Customer WhatsApp.
React must not call Meta directly and must not loop through bulk recipients itself.
Bulk production sending belongs in backend persistence plus a controlled queue/worker.

## Current Development Flow

Ledgerly -> Developer/Test Mode -> Meta Test WABA -> approved template -> one authorized recipient.
Implemented/testing path: `POST /api/whatsapp-business/send-test` -> `sendWhatsAppTemplateMessage()` -> Meta `POST /{phone_number_id}/messages`.
The backend reconstructs test mode from `WHATSAPP_TEST_ACCESS_TOKEN`, `WHATSAPP_TEST_WABA_ID`, and `WHATSAPP_TEST_PHONE_NUMBER_ID`; tokens are never returned to React.

## Production Connection Flow

Ledgerly -> WhatsApp Marketing -> Continue with Meta -> Meta Embedded Signup -> business authenticates -> connects WhatsApp Business Account -> sender business phone is connected/verified.
Backend then discovers WABA + Phone Number ID + approved templates, marks the connection READY, and unlocks the campaign builder.
Production Embedded Signup is currently blocked by Meta/Facebook "Feature unavailable" and Meta verification/review/configuration remains pending.
Do not describe production onboarding as completed yet.

## Where Customer Numbers Will Come From

Meta does not provide the business's customer list.
Customer numbers will belong to the Ledgerly business and should come from Ledgerly customer/contact data.
Planned sources: existing Ledgerly Customers/Parties, Add Customer/Contact, and later CSV/Excel import.
Example: Rahul | 987xxxxxxx, Priya | 982xxxxxxx, Amit | 976xxxxxxx.
These contacts will be stored in the common Ledgerly SQL database later, not inside Meta.

## Planned Campaign Flow

Poster/Creative -> Select Customers -> Message/approved WhatsApp template -> Preview -> Send.
Recipients UI should support search, checkbox selection, Select All, groups/filters, and selected count.
Business owners should select saved customers, not type 100 numbers for every campaign.

## Planned Bulk Backend Flow

User clicks Send Campaign once.
Ledgerly backend creates Campaign -> selected recipients -> message jobs/queue.
A worker sends through Meta WhatsApp Cloud API and stores per-recipient status.
Statuses later move from pending -> sent -> delivered -> read, or failed.
Webhooks will update delivery statuses.
Frontend does not open 100 `wa.me` links and does not call Meta 100 times.

## WhatsApp Template Requirement

Business-initiated promotional campaigns must follow WhatsApp Business Platform rules and use approved templates where required.
Poster/media campaigns will need a suitable approved media/image-header template and real media handling.
Do not implement fake arbitrary bulk free-text sending.

## Implemented API

REAL / CURRENT: `POST /api/whatsapp-business/send-test`
Purpose: send one real approved-template WhatsApp test message to an opted-in or authorized test recipient.
Function chain: `WhatsAppMarketing.jsx` -> `src/services/whatsappBusinessService.js` -> `server/src/routes/whatsappBusiness.js` -> `sendWhatsAppTemplateMessage()` -> Meta `/{phone_number_id}/messages`.

## Future / NOT IMPLEMENTED

[ ] Common PostgreSQL persistence
[ ] Customer/contact database integration
[ ] CSV/Excel customer import
[ ] Campaign persistence
[ ] Campaign recipient table
[ ] Queue/worker
[ ] Bulk sending
[ ] Retry/idempotency
[ ] Consent/opt-out persistence
[ ] Meta message ID persistence
[ ] Webhook delivery/read/failed persistence
[ ] Campaign analytics
[ ] Production Embedded Signup completion

## Manager Explanation

WhatsApp Marketing lets a business send offers, festival greetings, and promotional campaigns to its customers.
Customer numbers will come from Ledgerly's customer/contact database or future CSV/Excel imports, not from Meta.
The business selects customers once and clicks Send Campaign.
The backend will later create controlled message jobs and send them through Meta WhatsApp Cloud API.
Currently we are first validating one real message end-to-end before implementing SQL and bulk campaign infrastructure.
