import { Router } from "express";
import { getWhatsAppOAuthConfig } from "../config/whatsappOAuth.js";
import { fetchWhatsAppAssets, normalizeWhatsAppError } from "../services/whatsappBusinessService.js";
import {
  WHATSAPP_OAUTH_STATE_COOKIE,
  buildWhatsAppAuthorizationRequest,
  exchangeForLongLivedWhatsAppToken,
  exchangeWhatsAppCodeForAccessToken,
  validateWhatsAppOAuthState,
} from "../services/whatsappOAuthService.js";
import {
  disconnectWhatsAppConnection,
  getWhatsAppPublicConnection,
  setWhatsAppConnection,
  setWhatsAppConnectionError,
} from "../services/whatsappConnectionStore.js";
import { getMetaPermissions, getMetaUser, normalizeMetaError } from "../services/metaOAuthService.js";
import { ensureWhatsAppTestConnection } from "../services/whatsappTestModeService.js";

const router = Router();
const OAUTH_COOKIE_PATH = "/api/auth/whatsapp";

function isSecureRequest(req) {
  return req.secure || String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";
}

function oauthCookieOptions(req, maxAge) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(req),
    path: OAUTH_COOKIE_PATH,
    ...(maxAge ? { maxAge } : {}),
  };
}

function readCookie(req, name) {
  const cookies = String(req.headers.cookie || "").split(";");
  const found = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  if (!found) return "";
  return decodeURIComponent(found.trim().slice(name.length + 1));
}

function clearWhatsAppOAuthStateCookie(req, res) {
  res.clearCookie(WHATSAPP_OAUTH_STATE_COOKIE, oauthCookieOptions(req));
}

function whatsappRedirect(status, message = "") {
  const config = getWhatsAppOAuthConfig();
  const url = new URL("/business-growth/whatsapp-marketing", config.clientOrigin);
  url.searchParams.set("whatsapp", status);
  if (message) url.searchParams.set("message", message);
  return url.toString();
}

router.get("/whatsapp", (req, res) => {
  try {
    const { authorizationUrl, stateCookie, maxAgeMs } = buildWhatsAppAuthorizationRequest(req.query.returnTo);
    res.cookie(WHATSAPP_OAUTH_STATE_COOKIE, stateCookie, oauthCookieOptions(req, maxAgeMs));
    return res.redirect(authorizationUrl);
  } catch (error) {
    const normalized = normalizeMetaError(error, "Unable to start WhatsApp Business OAuth");
    setWhatsAppConnectionError(normalized.message);
    return res.redirect(whatsappRedirect("error", normalized.message));
  }
});

router.post("/whatsapp/test-connect", async (_req, res) => {
  try {
    await ensureWhatsAppTestConnection();
    return res.json({
      success: true,
      configured: true,
      oauthConfigured: getWhatsAppOAuthConfig().oauthConfigured,
      testModeConfigured: true,
      message: "WhatsApp test setup connected.",
      ...getWhatsAppPublicConnection(),
    });
  } catch (error) {
    const normalized = normalizeWhatsAppError(error, "Unable to connect WhatsApp test setup");
    setWhatsAppConnectionError(normalized.message);
    return res.status(502).json({
      success: false,
      configured: getWhatsAppOAuthConfig().configured,
      oauthConfigured: getWhatsAppOAuthConfig().oauthConfigured,
      testModeConfigured: getWhatsAppOAuthConfig().testModeConfigured,
      message: normalized.message,
      error: normalized,
      ...getWhatsAppPublicConnection(),
    });
  }
});

router.get("/whatsapp/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const stateCookie = readCookie(req, WHATSAPP_OAUTH_STATE_COOKIE);
  clearWhatsAppOAuthStateCookie(req, res);

  if (error) {
    const message = String(error_description || error || "WhatsApp Business login was cancelled.");
    setWhatsAppConnectionError(message);
    return res.redirect(whatsappRedirect("error", message));
  }

  if (!validateWhatsAppOAuthState(String(state || ""), stateCookie)) {
    const message = "WhatsApp OAuth state is invalid or expired.";
    setWhatsAppConnectionError(message);
    return res.redirect(whatsappRedirect("error", message));
  }

  if (!code) {
    const message = "WhatsApp authorization code missing.";
    setWhatsAppConnectionError(message);
    return res.redirect(whatsappRedirect("error", message));
  }

  try {
    const shortLivedToken = await exchangeWhatsAppCodeForAccessToken(String(code));
    let tokenPayload = shortLivedToken;
    let longLived = false;

    try {
      tokenPayload = await exchangeForLongLivedWhatsAppToken(shortLivedToken.access_token);
      longLived = true;
    } catch {
      tokenPayload = shortLivedToken;
    }

    const accessToken = tokenPayload.access_token;
    const [user, permissions, assets] = await Promise.all([
      getMetaUser(accessToken),
      getMetaPermissions(accessToken),
      fetchWhatsAppAssets(accessToken),
    ]);

    setWhatsAppConnection({
      user,
      permissions,
      assets,
      token: {
        accessToken,
        tokenType: tokenPayload.token_type || "bearer",
        expiresIn: tokenPayload.expires_in || shortLivedToken.expires_in || null,
        longLived,
        obtainedAt: new Date().toISOString(),
      },
    });

    return res.redirect(whatsappRedirect("connected"));
  } catch (callbackError) {
    const normalized = normalizeMetaError(callbackError, "WhatsApp OAuth callback failed");
    setWhatsAppConnectionError(normalized.message);
    return res.redirect(whatsappRedirect("error", normalized.message));
  }
});

router.get("/whatsapp/status", async (_req, res) => {
  const config = getWhatsAppOAuthConfig();
  if (config.testModeConfigured) {
    try {
      await ensureWhatsAppTestConnection();
    } catch (error) {
      const normalized = normalizeWhatsAppError(error, "Unable to load WhatsApp test setup");
      return res.status(502).json({
        success: false,
        configured: config.configured,
        oauthConfigured: config.oauthConfigured,
        testModeConfigured: config.testModeConfigured,
        graphApiVersion: config.graphApiVersion,
        message: normalized.message,
        error: normalized,
        ...getWhatsAppPublicConnection(),
      });
    }
  }

  return res.json({
    success: true,
    configured: config.configured,
    oauthConfigured: config.oauthConfigured,
    testModeConfigured: config.testModeConfigured,
    graphApiVersion: config.graphApiVersion,
    ...getWhatsAppPublicConnection(),
  });
});

router.post("/whatsapp/disconnect", (_req, res) => {
  const connection = disconnectWhatsAppConnection();
  return res.json({
    success: true,
    message: "WhatsApp Business disconnected",
    ...connection,
  });
});

export default router;
