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

// ─── Save URL as background ───────────────────────────────────────────────────

document.querySelector("#save-image").addEventListener("click", () => {
  const imageUrlValue = imageUrlInput.value.trim();
  if (!imageUrlValue) {
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML = "Please enter a valid URL.";
    return;
  }
  processingBg.className = "notification is-success";
  processingBg.innerHTML = "Background saved, please wait a moment..";
  localStorage.setItem("image_url", imageUrlValue);
  localStorage.removeItem("imageupload");
  background_body.style.backgroundImage = `url(${imageUrlValue})`;
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
    document.querySelector("#copy-backgroundurl").style.display = "none";
    processingBg.className = "notification is-success";
    processingBg.innerHTML =
      "Background image has been removed, please reload the page to see this change in effect...";
  }
});

// ─── Random background from Picsum ───────────────────────────────────────────

const randomPicsumBtn = document.querySelector("#random_unsplash_bg");

randomPicsumBtn.addEventListener("click", async () => {
  const originalBtnText = randomPicsumBtn.textContent;

  // FIX: Disable the button to prevent concurrent fetches from rapid clicks
  randomPicsumBtn.disabled = true;
  randomPicsumBtn.classList.add("is-loading");
  processingBg.className = "notification is-info";
  processingBg.innerHTML =
    "Fetching a random background from <a href='https://picsum.photos/' target='_blank' rel='noopener noreferrer'>Picsum photos</a>...";

  const width = 5000;
  const height = 3333;

  try {
    const apiUrl = `https://picsum.photos/${width}/${height}`;
    const response = await fetch(apiUrl);
    const imageUrl = response.url;
    localStorage.setItem("image_url", imageUrl);
    localStorage.removeItem("imageupload");
    background_body.style.backgroundImage = `url(${imageUrl})`;
    processingBg.className = "notification is-success";
    processingBg.innerHTML =
      "Random background has been applied successfully. It may take a few seconds to appear.";
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

// ─── Auto-switch background ───────────────────────────────────────────────────

const autoSwitchSelect = document.querySelector("#auto_switch_interval");

const AUTO_SWITCH_INTERVALS = {
  hourly: 3600000,
  daily: 86400000,
  weekly: 604800000,
};

autoSwitchSelect.addEventListener("change", () => {
  const selectedInterval = autoSwitchSelect.value;
  localStorage.setItem("auto_switch_interval", selectedInterval);
  setupAutoSwitch(selectedInterval);
});

function shouldAutoSwitch(interval) {
  const last = parseInt(localStorage.getItem("last_auto_switch") || "0", 10);
  const ms = AUTO_SWITCH_INTERVALS[interval];
  return ms !== undefined && Date.now() - last > ms;
}

function setupAutoSwitch(interval) {
  clearInterval(window.autoSwitchTimer);

  if (!(interval in AUTO_SWITCH_INTERVALS)) return;
  window.autoSwitchTimer = setInterval(() => {
    if (shouldAutoSwitch(interval)) {
      document.querySelector("#random_unsplash_bg").click();
      localStorage.setItem("last_auto_switch", Date.now().toString());
    }
  }, 60000);
}

const savedInterval = localStorage.getItem("auto_switch_interval");

if (savedInterval && savedInterval !== "none") {
  autoSwitchSelect.value = savedInterval;
  if (shouldAutoSwitch(savedInterval)) {
    document.querySelector("#random_unsplash_bg").click();
    localStorage.setItem("last_auto_switch", Date.now().toString());
  }

  setupAutoSwitch(savedInterval);
} else {
  autoSwitchSelect.value = "none";
}
