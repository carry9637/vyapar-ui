import { graphGet, graphPost, normalizeMetaError } from "./metaOAuthService.js";

const SAFE_STATUS = "PAUSED";
const ZERO_DECIMAL_CURRENCIES = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);

function createPublishError(message, code = "META_PUBLISH_ERROR", publishResult = null) {
  const error = new Error(message);
  error.code = code;
  if (publishResult) error.publishResult = publishResult;
  return error;
}

function safeMetaError(error, fallback, step = "") {
  const normalized = normalizeMetaError(error, fallback);
  return {
    step,
    message: normalized.message,
    type: normalized.type,
    code: normalized.code,
    subcode: normalized.subcode,
    userTitle: normalized.userTitle,
    userMessage: normalized.userMessage,
    fbtraceId: normalized.fbtraceId,
    httpStatus: normalized.httpStatus,
  };
}

function adAccountPath(adAccountId = "") {
  const id = String(adAccountId || "").trim();
  if (!id) throw createPublishError("Select a real Meta Ad Account before publishing.", "META_AD_ACCOUNT_REQUIRED");
  return id.startsWith("act_") ? id : `act_${id}`;
}

function asPositiveNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw createPublishError(`${label} must be greater than zero.`, "META_VALIDATION_ERROR");
  return parsed;
}

function dailyBudgetToMinorUnits(value, currency = "INR") {
  const amount = asPositiveNumber(value, "Daily budget");
  return Math.max(1, Math.round(amount * (ZERO_DECIMAL_CURRENCIES.has(String(currency).toUpperCase()) ? 1 : 100)));
}

function metaDateTime(dateValue = "", endOfDay = false) {
  if (!dateValue) throw createPublishError("Start and end dates are required before publishing.", "META_DATE_REQUIRED");
  return `${dateValue}T${endOfDay ? "23:59:59" : "00:00:00"}+0000`;
}

function normalizeUrl(value = "") {
  const url = String(value || "").trim();
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    if (parsed.hostname.replace(/^www\./, "") === "yourbusiness.com") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function metaObjective(goal) {
  if (goal === "reach") return "OUTCOME_AWARENESS";
  return "OUTCOME_TRAFFIC";
}

function metaOptimizationGoal(goal) {
  if (goal === "reach") return "REACH";
  return "LINK_CLICKS";
}

function metaCtaType(cta = "") {
  const normalized = String(cta).toLowerCase();
  if (normalized.includes("shop")) return "SHOP_NOW";
  if (normalized.includes("learn")) return "LEARN_MORE";
  return "CONTACT_US";
}

function genderTargeting(gender = "All") {
  if (gender === "Male") return [1];
  if (gender === "Female") return [2];
  return undefined;
}

async function resolveGeoLocations(accessToken, campaign = {}) {
  if (campaign.audience?.panIndia) return { countries: ["IN"] };

  const locations = Array.isArray(campaign.audience?.locations) ? campaign.audience.locations.filter(Boolean) : [];
  if (!locations.length) {
    throw createPublishError("Add at least one target location or select Pan India before publishing.", "META_LOCATION_REQUIRED");
  }

  const matches = await Promise.all(
    locations.map(async (location) => {
      const payload = await graphGet("/search", accessToken, {
        type: "adgeolocation",
        location_types: JSON.stringify(["city", "region"]),
        q: location,
        country_code: "IN",
        limit: 5,
      });
      return (payload.data || [])[0] || null;
    }),
  );

  const cities = [];
  const regions = [];
  matches.forEach((match) => {
    if (!match?.key) return;
    if (match.type === "region") regions.push({ key: match.key });
    else cities.push({ key: match.key });
  });

  if (!cities.length && !regions.length) {
    throw createPublishError("Meta could not match the selected target location. Use Pan India or a valid city/region.", "META_LOCATION_NOT_FOUND");
  }

  return {
    ...(cities.length ? { cities } : {}),
    ...(regions.length ? { regions } : {}),
  };
}

function imageFromDataUrl(dataUrl = "") {
  const match = String(dataUrl).match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);
  if (!match) {
    throw createPublishError("A publishable PNG, JPG, or WEBP creative image is required.", "META_CREATIVE_IMAGE_REQUIRED");
  }

  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function uploadAdImage(accessToken, adAccountId, creative = {}) {
  const accountPath = adAccountPath(adAccountId);
  const { buffer } = imageFromDataUrl(creative.imageDataUrl);
  const payload = await graphPost(`/${accountPath}/adimages`, accessToken, {
    bytes: buffer.toString("base64"),
  });

  const imageRecord = Object.values(payload.images || {})[0];
  if (!imageRecord?.hash) throw createPublishError("Meta image upload succeeded but did not return an image hash.", "META_IMAGE_HASH_MISSING");
  return imageRecord.hash;
}

function buildTargeting({ campaign, geoLocations }) {
  const minAge = Math.max(Number(campaign.audience?.minAge) || 18, 13);
  const maxAge = Math.min(Number(campaign.audience?.maxAge) || 65, 65);
  if (minAge >= maxAge) throw createPublishError("Minimum age must be less than maximum age.", "META_AGE_INVALID");

  return {
    age_min: minAge,
    age_max: maxAge,
    geo_locations: geoLocations,
    ...(genderTargeting(campaign.audience?.gender) ? { genders: genderTargeting(campaign.audience?.gender) } : {}),
  };
}

async function createCampaign({ accessToken, adAccountId, campaign }) {
  return graphPost(`/${adAccountPath(adAccountId)}/campaigns`, accessToken, {
    name: campaign.name,
    objective: metaObjective(campaign.objective),
    is_adset_budget_sharing_enabled: false,
    status: SAFE_STATUS,
    special_ad_categories: [],
  });
}

async function createAdSet({ adAccountId, accessToken, campaign, metaCampaignId, adAccount, geoLocations }) {
  const targeting = buildTargeting({ campaign, geoLocations });

  return graphPost(`/${adAccountPath(adAccountId)}/adsets`, accessToken, {
    name: `${campaign.name} Ad Set`,
    campaign_id: metaCampaignId,
    daily_budget: dailyBudgetToMinorUnits(campaign.budget?.dailyBudget, adAccount?.currency),
    billing_event: "IMPRESSIONS",
    optimization_goal: metaOptimizationGoal(campaign.objective),
    ...(campaign.objective === "reach" ? {} : { destination_type: "WEBSITE" }),
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    targeting,
    start_time: metaDateTime(campaign.budget?.startDate),
    end_time: metaDateTime(campaign.budget?.endDate, true),
    status: SAFE_STATUS,
  });
}

async function createAdCreative({ accessToken, adAccountId, campaign, pageId, instagramAccountId, imageHash, link }) {
  const objectStorySpec = {
    page_id: pageId,
    ...(instagramAccountId ? { instagram_actor_id: instagramAccountId } : {}),
    link_data: {
      image_hash: imageHash,
      link,
      name: campaign.ad?.headline || campaign.name,
      message: campaign.ad?.caption || campaign.ad?.headline || campaign.name,
      call_to_action: {
        type: metaCtaType(campaign.ad?.cta),
        value: { link },
      },
    },
  };

  return graphPost(`/${adAccountPath(adAccountId)}/adcreatives`, accessToken, {
    name: `${campaign.name} Creative`,
    object_story_spec: objectStorySpec,
  });
}

async function createAd({ accessToken, adAccountId, campaign, metaAdSetId, metaCreativeId }) {
  return graphPost(`/${adAccountPath(adAccountId)}/ads`, accessToken, {
    name: `${campaign.name} Ad`,
    adset_id: metaAdSetId,
    creative: { creative_id: metaCreativeId },
    status: SAFE_STATUS,
  });
}

async function runPublishStep(result, step, action) {
  try {
    const payload = await action();
    result.steps.push({ step, status: "success", id: payload.id || payload.hash || "" });
    return payload;
  } catch (error) {
    const normalized = error.metaError || safeMetaError(error, `${step} failed`, step);
    result.failedStep = step;
    result.error = normalized;
    result.steps.push({ ...normalized, step, status: "failed" });
    throw createPublishError(normalized.message, normalized.code, result);
  }
}

export async function publishMetaAdCampaign({ accessToken, connection, campaign }) {
  const selection = connection.selection || {};
  const assets = connection.assets || {};
  const selectedAdAccount = (assets.adAccounts || []).find((account) => account.id === selection.adAccountId);
  const selectedPage = (assets.pages || []).find((page) => page.id === selection.pageId);
  const destinationUrl = normalizeUrl(campaign.ad?.website);
  const result = {
    status: "failed",
    safeStatus: SAFE_STATUS,
    ids: {
      metaCampaignId: null,
      metaAdSetId: null,
      metaImageHash: null,
      metaCreativeId: null,
      metaAdId: null,
    },
    steps: [],
    warnings: [],
  };

  if (!accessToken) throw createPublishError("Meta is not connected. Reconnect before publishing.", "META_NOT_CONNECTED");
  if (!selectedPage?.id) throw createPublishError("Select a real Facebook Page before publishing.", "META_PAGE_REQUIRED");
  if (!selectedAdAccount?.id) throw createPublishError("Select a real Meta Ad Account before publishing.", "META_AD_ACCOUNT_REQUIRED");
  if (!destinationUrl) throw createPublishError("Enter a real public HTTP/HTTPS website URL before publishing. WhatsApp destination publishing is not enabled yet.", "META_DESTINATION_REQUIRED");
  if (campaign.audience?.interests?.length) {
    result.warnings.push("Custom interest names were not sent to Meta because targeting IDs are required.");
  }

  const geoLocations = await resolveGeoLocations(accessToken, campaign);

  const metaCampaign = await runPublishStep(result, "campaign", () =>
    createCampaign({ accessToken, adAccountId: selectedAdAccount.id, campaign }),
  );
  result.ids.metaCampaignId = metaCampaign.id;

  const metaAdSet = await runPublishStep(result, "adSet", () =>
    createAdSet({ accessToken, adAccountId: selectedAdAccount.id, campaign, metaCampaignId: metaCampaign.id, adAccount: selectedAdAccount, geoLocations }),
  );
  result.ids.metaAdSetId = metaAdSet.id;

  const imageHash = await runPublishStep(result, "imageUpload", async () => {
    const hash = await uploadAdImage(accessToken, selectedAdAccount.id, campaign.creative);
    return { hash };
  });
  result.ids.metaImageHash = imageHash.hash;

  const metaCreative = await runPublishStep(result, "creative", () =>
    createAdCreative({
      accessToken,
      adAccountId: selectedAdAccount.id,
      campaign,
      pageId: selectedPage.id,
      instagramAccountId: selection.instagramAccountId,
      imageHash: imageHash.hash,
      link: destinationUrl,
    }),
  );
  result.ids.metaCreativeId = metaCreative.id;

  const metaAd = await runPublishStep(result, "ad", () =>
    createAd({ accessToken, adAccountId: selectedAdAccount.id, campaign, metaAdSetId: metaAdSet.id, metaCreativeId: metaCreative.id }),
  );
  result.ids.metaAdId = metaAd.id;
  result.status = "published";

  return result;
}
