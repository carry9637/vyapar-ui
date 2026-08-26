# Smart Ads

## Purpose

- Smart Ads is the Business Growth area for planning promotional ad campaigns.
- The current version supports real Meta OAuth connection, asset selection, real paused Meta publishing, and local campaign records.
- It discovers Business Portfolios, Facebook Pages, optional linked Instagram accounts, and Ad Accounts after login.
- Real analytics, database storage, and payments are still future work.

## Current Flow

Smart Ads Dashboard
-> Connect Meta
-> Meta OAuth
-> Backend token
-> Fetch Meta assets
-> Select Business Portfolio
-> Refresh Pages / Ad Accounts / optional Instagram for that selection
-> Select Page / Instagram / Ad Account
-> Create Ad
-> Ad Details
-> Creative
-> Audience
-> Budget & Schedule
-> Review
-> Save Draft / Create Campaign
-> Backend publishes Campaign / Ad Set / Creative / Ad as paused Meta objects
-> Campaign Dashboard

## Files Created

- `src/pages/BusinessGrowth/SmartAds/SmartAds.jsx`
  - Created for the Smart Ads dashboard and 5-step builder.
  - Handles campaign UI, creative selection, preview, validation, draft reopen/edit, and demo Meta messaging.

- `src/services/smartAdsStorage.js`
  - Created as the Smart Ads persistence boundary.
  - Handles local campaign normalization, save/load, analytics defaults, and null Meta IDs.

- `src/services/smartAdsMetaService.js`
  - Created as the frontend Meta API client.
  - Starts OAuth, loads connection/assets, saves selected assets, disconnects, and calls real publish.

- `server/src/config/metaOAuth.js`
  - Created for backend-only Meta env configuration.
  - Reads App ID, App Secret, redirect URI, Graph version, and optional Login config ID.

- `server/src/routes/metaAuth.js`
  - Created for Meta OAuth routes.
  - Handles auth start, callback, status, and disconnect with OAuth state validation.

- `server/src/routes/metaBusiness.js`
  - Created for Meta asset APIs.
  - Validates tokens, returns refreshed/scoped assets, and saves temporary asset selection.

- `server/src/routes/metaAds.js`
  - Created for Meta ad publishing.
  - Exposes `POST /api/meta/ads/publish` for the real paused publish flow.

- `server/src/services/metaOAuthService.js`
  - Created for Meta OAuth and Graph helpers.
  - Builds auth URL, exchanges code/token, reads `/me`, reads permissions, and posts Graph calls.

- `server/src/services/metaAssetsService.js`
  - Created for Meta asset discovery.
  - Fetches and normalizes businesses, user/business Pages, optional Instagram links, and ad accounts.

- `server/src/services/metaAdsService.js`
  - Created for Meta Marketing API publishing.
  - Creates Campaign, Ad Set, image upload, Ad Creative, and final Ad in `PAUSED` state.

- `server/src/services/metaConnectionStore.js`
  - Created for temporary in-memory Meta connection state.
  - Keeps backend-only tokens and exposes public-safe status/assets/selection/reconnect state.

- `docs/features/smart-ads.md`
  - Created as the single Smart Ads feature note.
  - Tracks current behavior, reused systems, changed files, storage, and pending work.

## Files Changed

- `src/App.jsx`
  - Added the `/business-growth/smart-ads` route.
  - Needed so the existing Sidebar entry opens the Smart Ads page through `MainLayout` and `Outlet`.

- `server/src/index.js`
  - Mounted Meta auth, asset, and ads publish routes; raised JSON body limit for creative uploads.
  - Needed so Express can start OAuth, serve assets, and publish real paused Meta ads.

- `server/.env.example`
  - Added Meta env placeholders only.
  - Needed for local setup without committing credentials.

- `src/services/marketingStudio/sessionDesignService.js`
  - Added `getSessionDesigns()`.
  - Needed so Smart Ads can reuse saved Marketing Studio session designs without duplicating storage logic.

## What Is Working

- Smart Ads dashboard with campaign metrics and status filters.
- Connect Meta starts real backend OAuth when Meta env config is present.
- OAuth callback exchanges the code server-side and stores tokens backend-only in memory.
- Meta status, disconnect, asset refresh, and temporary asset selection APIs work.
- Refresh Meta validates the token and re-fetches user, permissions, businesses, Pages, Ad Accounts, and optional Instagram links.
- Business Portfolio selection reloads dependent assets and clears stale Page/Instagram/Ad Account selections.
- Page discovery uses real user Pages plus business owned/client Pages, with dedupe and safe empty/error states.
- Ad Account discovery uses real user Ad Accounts plus business owned/client Ad Accounts, with dedupe and safe empty/error states.
- Instagram discovery is optional and does not require `instagram_basic` in the current OAuth scope set.
- Connected UI can select Business Portfolio, Facebook Page, linked Instagram account, and Ad Account.
- Missing config, expired/revoked token, backend errors, no Page, no Instagram, and no Ad Account states are handled.
- 5-step Create Ad flow: Ad Details, Creative, Audience, Budget & Schedule, Review.
- Inventory item/service reuse for product/service campaigns.
- Upload Creative image selection.
- Marketing Studio template and saved session design creative selection.
- Item Image creative selection from existing inventory images.
- Selected item image/name/category/price/unit stay synchronized from `selectedItemId`.
- No random inventory item is selected when the Creative step opens.
- Inventory image cards use fixed media frames, preserved image ratios, and text below images.
- Ad Preview uses a stable media frame, clearer title/meta/caption hierarchy, and source-specific data.
- Creative source switching between Upload, Marketing Studio, and Item Image avoids stale preview mixing.
- Audience prototype supports gender, Pan India/target locations, age validation, and interests.
- Budget calculation uses daily budget multiplied by duration days.
- Schedule supports all-day or custom start/end time.
- Review shows entered campaign, creative, audience, budget, and schedule data.
- Create Campaign on Review publishes real Meta Campaign, Ad Set, image, Creative, and Ad in paused state.
- Selected real Facebook Page and real Ad Account are required before publishing.
- Campaign creation explicitly disables ad-set budget sharing because Smart Ads keeps daily budget on the Ad Set.
- Publish failures now surface the exact failed Meta step plus safe code/subcode/user message/fbtrace details.
- Placeholder website URLs are blocked before Meta object creation.
- Uploaded, item, Marketing Studio, and session design images are converted to publishable image data before backend upload.
- Unsupported custom interest names are omitted from Meta targeting until targeting-search IDs are added.
- Partial publish failures return the completed step IDs and save a failed local campaign record.
- Save Draft persists locally and drafts can be reopened/edited.
- Existing local/demo campaign records remain local/demo.

## Reused Existing Features

- Items/inventory from `itemsStorage.js`.
- Existing pricing helper `calculateInventoryItemPricing`.
- Marketing Studio templates from `templateRegistry.js`.
- Marketing Studio session designs from `sessionDesignService.js`.
- Existing frontend local-storage service pattern.

## Current Storage

Smart Ads campaigns, drafts, real Meta IDs, publish status, and publish errors save in browser `localStorage` through `src/services/smartAdsStorage.js`.
Meta connection state and selected assets are temporary in-memory Express state for this phase.
Assets are always returned from real Meta API responses; no fake Page, Instagram, Business, or Ad Account records are generated.
Real Meta objects are created paused; no Insights are read yet.
There is no real database, payment handling, or live analytics yet.

## Pending

- Real analytics.
- Backend/database integration.
- Persistent encrypted token storage.
