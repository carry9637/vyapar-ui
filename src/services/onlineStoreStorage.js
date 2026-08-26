const ONLINE_STORE_KEY = "ledgerly:onlineStore.v1";

const defaultOnlineStoreState = {
  created: false,
  prototypeStoreId: "",
  storeName: "My Online Store",
  businessName: "My Company",
  gstin: "",
  logoUrl: "",
  contactNumber: "",
  email: "",
  address: "",
  description: "",
  acceptOnlineOrders: false,
  minimumOrderAmount: "",
  additionalChargesEnabled: false,
  additionalChargeName: "",
  additionalChargeAmount: "",
  selectedItemIds: [],
  createdAt: "",
  updatedAt: "",
};

function safeParse(value, fallback) {
  try {
    return JSON.parse(value) || fallback;
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function createPrototypeStoreId(value = "") {
  const slug = String(value || "store")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  return `${slug || "store"}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getOnlineStoreState() {
  if (!canUseStorage()) return defaultOnlineStoreState;
  return {
    ...defaultOnlineStoreState,
    ...safeParse(window.localStorage.getItem(ONLINE_STORE_KEY), defaultOnlineStoreState),
  };
}

export function saveOnlineStoreState(state) {
  const current = getOnlineStoreState();
  const timestamp = new Date().toISOString();
  const nextState = {
    ...current,
    ...state,
    prototypeStoreId: current.prototypeStoreId || state.prototypeStoreId || createPrototypeStoreId(state.storeName || current.storeName),
    updatedAt: timestamp,
    createdAt: current.createdAt || state.createdAt || timestamp,
  };

  if (canUseStorage()) {
    window.localStorage.setItem(ONLINE_STORE_KEY, JSON.stringify(nextState));
  }

  return nextState;
}

export const onlineStoreStorageKey = ONLINE_STORE_KEY;
