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

// Upload Image and Set as Background
inputFile.addEventListener("change", (event) => {
  const image = event.target.files[0];

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

// Set Background from LocalStorage
const savedImageUpload = localStorage.getItem("imageupload");
const savedImageUrl = localStorage.getItem("image_url");

if (savedImageUpload) {
  background_body.style.backgroundImage = `url(${savedImageUpload})`;
} else if (savedImageUrl) {
  background_body.style.backgroundImage = `url(${savedImageUrl})`;
}

// Delete Background
document.querySelector("#delete_custom_image").addEventListener("click", () => {
  if (!savedImageUpload && !savedImageUrl) {
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

const randomPicsumBtn = document.querySelector("#random_unsplash_bg");

randomPicsumBtn.addEventListener("click", async () => {
  const originalBtnText = randomPicsumBtn.textContent;
  processingBg.className = "notification is-info";
  randomPicsumBtn.classList.add("is-loading");
  processingBg.innerHTML =
    "Fetching a random background from <a href='https://picsum.photos/' target='_blank' rel='noopener noreferrer'>Picsum photos</a>...";

  // Use the highest available resolution from Picsum (5000x3333) to get much better images
  const width = 5000;
  const height = 3333;

  try {
    const apiUrl = `https://picsum.photos/${width}/${height}`;
    const response = await fetch(apiUrl);
    const imageUrl = response.url;

    setTimeout(() => {
      localStorage.setItem("image_url", imageUrl);
      localStorage.removeItem("imageupload");
      background_body.style.backgroundImage = `url(${imageUrl})`;
      processingBg.className = "notification is-success";
      processingBg.innerHTML =
        "Random background has been applied successfully. It may take a few seconds to appear.";
      randomPicsumBtn.classList.remove("is-loading");
      randomPicsumBtn.textContent = originalBtnText;
    }, 1000);
  } catch (error) {
    processingBg.className = "notification is-danger is-light";
    processingBg.innerHTML =
      "Failed to fetch a random background. Please reload the page and try again.";
    randomPicsumBtn.textContent = originalBtnText;
  }
});

// automatically switch background hourly, daily, or weekly based on user preference keep in mind that the button is stored in a sidebar thats closed by default.
const autoSwitchSelect = document.querySelector("#auto_switch_interval");

autoSwitchSelect.addEventListener("change", () => {
  const selectedInterval = autoSwitchSelect.value;
  localStorage.setItem("auto_switch_interval", selectedInterval);
  setupAutoSwitch(selectedInterval);
});

function setupAutoSwitch(interval) {
  clearInterval(window.autoSwitchTimer);

  if (interval === "hourly") {
    window.autoSwitchTimer = setInterval(() => {
      document.querySelector("#random_unsplash_bg").click();
    }, 3600000);
  } else if (interval === "daily") {
    window.autoSwitchTimer = setInterval(() => {
      document.querySelector("#random_unsplash_bg").click();
    }, 86400000);
  } else if (interval === "weekly") {
    window.autoSwitchTimer = setInterval(() => {
      document.querySelector("#random_unsplash_bg").click();
    }, 604800000);
  }
}

// Initialize auto-switching based on saved preference
const savedInterval = localStorage.getItem("auto_switch_interval");
if (savedInterval) {
  autoSwitchSelect.value = savedInterval;
  setupAutoSwitch(savedInterval);
} else {
  autoSwitchSelect.value = "none";
}
