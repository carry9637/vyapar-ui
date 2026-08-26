import { Router } from "express";
import googleOAuthClient from "../config/googleOAuth.js";

const router = Router();

router.get("/google", (_req, res) => {
  const authorizationUrl = googleOAuthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/business.manage"],
  });

  res.redirect(authorizationUrl);
});

router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Authorization code missing",
    });
  }

  try {
    const { tokens } = await googleOAuthClient.getToken(code);
    googleOAuthClient.setCredentials(tokens);

    const tokenStatus = {
      accessTokenReceived: Boolean(tokens.access_token),
      refreshTokenReceived: Boolean(tokens.refresh_token),
    };

    console.log("Google OAuth callback completed", tokenStatus);

    return res.json({
      success: true,
      message: "Google Business Profile connected successfully",
      ...tokenStatus,
    });
  } catch (error) {
    console.error("Google OAuth callback failed", {
      message: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Google OAuth callback failed",
    });
  }
});

export default router;
