import crypto from "node:crypto";
import { getMetaOAuthConfig, META_AUTH_SCOPES } from "../config/metaOAuth.js";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const oauthStates = new Map();

function cleanupExpiredStates() {
  const now = Date.now();
  for (const [state, value] of oauthStates.entries()) {
    if (value.expiresAt <= now) oauthStates.delete(state);
  }
}

function createState(returnTo = "/business-growth/smart-ads") {
  cleanupExpiredStates();
  const state = crypto.randomBytes(24).toString("hex");
  oauthStates.set(state, {
    returnTo,
    expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
  });
  return state;
}

export function normalizeMetaError(error, fallback = "Meta request failed") {
  const metaMessage = error?.error?.message || error?.message;
  const message = metaMessage || fallback;
  return {
    message,
    code: error?.error?.code || error?.code || "META_ERROR",
    subcode: error?.error?.error_subcode || error?.error_subcode || error?.subcode || "",
    type: error?.error?.type || error?.type || "MetaError",
    userTitle: error?.error?.error_user_title || error?.error_user_title || error?.userTitle || "",
    userMessage: error?.error?.error_user_msg || error?.error_user_msg || error?.userMessage || "",
    fbtraceId: error?.error?.fbtrace_id || error?.fbtrace_id || error?.fbtraceId || "",
    httpStatus: error?.httpStatus || error?.status || "",
  };
}

export function buildMetaAuthorizationUrl(returnTo) {
  const config = getMetaOAuthConfig();
  if (!config.configured) {
    const error = new Error("Meta environment configuration is missing.");
    error.code = "META_CONFIG_MISSING";
    throw error;
  }

  const state = createState(returnTo);
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    state,
    response_type: "code",
    scope: META_AUTH_SCOPES.join(","),
  });

  if (config.loginConfigId) {
    params.set("config_id", config.loginConfigId);
  }

  return `${config.authBaseUrl}?${params.toString()}`;
}

export function validateMetaOAuthState(state) {
  cleanupExpiredStates();
  const savedState = oauthStates.get(state);
  if (!savedState) return null;
  oauthStates.delete(state);
  return savedState;
}

async function readMetaResponse(response, fallback) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const normalized = normalizeMetaError({ ...payload, httpStatus: response.status }, fallback);
    const error = new Error(normalized.message);
    error.code = normalized.code;
    error.subcode = normalized.subcode;
    error.type = normalized.type;
    error.userTitle = normalized.userTitle;
    error.userMessage = normalized.userMessage;
    error.fbtraceId = normalized.fbtraceId;
    error.httpStatus = normalized.httpStatus;
    throw error;
  }
  return payload;
}

export async function graphGet(path, accessToken, params = {}) {
  const config = getMetaOAuthConfig();
  const url = new URL(path.startsWith("http") ? path : `${config.graphBaseUrl}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return readMetaResponse(response, "Meta Graph API request failed");
}

export async function graphPost(path, accessToken, params = {}) {
  const config = getMetaOAuthConfig();
  const url = new URL(path.startsWith("http") ? path : `${config.graphBaseUrl}${path}`);
  const body = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    body.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  });
  body.set("access_token", accessToken);

  const response = await fetch(url, {
    method: "POST",
    body,
  });

  return readMetaResponse(response, "Meta Graph API request failed");
}

export async function exchangeCodeForAccessToken(code) {
  const config = getMetaOAuthConfig();
  const url = new URL(`${config.graphBaseUrl}/oauth/access_token`);
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("code", code);

  const response = await fetch(url);
  return readMetaResponse(response, "Meta authorization code exchange failed");
}

export async function exchangeForLongLivedUserToken(accessToken) {
  const config = getMetaOAuthConfig();
  const url = new URL(`${config.graphBaseUrl}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("fb_exchange_token", accessToken);

  const response = await fetch(url);
  return readMetaResponse(response, "Meta long-lived token exchange failed");
}

export async function getMetaUser(accessToken) {
  return graphGet("/me", accessToken, { fields: "id,name" });
}

export async function getMetaPermissions(accessToken) {
  const payload = await graphGet("/me/permissions", accessToken);
  return (payload.data || []).map((permission) => ({
    permission: permission.permission,
    status: permission.status,
  }));
}
