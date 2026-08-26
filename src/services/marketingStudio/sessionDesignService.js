const SESSION_DESIGNS_KEY = "marketingStudio.sessionDesigns.v1";
const memorySessionDesigns = new Map();

function getStorageCandidates() {
  if (typeof window === "undefined") return [];
  return [window.sessionStorage, window.localStorage].filter(Boolean);
}

function readDesignsFromStorage(storage) {
  try {
    return JSON.parse(storage.getItem(SESSION_DESIGNS_KEY) || "{}");
  } catch {
    return {};
  }
}

function initMemoryFromStorage() {
  if (memorySessionDesigns.size > 0) return;
  for (const storage of getStorageCandidates()) {
    const designs = readDesignsFromStorage(storage);
    Object.entries(designs).forEach(([id, design]) => {
      if (id && design) memorySessionDesigns.set(id, design);
    });
  }
}

export function saveSessionDesign(design) {
  if (typeof window === "undefined" || !design?.id) return false;

  // Always store in in-memory Map first to guarantee instant, unlimited retrieval during active session
  memorySessionDesigns.set(design.id, design);

  // Store lightweight metadata / fallback in storage
  const currentStorageDesigns = readDesignsFromStorage(window.sessionStorage || window.localStorage);
  const nextStorageDesigns = {
    ...currentStorageDesigns,
    [design.id]: {
      ...design,
      // Create a lightweight version for persistent storage if payload is large
      background: design.background ? { ...design.background, src: design.background.src ? design.background.src.slice(0, 100) + "..." : "" } : null,
    },
  };

  try {
    const serialized = JSON.stringify(nextStorageDesigns);
    for (const storage of getStorageCandidates()) {
      try {
        storage.setItem(SESSION_DESIGNS_KEY, serialized);
        break;
      } catch {
        // Continue fallback
      }
    }
  } catch {
    // Ignore storage serialization error since memorySessionDesigns holds the complete design
  }

  return true;
}

export function getSessionDesignById(id) {
  if (!id) return null;
  initMemoryFromStorage();
  if (memorySessionDesigns.has(id)) {
    return memorySessionDesigns.get(id);
  }
  return null;
}

export function getSessionDesigns() {
  initMemoryFromStorage();
  return Array.from(memorySessionDesigns.values());
}
