# Smart Ads

## Purpose

- Smart Ads lets a business prepare Meta/Facebook ad campaigns from uploaded creatives, uploaded videos, Marketing Studio designs, or existing inventory item images.
- The current frontend/demo version supports dashboard, 5-step ad creation, real Meta OAuth, real asset discovery, and real paused Meta image/video object publishing.
- Real analytics, durable database persistence, and final production delivery verification are later production work.

## Current User Flow

Smart Ads Dashboard -> Connect Meta -> Meta OAuth -> Fetch Business/Page/Instagram/Ad Account assets -> Select assets -> Create Ad -> Ad Details -> Creative -> Audience -> Budget & Schedule -> Review -> Save Draft / Create Campaign -> Campaign Dashboard.

## Frontend Status

- Dashboard, campaign metrics, status filters, campaign cards, draft reopen/edit, and local campaign records are implemented.
- The 5-step builder supports Ad Details, Creative, Audience, Budget & Schedule, and Review.
- Creative supports Image and Video types inside the existing Step 02 flow.
- Image supports Upload Creative, Marketing Studio templates/session designs, and existing Item Image selection.
- Video currently supports Upload Video only, with MP4/MOV selection, file-size validation, metadata display, and HTML video preview.
- Video preview uses a centered contain frame with a neutral black background so portrait/landscape videos are not cropped or stretched.
- Video drafts store file metadata only; users must re-select the raw video file before publishing after refresh/reopen.
- Selected item image/name/category/price/unit stay synchronized from the shared inventory item source.
- Audience prototype supports location, Pan India, gender, age, interests, and validation.
- Budget/duration calculation, schedule fields, review summary, publish validation, and detailed publish errors are implemented.
- Metrics and campaign analytics are still local/demo, not Meta Insights.

## Backend / Meta Integration Status

- Express Meta OAuth is implemented with backend-only App Secret use, OAuth state validation, code exchange, long-lived token exchange, `/me`, and permissions fetch.
- Asset discovery fetches Business Portfolios, Facebook Pages, Ad Accounts, and optional linked Instagram professional accounts.
- Selected Business/Page/Instagram/Ad Account are stored in temporary server memory for this phase.
- Meta tokens are stored backend-only in memory; the frontend receives only public-safe connection and asset data.
- Production Vercel frontend and Render backend are supported through environment-driven URLs and CORS configuration.

## Real Publishing Flow

- `POST /api/meta/ads/publish` uses the selected real Facebook Page and real Ad Account.
- Campaign is created in `PAUSED` state with `special_ad_categories: []` and `is_adset_budget_sharing_enabled: false`.
- Daily budget remains on the Ad Set, which is also created in `PAUSED` state.
- Image upload uses the real Meta Ad Images endpoint and returns a real image hash.
- Video upload uses the real Meta Ad Videos endpoint and returns a real Meta video ID.
- Video processing is checked before creative creation; if Meta is still processing, the partial publish record keeps the real video ID and fails clearly.
- Meta video creative requires a thumbnail reference, so the backend fetches the uploaded video's real `picture`/thumbnail URL, downloads that image, uploads it to the Ad Account `/adimages` endpoint, and sends the returned `video_data.image_hash`.
- Image creatives use `link_data.image_hash`; video creatives use `video_data.video_id` plus a real thumbnail `video_data.image_hash`.
- Retry after a partial video publish can reuse the stored real Meta video ID instead of uploading the same video again.
- Creative is created with Page identity, optional Instagram actor, destination URL, text, and CTA.
- Final Ad is created in `PAUSED` state; no fake IDs or demo success fallback are used.
- Failed Meta steps return safe error details including step, code, subcode, user message, and fbtrace ID where provided.
- Video creative diagnostics log only safe details such as video ID, thumbnail source, thumbnail host, and outgoing payload keys; tokens and signed URL query strings are not logged.

## Live Test Status

- Production frontend, production backend, published Meta app, OAuth login, real connection, and real asset fetch are verified.
- Real Campaign creation has been verified and returned a real Meta Campaign ID.
- Previous blockers fixed: campaign budget-sharing requirement and stale/today 1-day schedule handling.
- Current external blocker: the selected Meta test Ad Account requires a valid Meta payment method.
- Final live image/video Ad delivery is not verified yet; all Meta objects intentionally remain `PAUSED`.

## Current Architecture

- Frontend page: `src/pages/BusinessGrowth/SmartAds/SmartAds.jsx`.
- Frontend Meta API client: `src/services/smartAdsMetaService.js`.
- Frontend draft/campaign storage: `src/services/smartAdsStorage.js` using `localStorage`.
- Backend routes: `server/src/routes/metaAuth.js`, `server/src/routes/metaBusiness.js`, `server/src/routes/metaAds.js`.
- Backend services: `server/src/services/metaOAuthService.js`, `metaAssetsService.js`, `metaAdsService.js`, `metaConnectionStore.js`.
- Config: `server/src/config/metaOAuth.js`, `server/.env.example`, production environment variables.

## PostgreSQL Plan

- `users`: app users/operators; relates to businesses and campaign ownership.
- `businesses`: tenant/business profile; owns Meta connections, assets, and campaigns.
- `meta_connections`: encrypted Meta token, Meta user ID, permissions, status, expiry, reconnect/error state.
- `meta_business_assets`: discovered businesses, Pages, Instagram accounts, and Ad Accounts with selected flags.
- `smart_ad_campaigns`: local campaign record, Meta Campaign ID, objective, status, publish state, failure details.
- `smart_ad_adsets`: Meta Ad Set ID, budget, currency, schedule, targeting snapshot, Meta status.
- `smart_ad_creatives`: image source/hash, text, CTA, URL, Page/Instagram identity, Meta Creative ID.
- `smart_ads`: final Meta Ad ID, linked campaign/adset/creative, status, publish error state.
- `smart_ad_targeting`: normalized locations, age, gender, interest IDs/raw labels.
- `smart_ad_insights`: synced spend, reach, impressions, clicks, CTR, CPC, CPM, results by date.

## Production Pending

- Add PostgreSQL persistence, encrypted token storage, tenant isolation, and durable campaign/asset records.
- Add real Meta Insights sync, campaign status refresh, retry/cleanup for partial publishes, and audit logs.
- Add production-grade location/interest targeting search using Meta targeting IDs.
- Complete final live image and video publish verification with a payment-enabled production Ad Account; confirm Meta accepts generated video thumbnail image hashes end-to-end.
- Confirm required Meta permissions/access tiers for external client use after App Review.
- Add deletion/revocation tooling backed by the future database.

## Security Status

- Done: App Secret stays backend-only, tokens are not exposed to frontend, OAuth state is validated, public status omits tokens, and errors are token-safe.
- Done: frontend uses backend API routes for Meta work; no Meta secret is stored in Vite/client code.
- Partial: CORS is environment-driven but still supports local development origins.
- Pending: encrypted PostgreSQL token storage, auth/tenant boundaries, audit logging, token lifecycle jobs, and production deletion workflow.

## Manager Explanation

Smart Ads is now beyond a static demo: it can connect to Meta, fetch real business assets, and start the real paused ad publishing flow. The current app is blocked externally by a Meta test Ad Account payment-method requirement before final Ad delivery can be verified. We still need PostgreSQL, encrypted token storage, real Insights, status sync, and production account validation before calling it fully production-ready.
