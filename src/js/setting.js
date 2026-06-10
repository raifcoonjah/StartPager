//    _____      __  __  _                      _
//   / ___/___  / /_/ /_(_)___  ____ ______    (_)____
//   \__ \/ _ \/ __/ __/ / __ \/ __ `/ ___/   / / ___/
//  ___/ /  __/ /_/ /_/ / / / / /_/ (__  )   / (__  )
// /____/\___/\__/\__/_/_/ /_/\__, /____(_)_/ /____/
//                           /____/      /___/

document.getElementById("reset_button").addEventListener("click", function () {
  document.querySelector(".sidebar").classList.remove("open");
  let modal = document.getElementById("reset-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal is-active";
    modal.id = "reset-modal";
    modal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <h4 class="title is-4">Reset All Data</h4>
          <p>Are you sure you want to reset all your data? This action cannot be undone.</p>
          <br>
          <div class="buttons is-right">
            <button class="button is-danger is-outlined" id="confirm-reset">Yes, I'm sure</button>
            <button class="button" id="cancel-reset">Cancel</button>
          </div>
        </div>
      </div>
      <button class="modal-close is-large" aria-label="close"></button>
    `;
    document.body.appendChild(modal);

    modal
      .querySelector("#confirm-reset")
      .addEventListener("click", function () {
        const confirmBtn = modal.querySelector("#confirm-reset");
        confirmBtn.classList.add("is-loading");
        confirmBtn.disabled = true;
        // Keep sidebar open, do not close modal
        localStorage.clear();
        setTimeout(() => location.reload(), 3000);
      });

    ["#cancel-reset", ".modal-close", ".modal-background"].forEach((sel) => {
      modal.querySelector(sel).addEventListener("click", function () {
        modal.classList.remove("is-active");
      });
    });
  } else {
    modal.classList.add("is-active");
  }
});

const openBtn = document.getElementById("open_settings");
const sidebar = document.querySelector(".sidebar");

openBtn.addEventListener("click", function () {
  sidebar.classList.toggle("open");
  openBtn.classList.toggle("is-hidden");
});

document.getElementById("close_sidebar").addEventListener("click", function () {
  sidebar.classList.remove("open");
  openBtn.classList.remove("is-hidden");
});

document.addEventListener("click", function (event) {
  if (!sidebar.contains(event.target) && !openBtn.contains(event.target)) {
    sidebar.classList.remove("open");
    openBtn.classList.remove("is-hidden");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  if (!localStorage.getItem("welcomeShown")) {
    // 1. Add Custom CSS for Animations
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fadeInScale {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes backdropBlur {
        from { backdrop-filter: blur(0px); background: rgba(0,0,0,0); }
        to { backdrop-filter: blur(4px); background: rgba(10, 10, 10, 0.86); }
      }
      .modal-content { animation: fadeInScale 0.4s ease-out; }
      .modal-background { animation: backdropBlur 0.5s forwards; }
      .modal-page { animation: fadeInScale 0.3s ease-out; }
      .box { border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
      code { background-color: #f5f5f5; color: #d63384; padding: 0.2rem 0.4rem; border-radius: 4px; }
    `;
    document.head.appendChild(style);

    // 2. Create Modal Structure
    const modal = document.createElement("div");
    modal.className = "modal is-active";
    modal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <div class="is-flex is-justify-content-space-between is-align-items-center mb-4">
            <h6 class="title is-6 has-text-grey-light">Start Pager // Welcome</h6>
            <span class="tag is-info is-light">v8.0</span>
          </div>
          <div id="modal-pages">
            <div id="page1" class="modal-page">
              <h3 class="title is-3">Hey there! 👋</h3>
              <p>StartPager is a free and open-source startpage, designed to be <strong>minimal and super fast</strong>, with a focus on keyboard navigation.</p>
              <br/>
              <div class="buttons is-right">
                <button class="button is-link is-rounded" data-page="page2" style="background: linear-gradient(90deg, hsla(358, 85%, 68%, 1) 0%, hsla(41, 98%, 49%, 1) 100%); font-weight:800;">Let's roll &rarr;</button>
              </div>
            </div>
            <div id="page2" class="modal-page" style="display: none;">
              <h3 class="title is-3">What's new since saturn startpage?</h3>
              <p>StartPager is a fresh start, quite different if you are coming from Saturn. I truly hope you'll give it a try and experience the improvements firsthand before considering the older, unmaintained version.</p>
              <br/>
              <p class="mb-4">Transitioning from Saturn? Here is why I rebuilt it:</p>
              <div class="content is-small">
                <ul>
                  <li><strong>Modern Core:</strong> Now powered by Bulma.css for better stability and much more modern look.</li>
                  <li><strong>KISS Metholody:</strong> Built around the KISS principle, simple and distraction-free.</li>
                  <li><strong>Performance:</strong> Faster load times and cleaner code. 100% free of jquery ;)</li>
                </ul>
              </div>
              <div class="buttons is-centered">
                <button class="button is-text" data-page="page1">Back</button>
                <button class="button is-link is-rounded" data-page="page3">Next</button>
              </div>
            </div>
            <div id="page3" class="modal-page" style="display: none;">
              <h3 class="title is-3">Shortcuts</h3>
              <p>StartPager is built for <strong>keyboard-first</strong> workflows.</p>
              <hr/>
              <div class="notification">
                <p>To open Settings: <code>Shift</code> + <code>S</code></p>
              </div>
              <p class="is-size-7 has-text-centered">More shortcuts are available in the settings sidebar.</p>
              <br/>
              <div class="buttons is-centered">
                <button class="button is-text" data-page="page2">Back</button>
                <button class="button is-link is-rounded" data-page="page4">Almost there...</button>
              </div>
            </div>
            <div id="page4" class="modal-page" style="display: none;">
              <h3 class="title is-3">It's lights out and away we go</h3>
              <p>Thank you for choosing Start Pager. Enjoy your new workspace.</p>
              <br/>
              <div class="field is-grouped is-grouped-centered">
                <p class="control">
                  <button class="button is-primary" id="close_welcome_modal">Get Started!</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button class="modal-close is-large" aria-label="close"></button>
    `;
    document.body.appendChild(modal);

    // 3. Logic for Animated Page Switching
    document.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", function () {
        const targetPageId = this.getAttribute("data-page");
        const allPages = document.querySelectorAll(".modal-page");
        const targetPage = document.getElementById(targetPageId);

        allPages.forEach((page) => {
          page.style.display = "none";
        });

        targetPage.style.display = "block";
      });
    });

    // 4. Close Handlers
    const closeModal = () => {
      modal.classList.remove("is-active");
      localStorage.setItem("welcomeShown", "true");
      // Optional: remove from DOM after fade out
      setTimeout(() => modal.remove(), 500);
    };

    document
      .getElementById("close_welcome_modal")
      .addEventListener("click", closeModal);
    document
      .querySelector(".modal-close")
      .addEventListener("click", closeModal);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const isWhite = localStorage.getItem("whiteFontColor") === "true";
  document.getElementById("toggle-white-font").checked = isWhite;
  applyWhiteFontColor(isWhite);
});

const timeFontSizeInput = document.getElementById("time-font-size");
const timeFontSizeValue = document.getElementById("time-font-size-value");

timeFontSizeInput.addEventListener("input", function () {
  const fontSize = this.value + "px";
  timeFontSizeValue.textContent = fontSize;
  localStorage.setItem("timeFontSize", fontSize);
  applyTimeFontSize(fontSize);
});

function applyTimeFontSize(size) {
  const timeElement = document.getElementById("time");
  if (timeElement) {
    timeElement.style.fontSize = size;
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const savedSize = localStorage.getItem("timeFontSize") || "96px";
  timeFontSizeInput.value = parseInt(savedSize, 10);
  timeFontSizeValue.textContent = savedSize;
  applyTimeFontSize(savedSize);
});

document
  .getElementById("toggle-time-font-style")
  .addEventListener("change", function () {
    const isChecked = this.checked;
    localStorage.setItem("timeFontStyleItalicVintage", isChecked);
    applyTimeFontStyle(isChecked);
  });

function applyTimeFontStyle(isItalicVintage) {
  const timeElement = document.getElementById("time");
  if (timeElement) {
    if (isItalicVintage) {
      timeElement.style.fontFamily =
        "'Playfair Display', 'Baskerville', 'Garamond', serif";
      timeElement.style.fontWeight = "900";
    } else {
      timeElement.style.fontStyle = "";
      timeElement.style.fontFamily = "";
      timeElement.style.fontWeight = "";
    }
  }
}
// save to localstorage
document.addEventListener("DOMContentLoaded", function () {
  const isItalicVintage =
    localStorage.getItem("timeFontStyleItalicVintage") === "true";
  document.getElementById("toggle-time-font-style").checked = isItalicVintage;
  applyTimeFontStyle(isItalicVintage);
});

const nightDarkenToggle = document.getElementById("toggle-darken-bg-night");

function applyManualDarken() {
  // Enabled by default: if the key doesn't exist in localStorage, treat it as true so its enable by defaut. 
  const isEnabled = localStorage.getItem("darkenBgAtNight") !== "false";
  const body = document.body;

  if (isEnabled) {
    body.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // 50% darkness
    body.style.backgroundBlendMode = "darken";
  } else {
    body.style.backgroundColor = "transparent";
    body.style.backgroundBlendMode = "normal";
  }
}

if (nightDarkenToggle) {
  nightDarkenToggle.addEventListener("change", function () {
    localStorage.setItem("darkenBgAtNight", this.checked);
    applyManualDarken();
  });
}

// 2. Initialization on Load
document.addEventListener("DOMContentLoaded", function () {
  const savedState = localStorage.getItem("darkenBgAtNight") !== "false";

  if (nightDarkenToggle) {
    nightDarkenToggle.checked = savedState;
  }

  applyManualDarken();
});

//   ____             _                   _____ _             _
//  |  _ \           | |                 / ____| |           | |
//  | |_) | __ _  ___| | ___   _ _ __   | (___ | |_ __ _ _ __| |_ _ __   __ _  __ _  ___ _ __
//  |  _ < / _` |/ __| |/ / | | | '_ \   \___ \| __/ _` | '__| __| '_ \ / _` |/ _` |/ _ \ '__|
//  | |_) | (_| | (__|   <| |_| | |_) |  ____) | || (_| | |  | |_| |_) | (_| | (_| |  __/ |
//  |____/ \__,_|\___|_|\_\\__,_| .__/  |_____/ \__\__,_|_|   \__| .__/ \__,_|\__, |\___|_|
//                              | |                              | |           __/ |
//                              |_|                              |_|          |___/
function showNotification(message, type = "is-primary") {
  document.querySelectorAll(".custom-notification").forEach((n) => n.remove());
  const notif = Object.assign(document.createElement("div"), {
    className: `notification custom-notification ${type}`,
    innerText: message,
  });
  Object.assign(notif.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "1000",
    minWidth: "200px",
  });
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 1800);
}

// Backup all localStorage to JSON file
function backupLocalStorage() {
  try {
    const backup = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      backup[key] = localStorage.getItem(key);
    }

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `StartPager-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification("Backup created successfully!", "is-success is-light");
  } catch (error) {
    console.error("Backup failed:", error);
    showNotification("Backup failed. Please try again.", "is-danger is-light");
  }
}

// Restore localStorage from JSON file
function restoreLocalStorage(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const backup = JSON.parse(e.target.result);

      // Clear existing localStorage
      localStorage.clear();

      // Restore all values
      for (const [key, value] of Object.entries(backup)) {
        localStorage.setItem(key, value);
      }

      showNotification(
        "Welcome back! Data restored successfully! Refreshing page..",
        "is-success is-light",
      );

      // Refresh page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Restore failed:", error);
      showNotification(
        "Invalid backup file. Please select a valid JSON backup.",
        "is-danger is-light",
      );
    }
  };
  reader.onerror = function () {
    showNotification(
      "Failed to read file. Please try again.",
      "is-danger is-light",
    );
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", function () {
  // Backup button
  const backupBtn = document.getElementById("backup_button");
  if (backupBtn) {
    backupBtn.addEventListener("click", backupLocalStorage);
  }

  // Restore file input - update file name display
  const restoreFileInput = document.getElementById("restore_file_input");
  const restoreFileName = document.getElementById("restore-file-name");
  if (restoreFileInput && restoreFileName) {
    restoreFileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        restoreFileName.textContent = file.name;
      } else {
        restoreFileName.textContent = "No file selected!";
      }
    });
  }

  // Restore button
  const restoreBtn = document.getElementById("restore_button");
  if (restoreBtn && restoreFileInput) {
    restoreBtn.addEventListener("click", function () {
      const file = restoreFileInput.files[0];
      if (!file) {
        showNotification(
          "Please select a backup file first!",
          "is-warning is-light",
        );
        return;
      }
      if (!file.name.endsWith(".json")) {
        showNotification(
          "Please select a valid JSON backup file!",
          "is-danger is-light",
        );
        return;
      }
      restoreLocalStorage(file);
    });
  }
});
