//     __                  __                                          __      _
//    / /_   ____ _ _____ / /__ ____ _ _____ ____   __  __ ____   ____/ /     (_)_____
//   / __ \ / __ `// ___// //_// __ `// ___// __ \ / / / // __ \ / __  /     / // ___/
//  / /_/ // /_/ // /__ / ,<  / /_/ // /   / /_/ // /_/ // / / // /_/ /_    / /(__  )
// /_.___/ \__,_/ \___//_/|_| \__, //_/    \____/ \__,_//_/ /_/ \__,_/(_)__/ //____/
//                           /____/                                     /___/

const imageUrlInput = document.querySelector("#image_url");
const processingBg = document.querySelector(".processing_bg");
const background_body = document.querySelector("body");
const inputFile = document.getElementById("imageupload");
const copyBgUrlBtn = document.querySelector("#copy-backgroundurl"); // Cached for performance

/**
 * Helper to fetch a URL, convert it to a Base64 DataURL, and store it.
 * Highly optimized using canvas blobs and dynamic downscaling to preserve localStorage quotas.
 */
function convertUrlToBase64AndSave(url, successMessage) {
  const img = new Image();
  img.crossOrigin = "Anonymous"; 
  
  img.onload = function () {
    const canvas = document.createElement("canvas");
    let width = this.naturalWidth;
    let height = this.naturalHeight;
    
    // Performance Optimization: Caps massive textures (e.g. 5K down to 2K display grade)
    // This reduces processing latency, saves CPU time, and keeps the file size safely under 5MB.
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
    
    // Performance Optimization: canvas.toBlob is non-blocking, unlike canvas.toDataURL
    canvas.toBlob((blob) => {
      if (!blob) {
        fallbackToUrl(url);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = function () {
        try {
          localStorage.setItem("imageupload", reader.result);
          localStorage.removeItem("image_url");
          background_body.style.backgroundImage = `url(${reader.result})`;
          processingBg.className = "notification is-success";
          processingBg.innerHTML = successMessage;
        } catch (e) {
          // LocalStorage full handler
          processingBg.className = "notification is-warning";
          processingBg.innerHTML = "Image size too large for browser storage. Saving fallback live network link.";
          fallbackToUrl(url);
        }
      };
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.82); // 0.82 sweet spot compression for background photography
  };
  
  img.onerror = function () {
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML = "Failed to load the image URL. Please ensure it is a valid link.";
  };
  img.src = url;
}

function fallbackToUrl(url) {
  localStorage.setItem("image_url", url);
  localStorage.removeItem("imageupload");
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
  convertUrlToBase64AndSave(imageUrlValue, "Background saved locally for instant loading!");
});

// ─── Upload image and set as background ──────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

inputFile.addEventListener("change", (event) => {
  const image = event.target.files?.[0];
  if (!image) return;
  if (!ALLOWED_TYPES.includes(image.type)) {
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML =
      "Please upload a valid image file (JPG, PNG, WebP, or GIF).";
    return;
  }

  if (image.size / 1024 / 1024 >= 4) {
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML =
      "The selected image exceeds the 4MB size-limit, please choose a smaller image.";
    return;
  }

  processingBg.className = "notification is-success";
  processingBg.innerHTML = "Image uploaded, please wait a moment..";
  localStorage.removeItem("image_url");

  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem("imageupload", reader.result);
    background_body.style.backgroundImage = `url(${reader.result})`;
  };
  reader.readAsDataURL(image);
});

// ─── Set background from localStorage on load ────────────────────────────────

const savedImageUpload = localStorage.getItem("imageupload");
const savedImageUrl = localStorage.getItem("image_url");

if (savedImageUpload) {
  background_body.style.backgroundImage = `url(${savedImageUpload})`;
} else if (savedImageUrl) {
  background_body.style.backgroundImage = `url(${savedImageUrl})`;
}

// ─── Delete background ───────────────────────────────────────────────────────

document.querySelector("#delete_custom_image").addEventListener("click", () => {
  if (
    !localStorage.getItem("imageupload") &&
    !localStorage.getItem("image_url")
  ) {
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
    localStorage.removeItem("imageupload");
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

  // Optimized base canvas resolution query to fit standard 16:9 configurations cleanly
  const width = 2560;
  const height = 1440;

  try {
    const apiUrl = `https://picsum.photos/${width}/${height}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) throw new Error("Network request failed");
    
    const imageUrl = response.url;
    convertUrlToBase64AndSave(imageUrl, "Background updated successfully and cached locally.");
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