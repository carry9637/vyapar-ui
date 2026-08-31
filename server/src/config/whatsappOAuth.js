/* global process */

import { getMetaOAuthConfig } from "./metaOAuth.js";

export const WHATSAPP_AUTH_SCOPES = [
  "business_management",
  "whatsapp_business_management",
  "whatsapp_business_messaging",
];

export function getWhatsAppOAuthConfig() {
  const metaConfig = getMetaOAuthConfig();
  const redirectUri = process.env.WHATSAPP_REDIRECT_URI || "";

  return {
    ...metaConfig,
    redirectUri,
    loginConfigId: process.env.WHATSAPP_LOGIN_CONFIG_ID || "",
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "",
    configured: Boolean(metaConfig.appId && metaConfig.appSecret && redirectUri),
  };
}
