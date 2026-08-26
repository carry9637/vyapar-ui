const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MAX_IMAGE_TO_LAYERS_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TO_LAYERS_TYPES = ["image/png", "image/jpeg", "image/webp"];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read that image file."));
    reader.readAsDataURL(file);
  });
}

export function validateImageToLayersFile(file) {
  if (!file) return "Choose an image first.";
  if (!ACCEPTED_IMAGE_TO_LAYERS_TYPES.includes(file.type)) return "Choose a PNG, JPG, JPEG, or WebP image.";
  if (file.size > MAX_IMAGE_TO_LAYERS_BYTES) return "Image must be smaller than 8 MB.";
  return "";
}

export async function convertImageToLayers(file) {
  const validationError = validateImageToLayersFile(file);
  if (validationError) throw new Error(validationError);

  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch(`${API_BASE_URL}/api/marketing-studio/image-to-layers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: {
        name: file.name,
        type: file.type,
        dataUrl,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) {
    const error = new Error(payload.message || "Image to Layers failed.");
    error.code = payload.code || "IMAGE_TO_LAYERS_FAILED";
    error.requirements = payload.requirements || [];
    throw error;
  }

  return payload;
}

export function createImageToLayersDesign(result, keptLayerIds) {
  const kept = new Set(keptLayerIds);
  const id = `image-to-layers-${Date.now()}`;
  const elements = (result.layers || [])
    .filter((layer) => kept.has(layer.id))
    .map((layer) => ({
      ...layer,
      id: `${id}-${layer.id}`,
      mediaId: `${id}-${layer.id}`,
      name: layer.name || layer.id,
    }));

  const bgSrc = result.background?.src || result.backgroundSrc;

  // Development validation log for imported document structure
  console.log("[Image-to-Layers Import Validation]", {
    sourceWidth: result.width,
    sourceHeight: result.height,
    backgroundUsed: bgSrc ? bgSrc.slice(0, 50) + "..." : "none",
    layerCount: elements.length,
    layers: elements.map((el) => ({
      id: el.id,
      name: el.name,
      type: el.type,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      text: el.text || undefined,
    })),
  });

  return {
    id,
    title: result.fileName ? `${result.fileName} Layers` : "Image to Layers Draft",
    name: result.fileName ? `${result.fileName} Layers` : "Image to Layers Draft",
    category: "AI Import",
    type: "editable",
    templateType: "editable",
    editMode: "image-to-layers-beta",
    format: result.width > result.height ? "landscape-post" : result.height > result.width ? "portrait-post" : "square-post",
    width: result.width,
    height: result.height,
    canvas: {
      width: result.width,
      height: result.height,
      label: `${result.width} x ${result.height}px`,
    },
    thumbnail: bgSrc,
    thumbnailAlt: "Image to Layers imported design",
    businessCategories: ["general"],
    discoveryTabs: [],
    sections: [],
    tags: ["image to layers", "ai import", "beta"],
    assets: {
      thumbnail: bgSrc,
      source: "image-to-layers-beta",
      model: result.model,
    },
    brandBindings: [],
    background: {
      type: "image",
      src: bgSrc,
      locked: true,
      editable: false,
      reconstruction: result.background?.reconstruction || "opencv-telea-inpainting",
    },
    elements,
    editableConfig: {
      supportsBrandBindings: false,
      supportsUserOverlays: true,
      supportsElementEditing: true,
      supportsPosterEditing: false,
    },
    imageToLayers: {
      beta: true,
      model: result.model,
      note: result.note,
      sourceFileName: result.fileName,
    },
    eventIds: [],
  };
}
