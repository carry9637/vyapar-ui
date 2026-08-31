import { Router } from "express";
import { getWhatsAppOAuthConfig } from "../config/whatsappOAuth.js";
import {
  extractTemplateVariables,
  fetchWhatsAppAssets,
  normalizeRecipient,
  normalizeWhatsAppError,
  sendWhatsAppTemplateMessage,
} from "../services/whatsappBusinessService.js";
import {
  buildWhatsAppReadiness,
  getWhatsAppConnection,
  getWhatsAppPublicConnection,
  markWhatsAppReconnectRequired,
  saveWhatsAppSelection,
  saveWhatsAppTestResult,
  updateWhatsAppConnectionSnapshot,
} from "../services/whatsappConnectionStore.js";
import { getMetaPermissions, getMetaUser } from "../services/metaOAuthService.js";

const router = Router();

function validateSelection(selection = {}, assets = {}) {
  const businesses = new Set((assets.businesses || []).map((item) => item.id));
  const wabas = new Set((assets.wabas || []).map((item) => item.id));
  const phoneNumbers = new Set((assets.phoneNumbers || []).map((item) => item.id));
  const templates = new Set((assets.templates || []).map((item) => item.id));

  if (selection.businessId && !businesses.has(selection.businessId)) return "Selected Business Portfolio was not found.";
  if (selection.wabaId && !wabas.has(selection.wabaId)) return "Selected WhatsApp Business Account was not found.";
  if (selection.phoneNumberId && !phoneNumbers.has(selection.phoneNumberId)) return "Selected WhatsApp phone number was not found for this WABA.";
  if (selection.templateId && !templates.has(selection.templateId)) return "Selected WhatsApp message template was not found for this WABA.";
  return "";
}

function pruneSelection(selection = {}, assets = {}, requestedBusinessId = "", requestedWabaId = "") {
  const businesses = new Set((assets.businesses || []).map((item) => item.id));
  const wabas = new Set((assets.wabas || []).map((item) => item.id));
  const phoneNumbers = new Set((assets.phoneNumbers || []).map((item) => item.id));
  const templates = new Set((assets.templates || []).map((item) => item.id));
  const businessId = requestedBusinessId && businesses.has(requestedBusinessId) ? requestedBusinessId : selection.businessId && businesses.has(selection.businessId) ? selection.businessId : "";
  const wabaId = requestedWabaId && wabas.has(requestedWabaId) ? requestedWabaId : selection.wabaId && wabas.has(selection.wabaId) ? selection.wabaId : "";

  return {
    businessId,
    wabaId,
    phoneNumberId: selection.phoneNumberId && phoneNumbers.has(selection.phoneNumberId) ? selection.phoneNumberId : "",
    templateId: selection.templateId && templates.has(selection.templateId) ? selection.templateId : "",
  };
}

function selectedTemplate(connection) {
  return (connection.assets.templates || []).find((template) => template.id === connection.selection.templateId) || null;
}

router.get("/assets", async (req, res) => {
  const config = getWhatsAppOAuthConfig();
  const connection = getWhatsAppConnection();
  const businessId = String(req.query.businessId || connection.selection.businessId || "");
  const wabaId = String(req.query.wabaId || connection.selection.wabaId || "");

  if (!config.configured) {
    return res.status(503).json({
      success: false,
      configured: false,
      message: "WhatsApp Business environment configuration is missing.",
    });
  }

  if (!connection.connected || !connection.token?.accessToken) {
    return res.status(401).json({
      success: false,
      configured: true,
      message: "WhatsApp Business is not connected.",
      ...getWhatsAppPublicConnection(),
    });
  }

  try {
    const [user, permissions, assets] = await Promise.all([
      getMetaUser(connection.token.accessToken),
      getMetaPermissions(connection.token.accessToken),
      fetchWhatsAppAssets(connection.token.accessToken, { businessId, wabaId }),
    ]);
    const selection = pruneSelection(connection.selection, assets, businessId, wabaId);
    updateWhatsAppConnectionSnapshot({ user, permissions, assets, selection });
    return res.json({
      success: true,
      configured: true,
      ...getWhatsAppPublicConnection(),
    });
  } catch (error) {
    const normalized = normalizeWhatsAppError(error, "Unable to fetch WhatsApp Business assets");
    const status = normalized.category === "TOKEN_EXPIRED" ? 401 : 502;
    if (status === 401) markWhatsAppReconnectRequired("WhatsApp token expired or was revoked. Reconnect WhatsApp Business to continue.");
    return res.status(status).json({
      success: false,
      configured: true,
      message: normalized.message,
      error: normalized,
      ...getWhatsAppPublicConnection(),
    });
  }
});

router.post("/selection", (req, res) => {
  const connection = getWhatsAppConnection();

  if (!connection.connected) {
    return res.status(401).json({
      success: false,
      message: "WhatsApp Business is not connected.",
      ...getWhatsAppPublicConnection(),
    });
  }

  const selection = {
    businessId: req.body?.businessId || "",
    wabaId: req.body?.wabaId || "",
    phoneNumberId: req.body?.phoneNumberId || "",
    templateId: req.body?.templateId || "",
  };
  const validationError = validateSelection(selection, connection.assets);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
      ...getWhatsAppPublicConnection(),
    });
  }

  const publicConnection = saveWhatsAppSelection(selection);
  return res.json({
    success: true,
    message: "WhatsApp Business asset selection saved for this server session.",
    ...publicConnection,
  });
});

router.get("/templates/:templateId/variables", (req, res) => {
  const connection = getWhatsAppConnection();
  const template = (connection.assets.templates || []).find((item) => item.id === req.params.templateId);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: "Selected WhatsApp message template was not found.",
      ...getWhatsAppPublicConnection(),
    });
  }

  return res.json({
    success: true,
    templateId: template.id,
    variables: extractTemplateVariables(template),
  });
});

router.post("/send-test", async (req, res) => {
  const connection = getWhatsAppConnection();

  if (!connection.connected || !connection.token?.accessToken) {
    return res.status(401).json({
      success: false,
      message: "WhatsApp Business is not connected.",
      ...getWhatsAppPublicConnection(),
    });
  }

  const readiness = buildWhatsAppReadiness(connection);
  if (!readiness.readyToSend) {
    return res.status(400).json({
      success: false,
      message: readiness.blockingReason || "Complete WhatsApp Business setup before sending.",
      error: { category: readiness.blockingCode || "WHATSAPP_NOT_CONNECTED" },
      ...getWhatsAppPublicConnection(),
    });
  }

  if (!req.body?.optInConfirmed) {
    return res.status(400).json({
      success: false,
      message: "Confirm that this recipient has opted in or is authorized for testing.",
      error: { category: "INVALID_RECIPIENT" },
      ...getWhatsAppPublicConnection(),
    });
  }

  try {
    const recipient = normalizeRecipient(req.body?.countryCode, req.body?.phoneNumber);
    const template = selectedTemplate(connection);
    const result = await sendWhatsAppTemplateMessage({
      accessToken: connection.token.accessToken,
      phoneNumberId: connection.selection.phoneNumberId,
      template,
      recipient,
      variables: req.body?.variables || {},
    });
    saveWhatsAppTestResult(result);
    return res.json({
      success: true,
      message: "Accepted by WhatsApp.",
      result,
      ...getWhatsAppPublicConnection(),
    });
  } catch (error) {
    const normalized = normalizeWhatsAppError(error, "WhatsApp test message failed");
    const status = normalized.category === "TOKEN_EXPIRED" ? 401 : normalized.category === "RATE_LIMITED" ? 429 : normalized.category === "INVALID_RECIPIENT" || normalized.category === "TEMPLATE_NOT_APPROVED" ? 400 : 502;
    return res.status(status).json({
      success: false,
      message: normalized.message,
      error: normalized,
      ...getWhatsAppPublicConnection(),
    });
  }
});

export default router;
