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

export async function getWhatsAppConnectionStatus() {
  const response = await fetch(`${API_BASE_URL}/api/auth/whatsapp/status`);
  return readJsonResponse(response, "Unable to load WhatsApp Business connection status.");
}

export function startWhatsAppConnection() {
  window.location.assign(`${API_BASE_URL}/api/auth/whatsapp`);
}

export async function getWhatsAppAssets({ businessId, wabaId } = {}) {
  const url = new URL(`${API_BASE_URL}/api/whatsapp-business/assets`);
  if (businessId) url.searchParams.set("businessId", businessId);
  if (wabaId) url.searchParams.set("wabaId", wabaId);
  const response = await fetch(url.toString());
  return readJsonResponse(response, "Unable to load WhatsApp Business assets.");
}

export async function saveWhatsAppSelection(selection) {
  const response = await fetch(`${API_BASE_URL}/api/whatsapp-business/selection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection),
  });
  return readJsonResponse(response, "Unable to save WhatsApp Business selection.");
}

export async function disconnectWhatsAppBusiness() {
  const response = await fetch(`${API_BASE_URL}/api/auth/whatsapp/disconnect`, {
    method: "POST",
  });
  return readJsonResponse(response, "Unable to disconnect WhatsApp Business.");
}

export async function sendWhatsAppTestMessage(payload) {
  const response = await fetch(`${API_BASE_URL}/api/whatsapp-business/send-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJsonResponse(response, "Unable to send WhatsApp test message.");
}
