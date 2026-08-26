import { Router } from "express";
import { getMetaConnection, getMetaPublicConnection } from "../services/metaConnectionStore.js";
import { publishMetaAdCampaign } from "../services/metaAdsService.js";
import { normalizeMetaError } from "../services/metaOAuthService.js";

const router = Router();

router.post("/publish", async (req, res) => {
  const connection = getMetaConnection();

  if (!connection.connected || !connection.token?.accessToken) {
    return res.status(401).json({
      success: false,
      message: "Meta is not connected. Reconnect before publishing.",
      ...getMetaPublicConnection(),
    });
  }

  try {
    const publish = await publishMetaAdCampaign({
      accessToken: connection.token.accessToken,
      connection,
      campaign: req.body?.campaign || {},
    });

    return res.json({
      success: true,
      message: "Meta campaign created in paused state.",
      publish,
    });
  } catch (error) {
    const normalized = normalizeMetaError(error, "Meta campaign publishing failed");
    return res.status(String(error.code || "").startsWith("META_") ? 400 : 502).json({
      success: false,
      message: normalized.message,
      error: error.publishResult?.error || normalized,
      publish: error.publishResult || null,
    });
  }
});

export default router;
