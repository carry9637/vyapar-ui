const ONLINE_STORE_ORDERS_KEY = "ledgerly:onlineStoreOrders.v1";

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

function readOrders() {
  if (!canUseStorage()) return [];
  return safeParse(window.localStorage.getItem(ONLINE_STORE_ORDERS_KEY), []);
}

function writeOrders(orders) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ONLINE_STORE_ORDERS_KEY, JSON.stringify(orders));
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(status = "new") {
  const value = String(status || "new").toLowerCase();
  if (value === "accepted") return "accepted";
  if (value === "rejected") return "rejected";
  return "new";
}

function normalizeOrderItem(item = {}, index = 0) {
  const finalUnitPrice = toNumber(item.finalUnitPrice ?? item.itemPrice ?? item.unitPrice);
  const quantity = Math.max(toNumber(item.quantity), 0);

  return {
    id: item.id || `order-item-${index + 1}`,
    itemId: item.itemId || "",
    itemName: item.itemName || item.itemNameSnapshot || "Item",
    itemNameSnapshot: item.itemNameSnapshot || item.itemName || "Item",
    quantity,
    unitPrice: toNumber(item.unitPrice ?? item.itemPrice ?? finalUnitPrice),
    itemPrice: toNumber(item.itemPrice ?? item.unitPrice ?? finalUnitPrice),
    discountAmount: toNumber(item.discountAmount),
    finalUnitPrice,
    unit: item.unit || "",
    priceMode: item.priceMode || "Without Tax",
    taxRate: item.taxRate || item.taxRateSnapshot || "NONE",
    taxRateSnapshot: item.taxRateSnapshot || item.taxRate || "NONE",
    lineTotal: toNumber(item.lineTotal || finalUnitPrice * quantity),
  };
}

function normalizeOrder(order = {}) {
  const items = (order.items || []).map(normalizeOrderItem);
  const additionalCharge = toNumber(order.additionalCharge ?? order.additionalChargeAmount);
  const subtotal = order.subtotal !== undefined
    ? toNumber(order.subtotal)
    : items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = order.total !== undefined ? toNumber(order.total) : subtotal + additionalCharge;

  return {
    ...order,
    id: order.id || `ORD-${Date.now().toString(36).toUpperCase()}`,
    storeId: order.storeId || "",
    customerName: order.customerName || order.name || "",
    mobile: order.mobile || order.mobileNumber || "",
    mobileNumber: order.mobileNumber || order.mobile || "",
    address: order.address || "",
    items,
    subtotal,
    additionalChargeName: order.additionalChargeName || "",
    additionalCharge,
    additionalChargeAmount: toNumber(order.additionalChargeAmount ?? additionalCharge),
    total,
    status: normalizeStatus(order.status),
    convertedToSale: Boolean(order.convertedToSale),
    saleId: order.saleId || order.invoiceId || "",
    invoiceId: order.invoiceId || order.saleId || "",
    invoiceNumber: order.invoiceNumber || "",
    convertedAt: order.convertedAt || "",
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
  };
}

export function getOnlineStoreOrders() {
  return readOrders().map(normalizeOrder);
}

export function saveOnlineStoreOrder(order) {
  const timestamp = new Date().toISOString();
  const nextOrder = normalizeOrder({
    ...order,
    id: order.id || `ORD-${Date.now().toString(36).toUpperCase()}`,
    status: order.status || "new",
    createdAt: order.createdAt || timestamp,
    updatedAt: timestamp,
  });

  writeOrders([nextOrder, ...readOrders()]);
  return nextOrder;
}

export function updateOnlineStoreOrderStatus(orderId, status) {
  const timestamp = new Date().toISOString();
  const orders = getOnlineStoreOrders();
  let updatedOrder = null;
  const nextOrders = orders.map((order) => {
    if (order.id !== orderId) return order;
    updatedOrder = normalizeOrder({ ...order, status, updatedAt: timestamp });
    return updatedOrder;
  });

  writeOrders(nextOrders);
  return updatedOrder;
}

export function markOnlineStoreOrderConverted(orderId, saleReference) {
  const timestamp = new Date().toISOString();
  const orders = getOnlineStoreOrders();
  let updatedOrder = null;
  const nextOrders = orders.map((order) => {
    if (order.id !== orderId) return order;
    updatedOrder = normalizeOrder({
      ...order,
      convertedToSale: true,
      saleId: saleReference.saleId || saleReference.invoiceId || "",
      invoiceId: saleReference.invoiceId || saleReference.saleId || "",
      invoiceNumber: saleReference.invoiceNumber || "",
      convertedAt: timestamp,
      updatedAt: timestamp,
    });
    return updatedOrder;
  });

  writeOrders(nextOrders);
  return updatedOrder;
}

export const onlineStoreOrdersStorageKey = ONLINE_STORE_ORDERS_KEY;
