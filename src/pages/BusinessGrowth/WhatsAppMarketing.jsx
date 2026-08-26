import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiCheck,
  FiDownload,
  FiImage,
  FiMessageCircle,
  FiPhone,
  FiSearch,
  FiShare2,
  FiUpload,
  FiUser,
  FiX,
} from "react-icons/fi";
import {
  whatsappMarketingCategories,
  whatsappMarketingDefaults,
  whatsappMarketingSubcategories,
  whatsappMarketingTemplates,
} from "../../constants/whatsappMarketingData";

const EXPORT_WIDTH = 1080;
const EXPORT_PADDING = 54;
const EXPORT_TOP_HEIGHT = 132;
const EXPORT_BOTTOM_HEIGHT = 238;

const shareBackgroundPresets = [
  { id: "clean-white", label: "Clean White", base: "#ffffff", accent: "#e2e8f0", accent2: "#f8fafc", pattern: "diagonal", tone: "light" },
  { id: "soft-lavender", label: "Soft Lavender", base: "#f4f0ff", accent: "#c4b5fd", accent2: "#fdf4ff", pattern: "waves", tone: "light" },
  { id: "soft-blue", label: "Soft Blue", base: "#eff6ff", accent: "#bfdbfe", accent2: "#e0f2fe", pattern: "geometric", tone: "light" },
  { id: "warm-cream", label: "Warm Cream", base: "#fff7ed", accent: "#fed7aa", accent2: "#fef3c7", pattern: "diagonal", tone: "light" },
  { id: "light-geometric", label: "Light Geometric", base: "#f8fafc", accent: "#dbeafe", accent2: "#ede9fe", pattern: "geometric", tone: "light" },
  { id: "minimal-dots", label: "Minimal Dots", base: "#f8fafc", accent: "#cbd5e1", accent2: "#ffffff", pattern: "dots", tone: "light" },
  { id: "dark-navy", label: "Dark Navy", base: "#0f172a", accent: "#1d4ed8", accent2: "#38bdf8", pattern: "rays", tone: "dark" },
  { id: "dark-purple", label: "Dark Purple", base: "#1e1b4b", accent: "#7c3aed", accent2: "#c084fc", pattern: "rays", tone: "dark" },
];

const backgroundSwatches = ["#ffffff", "#f4f0ff", "#eff6ff", "#fff7ed", "#f8fafc", "#0f172a"];

function hexToRgb(hex = "#ffffff") {
  const cleanHex = hex.replace("#", "");
  const normalized = cleanHex.length === 3 ? cleanHex.split("").map((char) => char + char).join("") : cleanHex;
  const parsed = Number.parseInt(normalized, 16);
  if (!Number.isFinite(parsed)) return { r: 255, g: 255, b: 255 };
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function isDarkColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 < 132;
}

function selectedPreset(background) {
  return shareBackgroundPresets.find((preset) => preset.id === background.presetId) || shareBackgroundPresets[0];
}

function shareCardTheme(background) {
  const preset = selectedPreset(background);
  const dark = preset.tone === "dark" || isDarkColor(background.color);
  return {
    preset,
    dark,
    primary: dark ? "#f8fafc" : "#0f172a",
    secondary: dark ? "#cbd5e1" : "#64748b",
    accent: dark ? "#a5b4fc" : "#4f46e5",
    border: dark ? "rgba(255,255,255,0.18)" : "rgba(148,163,184,0.28)",
    logoBg: dark ? "rgba(255,255,255,0.12)" : "#ffffff",
  };
}

function backgroundStyle(background) {
  const { preset } = shareCardTheme(background);
  const opacity = Math.max(Number(background.intensity || 0), 0) / 100;
  const color = background.color || preset.base;
  const accent = preset.accent;
  const accent2 = preset.accent2;

  if (preset.pattern === "dots") {
    return {
      backgroundColor: color,
      backgroundImage: `radial-gradient(${accent} ${Math.max(opacity * 1.8, 0.35)}px, transparent ${Math.max(opacity * 1.8, 0.35)}px)`,
      backgroundSize: "18px 18px",
    };
  }

  if (preset.pattern === "geometric") {
    return {
      backgroundColor: color,
      backgroundImage: `linear-gradient(135deg, ${accent} ${opacity * 18}%, transparent ${opacity * 18 + 18}%), linear-gradient(45deg, transparent 55%, ${accent2} 56%, transparent 72%)`,
      backgroundSize: "96px 96px",
    };
  }

  if (preset.pattern === "waves") {
    return {
      backgroundColor: color,
      backgroundImage: `radial-gradient(circle at 16% 8%, ${accent} 0, transparent ${18 + opacity * 24}%), radial-gradient(circle at 88% 18%, ${accent2} 0, transparent ${16 + opacity * 22}%)`,
    };
  }

  if (preset.pattern === "rays") {
    return {
      backgroundColor: color,
      backgroundImage: `linear-gradient(135deg, transparent 0 58%, ${accent} 59%, transparent 72%), radial-gradient(circle at 90% 0%, ${accent2} 0, transparent ${22 + opacity * 20}%)`,
    };
  }

  return {
    backgroundColor: color,
    backgroundImage: `linear-gradient(135deg, transparent 0 48%, ${accent} 49%, transparent ${64 + opacity * 10}%), linear-gradient(160deg, transparent 0 70%, ${accent2} 71%, transparent 88%)`,
  };
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      {children}
    </label>
  );
}

function drawContain(ctx, image, x, y, width, height) {
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load poster image."));
    image.src = src;
  });
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawCanvasBackground(ctx, background, width, height) {
  const { preset } = shareCardTheme(background);
  const color = background.color || preset.base;
  const intensity = Math.max(Number(background.intensity || 0), 0) / 100;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = Math.min(0.5, intensity + 0.08);

  if (preset.pattern === "dots") {
    ctx.fillStyle = preset.accent;
    for (let x = 16; x < width; x += 42) {
      for (let y = 16; y < height; y += 42) {
        ctx.beginPath();
        ctx.arc(x, y, 2.2 + intensity * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (preset.pattern === "geometric") {
    ctx.fillStyle = hexToRgba(preset.accent, 0.42);
    for (let x = -80; x < width; x += 170) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 120, 0);
      ctx.lineTo(x + 35, height);
      ctx.lineTo(x - 85, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = hexToRgba(preset.accent2, 0.35);
    ctx.beginPath();
    ctx.arc(width * 0.9, height * 0.16, width * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (preset.pattern === "waves") {
    const left = ctx.createRadialGradient(width * 0.12, height * 0.1, 0, width * 0.12, height * 0.1, width * 0.42);
    left.addColorStop(0, hexToRgba(preset.accent, 0.55));
    left.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = left;
    ctx.fillRect(0, 0, width, height);

    const right = ctx.createRadialGradient(width * 0.88, height * 0.18, 0, width * 0.88, height * 0.18, width * 0.36);
    right.addColorStop(0, hexToRgba(preset.accent2, 0.48));
    right.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = right;
    ctx.fillRect(0, 0, width, height);
  } else if (preset.pattern === "rays") {
    ctx.fillStyle = hexToRgba(preset.accent, 0.5);
    ctx.beginPath();
    ctx.moveTo(width * 0.68, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width * 0.8, height);
    ctx.lineTo(width * 0.54, height);
    ctx.closePath();
    ctx.fill();

    const glow = ctx.createRadialGradient(width, 0, 0, width, 0, width * 0.55);
    glow.addColorStop(0, hexToRgba(preset.accent2, 0.58));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = hexToRgba(preset.accent, 0.35);
    ctx.beginPath();
    ctx.moveTo(width * 0.72, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width * 0.82, height);
    ctx.lineTo(width * 0.58, height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hexToRgba(preset.accent2, 0.3);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.72);
    ctx.lineTo(width * 0.38, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawWrappedText(ctx, value, x, y, width, { fontSize, color, weight = 700, align = "left", maxLines = 2 }) {
  if (!value?.trim()) return;

  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.font = `${weight} ${fontSize}px Inter, Arial, sans-serif`;

  const words = value.trim().split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);

  const drawX = align === "center" ? x + width / 2 : align === "right" ? x + width : x;
  lines.slice(0, maxLines).forEach((text, index) => {
    ctx.fillText(text, drawX, y + index * fontSize * 1.18);
  });
}

function OverlayPreview({ template, values, logoPreview, background }) {
  const theme = shareCardTheme(background);

  return (
    <div className="mx-auto flex h-full w-full items-center justify-center">
      <div className="flex aspect-[1080/1360] max-h-full w-full max-w-[440px] flex-col overflow-hidden rounded-2xl p-3.5 shadow-xl ring-1" style={{ ...backgroundStyle(background), color: theme.primary, borderColor: theme.border }}>
        <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b pb-2.5" style={{ borderColor: theme.border }}>
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl ring-1" style={{ backgroundColor: theme.logoBg, borderColor: theme.border }}>
            {logoPreview ? (
              <img src={logoPreview} alt="Business logo" className="h-full w-full object-contain p-1.5" />
            ) : (
              <span className="grid place-items-center gap-1 text-[9px] font-black uppercase leading-none" style={{ color: theme.secondary }}>
                <FiImage className="h-3.5 w-3.5" />
                Your Logo
              </span>
            )}
          </div>
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-extrabold sm:text-base" style={{ color: theme.primary }}>{values.businessName || "Business Name"}</p>
            <p className="truncate text-xs font-semibold" style={{ color: theme.secondary }}>{values.contactPerson || "Contact Person"}</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center py-2.5">
          <img src={template.image} alt={template.title} className="mx-auto max-h-full w-full rounded-xl object-contain shadow-lg" />
        </div>

        <div className="shrink-0 space-y-1.5 border-t pt-2.5 text-center" style={{ borderColor: theme.border }}>
          <p className="text-xs font-extrabold sm:text-sm" style={{ color: theme.accent }}>{values.additionalText || "Add your message here"}</p>
          <p className="text-xs font-bold sm:text-sm" style={{ color: theme.primary }}>{values.contactNumber || "Contact Number"}</p>
          <p className="text-[11px] font-medium leading-4 sm:text-xs" style={{ color: theme.secondary }}>{values.whatsappText || whatsappMarketingDefaults.whatsappText}</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundPanel({ background, setBackground, activeTab, setActiveTab }) {
  const updateBackground = (updates) => setBackground((current) => ({ ...current, ...updates }));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-slate-600">Background</p>
        <div className="mt-3 grid grid-cols-2 rounded-full bg-slate-100 p-1.5 text-xs font-bold">
          {["presets", "custom"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-2 capitalize transition ${activeTab === tab ? "bg-white text-[#1A1F71] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "presets" ? (
        <div className="grid grid-cols-2 gap-3.5">
          {shareBackgroundPresets.map((preset) => {
            const selected = background.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateBackground({ presetId: preset.id, color: preset.base })}
                className={`relative h-[70px] overflow-hidden rounded-xl border text-left transition ${selected ? "border-[#6D4AFF] ring-2 ring-[#6D4AFF]/20" : "border-slate-200 hover:border-[#6D4AFF]/50"}`}
                style={backgroundStyle({ ...background, presetId: preset.id, color: preset.base, intensity: 32 })}
                title={preset.label}
              >
                {selected && (
                  <span className="absolute bottom-2 left-2 grid h-5 w-5 place-items-center rounded-full bg-[#6D4AFF] text-white shadow">
                    <FiCheck className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
            Custom Color
            <input
              type="color"
              value={background.color}
              onChange={(event) => updateBackground({ color: event.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1"
            />
          </label>
          <p className="mt-2 text-xs leading-5 text-slate-500">Use a neutral brand color that keeps text readable.</p>
        </div>
      )}

      <div className="border-t border-slate-100 pt-5">
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-600">Background Color</p>
        <div className="flex flex-wrap gap-2">
          {backgroundSwatches.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => updateBackground({ color })}
              className={`grid h-8 w-8 place-items-center rounded-full border ${background.color === color ? "border-[#6D4AFF] ring-2 ring-[#6D4AFF]/20" : "border-slate-200"}`}
              style={{ backgroundColor: color }}
              aria-label={`Use background color ${color}`}
            >
              {background.color === color && <FiCheck className={`h-4 w-4 ${isDarkColor(color) ? "text-white" : "text-[#6D4AFF]"}`} />}
            </button>
          ))}
        </div>
      </div>

      <label className="block border-t border-slate-100 pt-5">
        <span className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-600">
          Pattern Intensity
          <b className="text-slate-500">{background.intensity}%</b>
        </span>
        <input
          type="range"
          min="0"
          max="55"
          value={background.intensity}
          onChange={(event) => updateBackground({ intensity: Number(event.target.value) })}
          className="w-full accent-[#6D4AFF]"
        />
      </label>
    </div>
  );
}

function PersonalizeModal({ template, onClose }) {
  const fileInputRef = useRef(null);
  const [values, setValues] = useState(whatsappMarketingDefaults);
  const [logoPreview, setLogoPreview] = useState("");
  const [background, setBackground] = useState({ presetId: "clean-white", color: "#ffffff", intensity: 28 });
  const [backgroundTab, setBackgroundTab] = useState("presets");
  const [status, setStatus] = useState("");

  useEffect(
    () => () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    },
    [logoPreview],
  );

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleLogoUpload = (event) => {
    const [file] = event.target.files || [];
    event.target.value = "";
    if (!file) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
  };

  const composeImage = async () => {
    const poster = await loadImage(template.image);
    const posterWidth = EXPORT_WIDTH - EXPORT_PADDING * 2;
    const posterHeight = Math.round(posterWidth * (poster.naturalHeight / poster.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_TOP_HEIGHT + posterHeight + EXPORT_BOTTOM_HEIGHT;
    const ctx = canvas.getContext("2d");
    const theme = shareCardTheme(background);

    drawCanvasBackground(ctx, background, canvas.width, canvas.height);

    ctx.fillStyle = theme.border;
    ctx.fillRect(EXPORT_PADDING, EXPORT_TOP_HEIGHT - 1, posterWidth, 1);
    ctx.fillRect(EXPORT_PADDING, EXPORT_TOP_HEIGHT + posterHeight, posterWidth, 1);

    if (logoPreview) {
      const logo = await loadImage(logoPreview);
      const x = EXPORT_PADDING;
      const y = 30;
      const size = 72;
      ctx.fillStyle = theme.logoBg;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 18);
      ctx.fill();
      drawContain(ctx, logo, x + 8, y + 8, size - 16, size - 16);
    } else {
      ctx.fillStyle = theme.logoBg;
      ctx.beginPath();
      ctx.roundRect(EXPORT_PADDING, 30, 72, 72, 18);
      ctx.fill();
      drawWrappedText(ctx, "Your Logo", EXPORT_PADDING + 10, 56, 52, {
        fontSize: 13,
        color: theme.secondary,
        weight: 800,
        align: "center",
        maxLines: 2,
      });
    }

    drawWrappedText(ctx, values.businessName || "Business Name", EXPORT_PADDING + 110, 34, posterWidth - 110, {
      fontSize: 38,
      color: theme.primary,
      weight: 800,
      align: "right",
      maxLines: 1,
    });
    drawWrappedText(ctx, values.contactPerson || "Contact Person", EXPORT_PADDING + 110, 78, posterWidth - 110, {
      fontSize: 20,
      color: theme.secondary,
      weight: 700,
      align: "right",
      maxLines: 1,
    });

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(EXPORT_PADDING, EXPORT_TOP_HEIGHT, posterWidth, posterHeight, 24);
    ctx.clip();
    ctx.drawImage(poster, EXPORT_PADDING, EXPORT_TOP_HEIGHT, posterWidth, posterHeight);
    ctx.restore();

    const footerTop = EXPORT_TOP_HEIGHT + posterHeight + 30;
    drawWrappedText(ctx, values.additionalText || "Add your message here", EXPORT_PADDING, footerTop, posterWidth, {
      fontSize: 34,
      color: theme.accent,
      weight: 800,
      align: "center",
      maxLines: 2,
    });
    drawWrappedText(ctx, values.contactNumber || "Contact Number", EXPORT_PADDING, footerTop + 88, posterWidth, {
      fontSize: 28,
      color: theme.primary,
      weight: 800,
      align: "center",
      maxLines: 1,
    });
    drawWrappedText(ctx, values.whatsappText || whatsappMarketingDefaults.whatsappText, EXPORT_PADDING, footerTop + 130, posterWidth, {
      fontSize: 20,
      color: theme.secondary,
      weight: 600,
      align: "center",
      maxLines: 2,
    });

    return canvas;
  };

  const handleDownload = async () => {
    setStatus("");
    const canvas = await composeImage();
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.id}.png`;
    link.click();
    setStatus("Downloaded poster image.");
  };

  const handleShare = async () => {
    setStatus("");
    const canvas = await composeImage();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], `${template.id}.png`, { type: "image/png" });
    const shareText = values.whatsappText || whatsappMarketingDefaults.whatsappText;

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: template.title, text: shareText, files: [file] });
      setStatus("Shared poster image.");
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
    setStatus("Image sharing is unavailable here, so WhatsApp text sharing was opened.");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3 sm:p-4">
      <div className="flex h-[84vh] max-h-[860px] w-[min(92vw,1240px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#6D4AFF]">Share & Download</p>
            <h2 className="text-lg font-bold leading-tight text-slate-900">{template.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(380px,1fr)_280px]">
          <div className="min-h-0 overflow-y-auto border-b border-slate-200 px-5 py-5 pr-6 lg:border-b-0 lg:border-r">
            <div className="space-y-4">
              <Field label="Business Logo" icon={FiImage}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-20 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-700 hover:bg-white"
                >
                  <FiUpload className="h-4 w-4" />
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                  <span className="text-xs font-medium text-slate-400">PNG, JPG up to 2MB</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </Field>

              <Field label="Business Name" icon={FiUser}>
                <input value={values.businessName} onChange={(event) => updateValue("businessName", event.target.value)} placeholder="Your business name" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#6D4AFF]" />
              </Field>

              <Field label="Contact Person" icon={FiUser}>
                <input value={values.contactPerson} onChange={(event) => updateValue("contactPerson", event.target.value)} placeholder="Contact person" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#6D4AFF]" />
              </Field>

              <Field label="Contact Number" icon={FiPhone}>
                <input value={values.contactNumber} onChange={(event) => updateValue("contactNumber", event.target.value)} placeholder="+91 00000 00000" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#6D4AFF]" />
              </Field>

              <Field label="Additional Text" icon={FiMessageCircle}>
                <textarea value={values.additionalText} onChange={(event) => updateValue("additionalText", event.target.value)} rows={3} placeholder="Special offer, announcement, or message" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#6D4AFF]" />
              </Field>

              <Field label="WhatsApp Text" icon={FiMessageCircle}>
                <textarea value={values.whatsappText} onChange={(event) => updateValue("whatsappText", event.target.value)} rows={3} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#6D4AFF]" />
              </Field>
            </div>
          </div>

          <div className="min-h-0 overflow-hidden bg-slate-100 px-7 py-6">
            <OverlayPreview template={template} values={values} logoPreview={logoPreview} background={background} />
            {status && <p className="mt-4 text-center text-sm font-semibold text-slate-600">{status}</p>}
          </div>

          <aside className="min-h-0 overflow-y-auto border-t border-slate-200 px-5 py-5 lg:border-l lg:border-t-0">
            <BackgroundPanel background={background} setBackground={setBackground} activeTab={backgroundTab} setActiveTab={setBackgroundTab} />
          </aside>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={handleShare} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <FiShare2 className="h-4 w-4" />
            Share
          </button>
          <button type="button" onClick={handleDownload} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#6D4AFF] px-5 text-sm font-bold text-white hover:bg-[#5938e8]">
            <FiDownload className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className="group flex h-[410px] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#36A175]/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#36A175]/20"
    >
      <div className="flex w-full flex-col">
        <div className="flex h-[306px] items-center justify-center bg-slate-50 p-4">
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-slate-100 bg-white/70 p-3">
            <img
              src={template.image}
              alt={template.title}
              className="max-h-full max-w-full object-contain transition duration-200 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        </div>
        <div className="flex h-[104px] shrink-0 flex-col justify-center border-t border-slate-100 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 truncate text-sm font-bold text-slate-950">{template.title}</h2>
            <span className="shrink-0 rounded-full bg-[#F97316]/10 px-2.5 py-1 text-[11px] font-bold text-[#C2410C]">
              {template.subcategory}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">{template.category} poster</p>
        </div>
      </div>
    </button>
  );
}

function WhatsAppMarketing() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return whatsappMarketingTemplates.filter((template) => {
      const matchesCategory = activeCategory === "All" || template.category === activeCategory;
      const matchesSubcategory = activeSubcategory === "All" || template.subcategory === activeSubcategory;
      const matchesQuery = !query || `${template.title} ${template.category} ${template.subcategory}`.toLowerCase().includes(query);
      return matchesCategory && matchesSubcategory && matchesQuery;
    });
  }, [activeCategory, activeSubcategory, searchQuery]);

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold text-[#36A175]">Business Growth</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">WhatsApp Marketing</h1>
            <p className="mt-1 text-sm text-slate-500">Personalize ready posters and share them with customers.</p>
          </div>
          <label className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 shadow-sm xl:w-[420px]">
            <FiSearch className="h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search posters"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
        </div>
      </header>

      <main className="space-y-5 p-5">
        <section className="space-y-3">
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {whatsappMarketingCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`h-10 shrink-0 rounded-full px-4 text-sm font-bold transition ${
                  activeCategory === category ? "bg-[#1A1F71] text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {whatsappMarketingSubcategories.map((subcategory) => (
              <button
                key={subcategory}
                type="button"
                onClick={() => setActiveSubcategory(subcategory)}
                className={`h-8 shrink-0 rounded-lg px-3 text-xs font-bold transition ${
                  activeSubcategory === subcategory ? "bg-[#36A175] text-white shadow-sm" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {subcategory}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} onSelect={setSelectedTemplate} />
          ))}
        </section>
      </main>

      {selectedTemplate && <PersonalizeModal template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />}
    </div>
  );
}

export default WhatsAppMarketing;
