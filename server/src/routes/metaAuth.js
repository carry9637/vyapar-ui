import { Router } from "express";
import { getMetaOAuthConfig } from "../config/metaOAuth.js";
import { fetchMetaAssets } from "../services/metaAssetsService.js";
import {
  buildMetaAuthorizationUrl,
  exchangeCodeForAccessToken,
  exchangeForLongLivedUserToken,
  getMetaPermissions,
  getMetaUser,
  normalizeMetaError,
  validateMetaOAuthState,
} from "../services/metaOAuthService.js";
import {
  disconnectMetaConnection,
  getMetaPublicConnection,
  setMetaConnection,
  setMetaConnectionError,
} from "../services/metaConnectionStore.js";

const router = Router();

function smartAdsRedirect(status, message = "") {
  const config = getMetaOAuthConfig();
  const url = new URL("/business-growth/smart-ads", config.clientOrigin);
  url.searchParams.set("meta", status);
  if (message) url.searchParams.set("message", message);
  return url.toString();
}

router.get("/meta", (req, res) => {
  try {
    const authorizationUrl = buildMetaAuthorizationUrl(req.query.returnTo);
    return res.redirect(authorizationUrl);
  } catch (error) {
    const normalized = normalizeMetaError(error, "Unable to start Meta OAuth");
    setMetaConnectionError(normalized.message);
    return res.redirect(smartAdsRedirect("error", normalized.message));
  }
});

router.get("/meta/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    const message = String(error_description || error || "Meta login was cancelled.");
    setMetaConnectionError(message);
    return res.redirect(smartAdsRedirect("error", message));
  }

  if (!validateMetaOAuthState(String(state || ""))) {
    const message = "Meta OAuth state is invalid or expired.";
    setMetaConnectionError(message);
    return res.redirect(smartAdsRedirect("error", message));
  }

  if (!code) {
    const message = "Meta authorization code missing.";
    setMetaConnectionError(message);
    return res.redirect(smartAdsRedirect("error", message));
  }

  try {
    const shortLivedToken = await exchangeCodeForAccessToken(String(code));
    let tokenPayload = shortLivedToken;
    let longLived = false;

    try {
      tokenPayload = await exchangeForLongLivedUserToken(shortLivedToken.access_token);
      longLived = true;
    } catch {
      tokenPayload = shortLivedToken;
    }

    const accessToken = tokenPayload.access_token;
    const [user, permissions, assets] = await Promise.all([
      getMetaUser(accessToken),
      getMetaPermissions(accessToken),
      fetchMetaAssets(accessToken),
    ]);

    setMetaConnection({
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

    return res.redirect(smartAdsRedirect("connected"));
  } catch (callbackError) {
    const normalized = normalizeMetaError(callbackError, "Meta OAuth callback failed");
    setMetaConnectionError(normalized.message);
    return res.redirect(smartAdsRedirect("error", normalized.message));
  }
});

router.get("/meta/status", (_req, res) => {
  const config = getMetaOAuthConfig();
  return res.json({
    success: true,
    configured: config.configured,
    graphApiVersion: config.graphApiVersion,
    ...getMetaPublicConnection(),
  });
});

router.post("/meta/disconnect", (_req, res) => {
  const connection = disconnectMetaConnection();
  return res.json({
    success: true,
    message: "Meta disconnected",
    ...connection,
  });
});

export default router;
