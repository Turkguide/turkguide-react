import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "../constants";

const IG_W = 1080;
const IG_H = 1350;
const MAX_VIDEO_SECONDS = 60;
const MAX_VIDEO_DIM = 2048; // 2K max dimension

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

export async function normalizeImageToFotograf(file) {
  if (!file) throw new Error("Dosya seçilmedi");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Fotoğraf çok büyük. (max ~8MB)");

  const dataUrl = await fileToDataURL(file);

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Fotoğraf yüklenemedi"));
    i.src = dataUrl;
  });

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) throw new Error("Fotoğraf boyutu okunamadı");

  // Cover-crop to 4:5 (Fotograf feed)
  const targetRatio = IG_W / IG_H;
  const srcRatio = srcW / srcH;

  let sx = 0, sy = 0, sw = srcW, sh = srcH;
  if (srcRatio > targetRatio) {
    // wider -> crop left/right
    sh = srcH;
    sw = Math.round(sh * targetRatio);
    sx = Math.round((srcW - sw) / 2);
  } else {
    // taller -> crop top/bottom
    sw = srcW;
    sh = Math.round(sw / targetRatio);
    sy = Math.round((srcH - sh) / 2);
  }

  const canvas = document.createElement("canvas");
  canvas.width = IG_W;
  canvas.height = IG_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas desteklenmiyor");

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, IG_W, IG_H);

  // jpeg export
  const out = canvas.toDataURL("image/jpeg", 0.9);

  return {
    kind: "image",
    src: out,
    width: IG_W,
    height: IG_H,
    mime: "image/jpeg",
    originalName: file.name,
  };
}

export async function validateAndLoadVideo(file) {
  if (!file) throw new Error("Dosya seçilmedi");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("Video çok büyük. (max ~12MB)");

  const dataUrl = await fileToDataURL(file);

  const meta = await new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.onloadedmetadata = () => {
      resolve({
        w: v.videoWidth || 0,
        h: v.videoHeight || 0,
        d: v.duration || 0,
      });
    };
    v.onerror = () => reject(new Error("Video metadata okunamadı"));
    v.src = dataUrl;
  });

  if (meta.d > MAX_VIDEO_SECONDS + 0.01) {
    throw new Error("Video 1 dakikadan uzun olamaz (max 60 saniye).");
  }

  const maxDim = Math.max(meta.w || 0, meta.h || 0);
  if (maxDim > MAX_VIDEO_DIM) {
    throw new Error("Video çözünürlüğü çok yüksek. 2K'ya kadar (max 2048px).");
  }

  return {
    kind: "video",
    src: dataUrl,
    width: meta.w,
    height: meta.h,
    duration: meta.d,
    mime: file.type || "video/mp4",
    originalName: file.name,
  };
}
