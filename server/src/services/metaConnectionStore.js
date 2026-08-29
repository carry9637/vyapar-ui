let metaConnection = {
  connected: false,
  user: null,
  permissions: [],
  token: null,
  assets: {
    businesses: [],
    pages: [],
    instagramAccounts: [],
    adAccounts: [],
    warnings: [],
  },
  selection: {
    businessId: "",
    pageId: "",
    instagramAccountId: "",
    adAccountId: "",
  },
  connectedAt: null,
  lastError: "",
};

function emptyAssets() {
  return {
    businesses: [],
    pages: [],
    instagramAccounts: [],
    adAccounts: [],
    warnings: [],
  };
}

function emptySelection() {
  return {
    businessId: "",
    pageId: "",
    instagramAccountId: "",
    adAccountId: "",
  };
}

function publicConnection() {
  return {
    connected: metaConnection.connected,
    user: metaConnection.user,
    permissions: metaConnection.permissions,
    assets: metaConnection.assets,
    selection: metaConnection.selection,
    connectedAt: metaConnection.connectedAt,
    lastError: metaConnection.lastError,
  };
}

export function getMetaConnection() {
  return metaConnection;
}

export function getMetaPublicConnection() {
  return publicConnection();
}

export function setMetaConnection(nextConnection) {
  metaConnection = {
    ...metaConnection,
    ...nextConnection,
    connected: true,
    lastError: "",
    connectedAt: nextConnection.connectedAt || new Date().toISOString(),
  };
  return publicConnection();
}

export function setMetaConnectionError(message) {
  metaConnection = {
    ...metaConnection,
    connected: false,
    user: null,
    permissions: [],
    token: null,
    assets: emptyAssets(),
    selection: emptySelection(),
    connectedAt: null,
    lastError: message || "Meta connection failed",
  };
  return publicConnection();
}

export function updateMetaAssets(assets) {
  metaConnection = {
    ...metaConnection,
    assets: assets || metaConnection.assets,
  };
  return publicConnection();
}

export function updateMetaConnectionSnapshot({ user, permissions, assets, selection } = {}) {
  metaConnection = {
    ...metaConnection,
    connected: true,
    user: user || metaConnection.user,
    permissions: permissions || metaConnection.permissions,
    assets: assets || metaConnection.assets,
    selection: selection || metaConnection.selection,
    lastError: "",
  };
  return publicConnection();
}

export function markMetaReconnectRequired(message) {
  metaConnection = {
    ...metaConnection,
    connected: false,
    user: null,
    permissions: [],
    token: null,
    connectedAt: null,
    lastError: message || "Meta token expired. Reconnect Meta to continue.",
  };
  return publicConnection();
}

export function saveMetaSelection(selection = {}) {
  metaConnection = {
    ...metaConnection,
    selection: {
      businessId: selection.businessId || "",
      pageId: selection.pageId || "",
      instagramAccountId: selection.instagramAccountId || "",
      adAccountId: selection.adAccountId || "",
    },
  };
  return publicConnection();
}

export function disconnectMetaConnection() {
  metaConnection = {
    connected: false,
    user: null,
    permissions: [],
    token: null,
    assets: emptyAssets(),
    selection: emptySelection(),
    connectedAt: null,
    lastError: "",
  };
  return publicConnection();
}
