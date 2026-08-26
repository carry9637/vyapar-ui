const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function readJsonResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || fallbackMessage);
    error.payload = payload;
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function getMetaConnectionStatus() {
  const response = await fetch(`${API_BASE_URL}/api/auth/meta/status`);
  return readJsonResponse(response, "Unable to load Meta connection status.");
}

export function startMetaConnection() {
  window.location.assign(`${API_BASE_URL}/api/auth/meta`);
}

export async function getMetaAssets({ businessId } = {}) {
  const url = new URL(`${API_BASE_URL}/api/meta-business/assets`);
  if (businessId) url.searchParams.set("businessId", businessId);
  const response = await fetch(url.toString());
  return readJsonResponse(response, "Unable to load Meta assets.");
}

export async function saveMetaAssetSelection(selection) {
  const response = await fetch(`${API_BASE_URL}/api/meta-business/selection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection),
  });
  return readJsonResponse(response, "Unable to save Meta asset selection.");
}

export async function disconnectMeta() {
  const response = await fetch(`${API_BASE_URL}/api/auth/meta/disconnect`, {
    method: "POST",
  });
  return readJsonResponse(response, "Unable to disconnect Meta.");
}

export async function publishMetaCampaign(campaign) {
  const response = await fetch(`${API_BASE_URL}/api/meta/ads/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaign }),
  });
  return readJsonResponse(response, "Unable to publish Meta campaign.");
}
