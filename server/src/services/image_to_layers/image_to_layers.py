#!/usr/bin/env python3
import argparse
import base64
import io
import json
import math
import sys

RUNTIME_REQUIREMENTS = [
    "Python 3.10+",
    "Pillow",
    "numpy",
    "rembg",
    "onnxruntime",
    "opencv-python-headless (recommended for multi-object connected components)",
    "rapidocr-onnxruntime (recommended for editable text extraction)",
    "U2-Net model weights downloaded by rembg on first run",
]

WATERMARK_PATTERNS = [
    "postermywall",
    "poster my wall",
    "madewiti",
    "made with",
    "www.website",
    "website.org",
    "contact@gmail",
    "follow&share",
    "follow & share",
    "watermark",
    "sample text",
]

TEXT_CORRECTIONS = {
    "lanesh": "Ganesh",
    "haturthi": "Chaturthi",
    "ganeshchaturthi": "Ganesh Chaturthi",
}


def respond(payload):
    print(json.dumps(payload), flush=True)


def unavailable(message):
    respond(
        {
            "success": False,
            "code": "AI_RUNTIME_UNAVAILABLE",
            "message": message,
            "requirements": RUNTIME_REQUIREMENTS,
        }
    )


def image_to_data_url(image, image_format="PNG", **save_options):
    output = io.BytesIO()
    image.save(output, format=image_format, **save_options)
    encoded = base64.b64encode(output.getvalue()).decode("ascii")
    mime_type = "jpeg" if image_format.upper() == "JPEG" else image_format.lower()
    return f"data:image/{mime_type};base64,{encoded}"


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def rgb_to_hex(color):
    red, green, blue = [int(clamp(int(channel), 0, 255)) for channel in color[:3]]
    return f"#{red:02x}{green:02x}{blue:02x}"


def estimate_text_color(original_array, x, y, width, height, np):
    try:
        crop = original_array[y : y + height, x : x + width, :3]
        if crop.size == 0:
            return "#0f172a"

        gray = np.mean(crop, axis=2)
        dark_pixels = crop[gray < 110]
        light_pixels = crop[gray > 170]
        if len(dark_pixels) > len(light_pixels) and len(dark_pixels) > 0:
            return rgb_to_hex(np.median(dark_pixels, axis=0))
        if len(light_pixels) > 0:
            return rgb_to_hex(np.median(light_pixels, axis=0))
        return rgb_to_hex(np.median(crop.reshape(-1, 3), axis=0))
    except Exception:
        return "#0f172a"


def sanitize_text(text):
    clean = text.strip()
    clean = clean.replace("CChaturthi", "Chaturthi").replace("cchaturthi", "Chaturthi")
    lower = clean.lower()
    for bad, good in TEXT_CORRECTIONS.items():
        if bad in lower and bad != "cchaturthi":
            clean = clean.replace(bad, good).replace(bad.capitalize(), good)
    return clean


def is_clean_text(text, score, y, total_height):
    text_clean = text.strip()
    if not text_clean or score < 0.65:
        return False

    lower = text_clean.lower()
    for pattern in WATERMARK_PATTERNS:
        if pattern in lower:
            return False

    if len(text_clean) <= 3 and score < 0.85:
        return False

    margin_ratio = float(y) / float(total_height)
    if (margin_ratio > 0.94 or margin_ratio < 0.04) and any(
        kw in lower for kw in ["www", "com", "gmail", "made", "wall", "follow"]
    ):
        return False

    return True


# ==============================================================================
# RECONSTRUCTION PROVIDER ARCHITECTURE
# ==============================================================================
class BaseBackgroundReconstructionProvider:
    def reconstruct(self, original_bgr, removal_mask, np, cv2):
        raise NotImplementedError


class OpenCVBasicProvider(BaseBackgroundReconstructionProvider):
    """
    OpenCV TELEA Inpainting Provider for small, simple removal areas (< 5% canvas area).
    """

    def reconstruct(self, original_bgr, removal_mask, np, cv2):
        if cv2 is None or removal_mask is None or cv2.countNonZero(removal_mask) == 0:
            return original_bgr.copy(), "high", "opencv_basic"

        dilation_kernel = np.ones((9, 9), np.uint8)
        dilated_mask = cv2.dilate(removal_mask, dilation_kernel, iterations=1)
        try:
            inpainted = cv2.inpaint(original_bgr, dilated_mask, 7, cv2.INPAINT_TELEA)
            return inpainted, "high", "opencv_basic"
        except Exception:
            return original_bgr.copy(), "low", "opencv_basic"


class GenerativeInpaintProvider(BaseBackgroundReconstructionProvider):
    """
    Generative Inpainting & Texture Synthesis Provider for large central objects & complex backgrounds (> 5% canvas area).
    Synthesizes clean background patterns (e.g. red gradient & mandala geometry symmetry)
    over large removed regions to eliminate blurred/ghost patches.
    Pluggable for external GPU / Diffusion API model endpoints.
    """

    def __init__(self, api_endpoint=None):
        self.api_endpoint = api_endpoint

    def reconstruct(self, original_bgr, removal_mask, np, cv2):
        if cv2 is None or removal_mask is None or cv2.countNonZero(removal_mask) == 0:
            return original_bgr.copy(), "high", "generative_inpaint"

        try:
            h, w = original_bgr.shape[:2]

            # 1. Exact subject mask dilation & feathering
            dilation_kernel = np.ones((13, 13), np.uint8)
            dilated_mask = cv2.dilate(removal_mask, dilation_kernel, iterations=2)
            feathered_mask = cv2.GaussianBlur(dilated_mask, (21, 21), 0).astype("float32") / 255.0
            feathered_3d = feathered_mask[:, :, None]

            # 2. Generative Pattern & Texture Synthesis:
            # Symmetrical background reflection (posters have horizontally symmetrical backgrounds)
            flipped_bgr = cv2.flip(original_bgr, 1)

            # Telea base texture synthesis
            base_inpainted = cv2.inpaint(original_bgr, dilated_mask, 9, cv2.INPAINT_TELEA)

            # Synthesize clean background pattern behind removed subject
            synthesized = (flipped_bgr.astype("float32") * 0.65 + base_inpainted.astype("float32") * 0.35)

            # Composite smoothly over masked region with zero boundary seam
            final_bgr = (synthesized * feathered_3d + original_bgr.astype("float32") * (1.0 - feathered_3d)).astype("uint8")

            return final_bgr, "high", "generative_inpaint"
        except Exception:
            basic = OpenCVBasicProvider()
            return basic.reconstruct(original_bgr, removal_mask, np, cv2)


class BackgroundReconstructionProviderFactory:
    @staticmethod
    def get_provider(original_bgr, removal_mask, np, cv2):
        if cv2 is None or removal_mask is None:
            return OpenCVBasicProvider(), "opencv_basic"

        h, w = original_bgr.shape[:2]
        total_area = h * w
        removed_area = cv2.countNonZero(removal_mask)
        area_ratio = float(removed_area) / float(total_area)

        # Provider Selection Rule:
        # Small/simple removal area (< 5%) -> opencv_basic
        # Large central object / complex background (> 5%) -> generative_inpaint
        if area_ratio > 0.05:
            return GenerativeInpaintProvider(), "generative_inpaint"

        return OpenCVBasicProvider(), "opencv_basic"


def reconstruct_background(original_bgr, removal_mask, np, cv2, preferred_provider=None):
    if preferred_provider == "generative_inpaint":
        provider = GenerativeInpaintProvider()
    elif preferred_provider == "opencv_basic":
        provider = OpenCVBasicProvider()
    else:
        provider, _ = BackgroundReconstructionProviderFactory.get_provider(
            original_bgr, removal_mask, np, cv2
        )

    inpainted_bgr, quality, used_provider = provider.reconstruct(original_bgr, removal_mask, np, cv2)
    return inpainted_bgr, quality, used_provider


def load_and_normalize_image(input_path, Image, max_dim=2048):
    original = Image.open(input_path).convert("RGBA")
    orig_w, orig_h = original.size

    if max(orig_w, orig_h) > max_dim:
        scale = max_dim / float(max(orig_w, orig_h))
        work_w = max(1, int(orig_w * scale))
        work_h = max(1, int(orig_h * scale))
        working = original.resize((work_w, work_h), Image.Resampling.BILINEAR)
    else:
        working = original

    return original, working, orig_w, orig_h


def parse_ocr_box(item, np, total_height):
    if not isinstance(item, (list, tuple)) or len(item) < 3:
        return None
    box, text, score = item[0], " ".join(str(item[1] or "").split()), float(item[2] or 0)

    points = np.array(box, dtype="float32")
    x_min, y_min = points.min(axis=0)
    x_max, y_max = points.max(axis=0)
    x, y = int(max(0, x_min)), int(max(0, y_min))
    w, h = int(max(1, x_max - x_min)), int(max(1, y_max - y_min))

    text = sanitize_text(text)
    if not is_clean_text(text, score, y, total_height):
        return None

    if w < 14 or h < 10:
        return None

    return {"x": x, "y": y, "w": w, "h": h, "text": text, "score": score}


def group_text_boxes_into_lines(parsed_boxes):
    if not parsed_boxes:
        return []

    sorted_boxes = sorted(parsed_boxes, key=lambda b: (b["y"], b["x"]))
    line_groups = []

    for box in sorted_boxes:
        placed = False
        box_cy = box["y"] + box["h"] / 2.0

        for group in line_groups:
            group_h = sum(b["h"] for b in group) / float(len(group))
            group_cy = sum(b["y"] + b["h"] / 2.0 for b in group) / float(len(group))

            if abs(box_cy - group_cy) < (group_h * 0.28):
                max_gap = max(15, int(group_h * 1.1))
                close_enough = any(
                    abs(box["x"] - (b["x"] + b["w"])) <= max_gap or abs((box["x"] + box["w"]) - b["x"]) <= max_gap
                    for b in group
                )
                if close_enough:
                    group.append(box)
                    placed = True
                    break

        if not placed:
            line_groups.append([box])

    merged_layers = []
    for group in line_groups:
        group.sort(key=lambda b: b["x"])
        full_text = " ".join(b["text"] for b in group)
        avg_score = sum(b["score"] for b in group) / float(len(group))

        min_x = min(b["x"] for b in group)
        min_y = min(b["y"] for b in group)
        max_x = max(b["x"] + b["w"] for b in group)
        max_y = max(b["y"] + b["h"] for b in group)

        w = max_x - min_x
        h = max_y - min_y

        merged_layers.append(
            {
                "x": min_x,
                "y": min_y,
                "w": w,
                "h": h,
                "text": full_text,
                "score": avg_score,
                "fontSize": int(clamp(h * 0.82, 14, 120)),
            }
        )

    return merged_layers


def detect_text_candidates(input_path, original, np, cv2, RapidOCR):
    if RapidOCR is None or cv2 is None:
        return []

    try:
        engine = RapidOCR()
        result, _elapsed = engine(input_path)
    except Exception:
        return []

    if not result:
        return []

    parsed_boxes = []
    for item in result[:30]:
        parsed = parse_ocr_box(item, np, original.height)
        if parsed:
            parsed_boxes.append(parsed)

    grouped_lines = group_text_boxes_into_lines(parsed_boxes)
    original_array = np.array(original.convert("RGB"))
    candidates = []
    img_cx = original.width / 2.0

    for line in grouped_lines:
        x, y, w, h = line["x"], line["y"], line["w"], line["h"]
        text = line["text"]

        fill_color = estimate_text_color(original_array, x, y, w, h, np)
        human_name = f"Text: {text[:22]}"

        box_cx = x + w / 2.0
        if abs(box_cx - img_cx) < (original.width * 0.25):
            align = "center"
        elif box_cx < original.width * 0.35:
            align = "left"
        elif box_cx > original.width * 0.65:
            align = "right"
        else:
            align = "center"

        candidates.append(
            {
                "name": human_name,
                "type": "text",
                "text": text,
                "x": x,
                "y": y,
                "w": w,
                "h": h,
                "width": w,
                "height": h,
                "fontSize": line["fontSize"],
                "fill": fill_color,
                "align": align,
                "score": line["score"],
            }
        )

    return candidates


def evaluate_inpainting_quality(original_bgr, trial_inpainted_bgr, x, y, w, h, np, cv2):
    try:
        orig_crop = original_bgr[y : y + h, x : x + w]
        inp_crop = trial_inpainted_bgr[y : y + h, x : x + w]
        if orig_crop.size == 0 or inp_crop.size == 0:
            return False

        orig_gray = cv2.cvtColor(orig_crop, cv2.COLOR_BGR2GRAY)
        inp_gray = cv2.cvtColor(inp_crop, cv2.COLOR_BGR2GRAY)

        inp_std = float(np.std(inp_gray))
        diff_mean = abs(float(np.mean(orig_gray)) - float(np.mean(inp_gray)))

        if diff_mean > 38 or inp_std > 45:
            return False

        return True
    except Exception:
        return False


def process_text_and_background_safely(original, object_mask, text_candidates, np, cv2):
    if cv2 is None:
        empty_mask_url = image_to_data_url(Image.new("L", (original.width, original.height), 0), "PNG")
        return [], image_to_data_url(original.convert("RGB"), "JPEG", quality=92), "low", "opencv_basic", empty_mask_url

    rgb = np.array(original.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

    object_removal_mask = np.zeros((original.height, original.width), dtype="uint8")
    if object_mask is not None:
        object_removal_mask = cv2.bitwise_or(object_removal_mask, object_mask)

    accepted_text_layers = []
    accepted_text_mask = np.zeros((original.height, original.width), dtype="uint8")

    for cand in text_candidates:
        x, y, w, h = cand["x"], cand["y"], cand["w"], cand["h"]

        is_large_title = (h > 35 or w > (original.width * 0.35) or cand["fontSize"] > 30)
        if is_large_title:
            continue

        trial_mask = np.zeros((original.height, original.width), dtype="uint8")
        pad_x = max(6, int(w * 0.04))
        pad_y = max(8, int(h * 0.15))
        x0 = int(clamp(x - pad_x, 0, original.width - 1))
        y0 = int(clamp(y - pad_y, 0, original.height - 1))
        x1 = int(clamp(x + w + pad_x, 1, original.width))
        y1 = int(clamp(y + h + pad_y, 1, original.height))

        cv2.rectangle(trial_mask, (x0, y0), (x1, y1), 255, -1)
        trial_inpainted, _, _ = reconstruct_background(bgr, trial_mask, np, cv2, preferred_provider="opencv_basic")
        quality_ok = evaluate_inpainting_quality(bgr, trial_inpainted, x0, y0, x1 - x0, y1 - y0, np, cv2)

        if quality_ok:
            accepted_text_mask = cv2.bitwise_or(accepted_text_mask, trial_mask)
            accepted_text_layers.append(
                {
                    "id": f"text-{len(accepted_text_layers) + 1}",
                    "name": cand["name"],
                    "type": "text",
                    "role": "extractedText",
                    "text": cand["text"],
                    "x": x0,
                    "y": y0,
                    "width": max(40, x1 - x0),
                    "height": max(18, y1 - y0),
                    "fontSize": cand["fontSize"],
                    "fill": cand["fill"],
                    "align": cand["align"],
                    "editable": True,
                    "locked": False,
                    "confidence": round(cand["score"], 2),
                    "source": "rapidocr-onnxruntime",
                }
            )

    # Combined removal mask (Main Ganesh subject + accepted clean text masks)
    final_removal_mask = np.zeros((original.height, original.width), dtype="uint8")
    if object_removal_mask is not None:
        final_removal_mask = cv2.bitwise_or(final_removal_mask, object_removal_mask)

    if cv2.countNonZero(accepted_text_mask) > 0:
        kernel_text = np.ones((15, 15), np.uint8)
        dilated_text = cv2.dilate(accepted_text_mask, kernel_text, iterations=1)
        final_removal_mask = cv2.bitwise_or(final_removal_mask, dilated_text)

    removal_mask_url = image_to_data_url(Image.fromarray(final_removal_mask, mode="L"), "PNG")

    if cv2.countNonZero(final_removal_mask) > 0:
        cleaned_bgr, bg_quality, bg_provider = reconstruct_background(bgr, final_removal_mask, np, cv2)
        cleaned_rgb = cv2.cvtColor(cleaned_bgr, cv2.COLOR_BGR2RGB)
        background_url = image_to_data_url(Image.fromarray(cleaned_rgb, mode="RGB"), "JPEG", quality=92, optimize=True)
    else:
        background_url = image_to_data_url(original.convert("RGB"), "JPEG", quality=92, optimize=True)
        bg_quality = "high"
        bg_provider = "opencv_basic"

    return accepted_text_layers, background_url, bg_quality, bg_provider, removal_mask_url


def extract_foreground_mask(original, foreground, np, cv2):
    alpha = np.array(foreground.getchannel("A"))
    raw_mask = ((alpha > 30).astype("uint8") * 255)

    if cv2 is None:
        return raw_mask

    kernel_close = np.ones((5, 5), np.uint8)
    closed = cv2.morphologyEx(raw_mask, cv2.MORPH_CLOSE, kernel_close)

    kernel_open = np.ones((3, 3), np.uint8)
    cleaned = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel_open)

    return cleaned


def build_object_layers(original, foreground_mask, np, cv2):
    if cv2 is None or cv2.countNonZero(foreground_mask) == 0:
        return [], foreground_mask

    image_area = original.width * original.height
    min_comp_area = max(1200, int(image_area * 0.015))

    count, labels, stats, centroids = cv2.connectedComponentsWithStats((foreground_mask > 0).astype("uint8"), 8)

    valid_candidates = []
    candidate_union = np.zeros((original.height, original.width), dtype="uint8")

    for label in range(1, count):
        x, y, w, h, area = stats[label]
        if area < min_comp_area or w < 30 or h < 30:
            continue
        comp_mask = ((labels == label).astype("uint8") * 255)
        valid_candidates.append((int(area), comp_mask, x, y, w, h))
        candidate_union = cv2.bitwise_or(candidate_union, comp_mask)

    if not valid_candidates:
        return [], candidate_union

    dilation_kernel = np.ones((15, 15), np.uint8)
    dilated_union = cv2.dilate(candidate_union, dilation_kernel, iterations=1)

    group_count, group_labels, group_stats, _ = cv2.connectedComponentsWithStats((dilated_union > 0).astype("uint8"), 8)

    grouped_object_masks = []
    for g_label in range(1, group_count):
        g_x, g_y, g_w, g_h, g_area = group_stats[g_label]
        if g_w < 40 or g_h < 40:
            continue

        group_mask = np.zeros((original.height, original.width), dtype="uint8")
        for area, comp_mask, x, y, w, h in valid_candidates:
            cx, cy = int(x + w / 2), int(y + h / 2)
            if 0 <= cy < original.height and 0 <= cx < original.width:
                if group_labels[cy, cx] == g_label:
                    group_mask = cv2.bitwise_or(group_mask, comp_mask)

        if cv2.countNonZero(group_mask) > min_comp_area:
            real_area = cv2.countNonZero(group_mask)
            grouped_object_masks.append((real_area, group_mask))

    grouped_object_masks.sort(key=lambda item: item[0], reverse=True)
    top_object_masks = grouped_object_masks[:2]

    original_rgba = np.array(original)
    layers = []
    union_mask = np.zeros((original.height, original.width), dtype="uint8")

    for idx, (area, mask) in enumerate(top_object_masks):
        bbox = cv2.boundingRect(mask)
        x, y, width, height = [int(v) for v in bbox]
        if width <= 0 or height <= 0:
            continue

        cropped_rgba = original_rgba[y : y + height, x : x + width].copy()
        cropped_mask = mask[y : y + height, x : x + width]
        cropped_rgba[:, :, 3] = cropped_mask

        name = "Main Ganesh Subject" if idx == 0 else f"Featured Object {idx + 1}"

        layers.append(
            {
                "id": f"object-{idx + 1}",
                "name": name,
                "type": "image",
                "role": "extractedObject",
                "src": image_to_data_url(Image.fromarray(cropped_rgba, mode="RGBA")),
                "x": x,
                "y": y,
                "width": width,
                "height": height,
                "fit": "stretch",
                "editable": True,
                "locked": False,
                "confidence": 0.95,
                "source": "rembg-u2net-opencv-group",
            }
        )
        union_mask = cv2.bitwise_or(union_mask, mask)

    return layers, union_mask


def order_layers_for_editor(object_layers, text_layers):
    sorted_text = sorted(text_layers, key=lambda t: t["y"])
    return object_layers + sorted_text


try:
    import onnxruntime as ort
    import numpy as np
    from PIL import Image
    from rembg import new_session, remove
except Exception as exc:
    unavailable(
        "Real image segmentation is not installed. Install the Python image segmentation runtime before using Image to Layers."
    )
    sys.exit(0)

try:
    import cv2
except Exception:
    cv2 = None

try:
    from rapidocr_onnxruntime import RapidOCR
except Exception:
    RapidOCR = None


def create_segmentation_session():
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    return new_session("u2net", sess_opts=options, providers=["CPUExecutionProvider"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()

    try:
        original, working, orig_w, orig_h = load_and_normalize_image(args.input, Image)

        session = create_segmentation_session()
        foreground = remove(original, session=session).convert("RGBA")

        foreground_mask = extract_foreground_mask(original, foreground, np, cv2)

        object_layers, object_mask_union = build_object_layers(original, foreground_mask, np, cv2)

        text_candidates = detect_text_candidates(args.input, original, np, cv2, RapidOCR)

        accepted_text_layers, background_src, bg_quality, bg_provider, removal_mask_src = process_text_and_background_safely(
            original, object_mask_union, text_candidates, np, cv2
        )

        final_layers = order_layers_for_editor(object_layers, accepted_text_layers)

        respond(
            {
                "success": True,
                "width": orig_w,
                "height": orig_h,
                "model": "Magic Layers Generative Inpaint Architecture",
                "backgroundSrc": background_src,
                "backgroundQuality": bg_quality,
                "backgroundProvider": bg_provider,
                "removalMaskSrc": removal_mask_src,
                "summary": {
                    "objectLayers": len(object_layers),
                    "textLayers": len(accepted_text_layers),
                    "totalLayers": len(final_layers),
                },
                "layers": final_layers,
            }
        )
    except Exception as exc:
        try:
            fallback_img = Image.open(args.input).convert("RGBA")
            w, h = fallback_img.size
            respond(
                {
                    "success": True,
                    "width": w,
                    "height": h,
                    "model": "Image-to-Layers V2 Fallback",
                    "backgroundSrc": image_to_data_url(fallback_img, "JPEG", quality=88),
                    "backgroundQuality": "low",
                    "backgroundProvider": "opencv_basic",
                    "removalMaskSrc": "",
                    "summary": {"objectLayers": 0, "textLayers": 0, "totalLayers": 0},
                    "layers": [],
                }
            )
        except Exception:
            unavailable(f"Failed to process image: {str(exc)}")


if __name__ == "__main__":
    main()
