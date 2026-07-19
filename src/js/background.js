//     __                  __                                          __      _
//    / /_   ____ _ _____ / /__ ____ _ _____ ____   __  __ ____   ____/ /     (_)_____
//   / __ \ / __ `// ___// //_// __ `// ___// __ \ / / / // __ \ / __  /     / // ___/
//  / /_/ // /_/ // /__ / ,<  / /_/ // /   / /_/ // /_/ // / / // /_/ /_    / /(__  )
// /_.___/ \__,_/ \___//_/|_| \__, //_/    \____/ \__,_//_/ /_/ \__,_/(_)__/ //____/
//                           /____/                                     /___/
//

const imageUrlInput = document.querySelector("#image_url");
const processingBg = document.querySelector(".processing_bg");
const background_body = document.querySelector("body");
const inputFile = document.getElementById("imageupload");
const copyBgUrlBtn = document.querySelector("#copy-backgroundurl");

// ─── Shared IndexedDB helper ───────────────────────────────────────────────
window.idb = {
  _dbPromise: null,
  open() {
    if (!this._dbPromise) {
      this._dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open("startpager", 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains("images")) {
            req.result.createObjectStore("images");
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this._dbPromise;
  },
  async set(key, value) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      tx.objectStore("images").put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },
  async get(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("images", "readonly");
      const req = tx.objectStore("images").get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },
  async delete(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      tx.objectStore("images").delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },
};

/**
 * Computes a saturated/lightened accent color from a canvas's pixel data.
 * Runs once at save time. time.js just reads the cached result afterwards.
 */
function computeColorPalette(sourceCanvas, width, height) {
  const cropSize = Math.min(width, height) * 0.4;
  const sx = (width - cropSize) * 0.5;
  const sy = (height - cropSize) * 0.5;

  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 16;
  sampleCanvas.height = 16;
  const sampleCtx = sampleCanvas.getContext("2d");
  sampleCtx.drawImage(sourceCanvas, sx, sy, cropSize, cropSize, 0, 0, 16, 16);

  const data = sampleCtx.getImageData(0, 0, 16, 16).data;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const mid = (max + min) * 0.5;
  const satBoost = 1.8;
  r = Math.min(255, Math.round(mid + (r - mid) * satBoost));
  g = Math.min(255, Math.round(mid + (g - mid) * satBoost));
  b = Math.min(255, Math.round(mid + (b - mid) * satBoost));

  const lightenFactor = 0.6;
  const textR = Math.min(255, Math.round(r + (255 - r) * lightenFactor));
  const textG = Math.min(255, Math.round(g + (255 - g) * lightenFactor));
  const textB = Math.min(255, Math.round(b + (255 - b) * lightenFactor));

  return {
    textColor: `rgb(${textR}, ${textG}, ${textB})`,
    light: `rgb(${Math.min(255, Math.round(textR + (255 - textR) * 0.85))}, ${Math.min(255, Math.round(textG + (255 - textG) * 0.85))}, ${Math.min(255, Math.round(textB + (255 - textB) * 0.85))})`,
    dark: `rgb(${Math.round(textR * 0.7)}, ${Math.round(textG * 0.7)}, ${Math.round(textB * 0.7)})`,
  };
}

function savePaletteAndApply(palette) {
  localStorage.setItem("bgPalette", JSON.stringify(palette));
  if (localStorage.getItem("dynamic-color") === "true" && typeof window.applyStoredPalette === "function") {
    window.applyStoredPalette(palette);
  }
}

/**
 * Loads an image (from a URL string or a File/Blob from an <input>),
 * downsizes it onto a canvas, stores the result in IndexedDB, computes the
 * accent color once, and applies it all as the new background.
 */
function processImageSource(source, successMessage) {
  const img = new Image();
  const isRemoteUrl = typeof source === "string";
  if (isRemoteUrl) img.crossOrigin = "Anonymous";

  const tempObjectUrl = source instanceof Blob ? URL.createObjectURL(source) : null;

  img.onload = function () {
    const canvas = document.createElement("canvas");
    let width = this.naturalWidth;
    let height = this.naturalHeight;

    // Cap huge textures down (e.g. 5K -> ~2.5K) to keep decode/compress fast
    // and file size well under IndexedDB/quota concerns.
    const maxDimension = 2560;
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(this, 0, 0, width, height);

    const palette = computeColorPalette(canvas, width, height);

    // toBlob is non-blocking, unlike toDataURL
    canvas.toBlob(async (blob) => {
      if (tempObjectUrl) URL.revokeObjectURL(tempObjectUrl);

      if (!blob) {
        fallbackToUrl(isRemoteUrl ? source : "");
        return;
      }

      try {
        await window.idb.set("background", blob);
        localStorage.removeItem("image_url");
        const blobUrl = URL.createObjectURL(blob);
        background_body.style.backgroundImage = `url(${blobUrl})`;
        savePaletteAndApply(palette);
        processingBg.className = "notification is-success";
        processingBg.innerHTML = successMessage;
      } catch (e) {
        // IndexedDB unavailable/full — fall back to a live network link
        // (only meaningful for remote URLs; uploaded files can't fall back)
        processingBg.className = "notification is-warning";
        processingBg.innerHTML = isRemoteUrl
          ? "Could not save image locally. Using a live network link instead."
          : "Could not save this image locally. Please try a smaller file.";
        if (isRemoteUrl) fallbackToUrl(source);
        savePaletteAndApply(palette);
      }
    }, "image/jpeg", 0.82); // 0.82 sweet spot compression for background photography
  };

  img.onerror = function () {
    if (tempObjectUrl) URL.revokeObjectURL(tempObjectUrl);
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML = "Failed to load the image. Please ensure it is a valid file or link.";
  };

  img.src = tempObjectUrl || source;
}

function fallbackToUrl(url) {
  localStorage.setItem("image_url", url);
  window.idb.delete("background").catch(() => {});
  background_body.style.backgroundImage = `url(${url})`;
}

// ─── Save URL as background ───────────────────────────────────────────────────

document.querySelector("#save-image").addEventListener("click", () => {
  const imageUrlValue = imageUrlInput.value.trim();
  if (!imageUrlValue) {
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML = "Please enter a valid URL.";
    return;
  }
  processingBg.className = "notification is-info";
  processingBg.innerHTML = "Processing and caching background, please wait...";
  processImageSource(imageUrlValue, "Background saved locally for instant loading!");
});

// ─── Upload image and set as background ──────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

inputFile.addEventListener("change", (event) => {
  const image = event.target.files?.[0];
  if (!image) return;
  if (!ALLOWED_TYPES.includes(image.type)) {
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML = "Please upload a valid image file (JPG, PNG, WebP, or GIF).";
    return;
  }

  if (image.size / 1024 / 1024 >= 4) {
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML = "The selected image exceeds the 4MB size-limit, please choose a smaller image.";
    return;
  }

  processingBg.className = "notification is-info";
  processingBg.innerHTML = "Processing image, please wait a moment...";
  processImageSource(image, "Image uploaded and background updated!");
});

// ─── Set background from IndexedDB (fallback: localStorage URL) on load ──────

(async function initBackground() {
  try {
    const blob = await window.idb.get("background");
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      background_body.style.backgroundImage = `url(${blobUrl})`;
      return;
    }
  } catch (e) {
    // IndexedDB unavailable or empty — fall through to the URL fallback
  }
  const savedImageUrl = localStorage.getItem("image_url");
  if (savedImageUrl) {
    background_body.style.backgroundImage = `url(${savedImageUrl})`;
  }
})();

// ─── Delete background ───────────────────────────────────────────────────────

document.querySelector("#delete_custom_image").addEventListener("click", async () => {
  const hasUrl = !!localStorage.getItem("image_url");
  let hasBlob = false;
  try {
    hasBlob = !!(await window.idb.get("background"));
  } catch (e) {
    // ignore
  }

  if (!hasUrl && !hasBlob) {
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML = "No custom background found to delete.";
    return;
  }

  if (
    confirm(
      "Are you sure you want to remove the current background image? This action cannot be undone.",
    )
  ) {
    localStorage.removeItem("image_url");
    localStorage.removeItem("bgPalette");
    try {
      await window.idb.delete("background");
    } catch (e) {
      // ignore
    }
    background_body.style.backgroundImage = "";
    imageUrlInput.style.width = "100%";
    if (copyBgUrlBtn) copyBgUrlBtn.style.display = "none";
    processingBg.className = "notification is-success";
    processingBg.innerHTML =
      "Background image has been removed, please reload the page to see this change in effect...";
  }
});

// ─── Random background from Picsum ───────────────────────────────────────────

const randomPicsumBtn = document.querySelector("#random_unsplash_bg");

randomPicsumBtn.addEventListener("click", async () => {
  const originalBtnText = randomPicsumBtn.textContent;

  randomPicsumBtn.disabled = true;
  randomPicsumBtn.classList.add("is-loading");
  processingBg.className = "notification is-info";
  processingBg.innerHTML =
    "Fetching a random background from <a href='https://picsum.photos/' target='_blank' rel='noopener noreferrer'>Picsum photos</a>...";

  const width = 2560;
  const height = 1440;

  try {
    const apiUrl = `https://picsum.photos/${width}/${height}`;
    const response = await fetch(apiUrl);

    if (!response.ok) throw new Error("Network request failed");

    const imageUrl = response.url;
    processImageSource(imageUrl, "Background updated successfully and cached locally.");
  } catch (error) {
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML =
      "Failed to fetch a random background. Please reload the page and try again.";
  } finally {
    randomPicsumBtn.classList.remove("is-loading");
    randomPicsumBtn.textContent = originalBtnText;
    randomPicsumBtn.disabled = false;
  }
});