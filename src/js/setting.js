//    _____      __  __  _                      _
//   / ___/___  / /_/ /_(_)___  ____ ______    (_)____
//   \__ \/ _ \/ __/ __/ / __ \/ __ `/ ___/   / / ___/
//  ___/ /  __/ /_/ /_/ / / / / /_/ (__  )   / (__  )
// /____/\___/\__/\__/_/_/ /_/\__, /____(_)_/ /____/
//                           /____/      /___/
//

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
      .addEventListener("click", async function () {
        const confirmBtn = modal.querySelector("#confirm-reset");
        confirmBtn.classList.add("is-loading");
        confirmBtn.disabled = true;
        // Keep sidebar open, do not close modal
        localStorage.clear();
        // Also clear the IndexedDB-backed background image store, since the
        // background image no longer lives in localStorage.
        try {
          if (window.idb) await window.idb.delete("background");
        } catch (e) {
          // ignore
        }
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

function applyWhiteFontColor(isWhite) {
  document.documentElement.classList.toggle("white-font", !!isWhite);
}

function applyTimeFontSize(size) {
  const timeElement = document.getElementById("time");
  if (timeElement) {
    timeElement.style.fontSize = size;
  }
}

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

function applyManualDarken() {
  // Enabled by default: if the key doesn't exist in localStorage, treat it as true so it's enabled by default.
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

// Backup all localStorage (+ the IndexedDB background image, base64-encoded) to a JSON file
async function backupLocalStorage() {
  try {
    const backup = { __localStorage: {} };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      backup.__localStorage[key] = localStorage.getItem(key);
    }

    // Include the background image blob (if any) so restores are complete.
    try {
      if (window.idb) {
        const blob = await window.idb.get("background");
        if (blob) {
          backup.__backgroundImageBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch (e) {
      // Background export is best-effort; continue with a localStorage-only backup
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

// Restore localStorage (+ background image, if present) from a JSON file
function restoreLocalStorage(file) {
  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      const backup = JSON.parse(e.target.result);
      const kvStore = backup.__localStorage || backup; // support older flat backups too

      localStorage.clear();
      for (const [key, value] of Object.entries(kvStore)) {
        localStorage.setItem(key, value);
      }

      if (backup.__backgroundImageBase64 && window.idb) {
        try {
          const res = await fetch(backup.__backgroundImageBase64);
          const blob = await res.blob();
          await window.idb.set("background", blob);
        } catch (e) {
          // Background restore is best-effort
        }
      }

      showNotification(
        "Welcome back! Data restored successfully! Refreshing page..",
        "is-success is-light",
      );

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

// ─── Single consolidated init block ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  // Welcome modal (first run only)
  if (!localStorage.getItem("welcomeShown")) {
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

    const closeModal = () => {
      modal.classList.remove("is-active");
      localStorage.setItem("welcomeShown", "true");
      setTimeout(() => modal.remove(), 500);
    };

    document.getElementById("close_welcome_modal").addEventListener("click", closeModal);
    document.querySelector(".modal-close").addEventListener("click", closeModal);
  }

  // White font color toggle
  const whiteFontToggle = document.getElementById("toggle-white-font");
  if (whiteFontToggle) {
    const isWhite = localStorage.getItem("whiteFontColor") === "true";
    whiteFontToggle.checked = isWhite;
    applyWhiteFontColor(isWhite);
    whiteFontToggle.addEventListener("change", function () {
      localStorage.setItem("whiteFontColor", this.checked);
      applyWhiteFontColor(this.checked);
    });
  }

  // Time font size slider
  const timeFontSizeInput = document.getElementById("time-font-size");
  const timeFontSizeValue = document.getElementById("time-font-size-value");
  if (timeFontSizeInput && timeFontSizeValue) {
    const savedSize = localStorage.getItem("timeFontSize") || "96px";
    timeFontSizeInput.value = parseInt(savedSize, 10);
    timeFontSizeValue.textContent = savedSize;
    applyTimeFontSize(savedSize);

    timeFontSizeInput.addEventListener("input", function () {
      const fontSize = this.value + "px";
      timeFontSizeValue.textContent = fontSize;
      localStorage.setItem("timeFontSize", fontSize);
      applyTimeFontSize(fontSize);
    });
  }

  // Time font style (italic/vintage) toggle
  const timeFontStyleToggle = document.getElementById("toggle-time-font-style");
  if (timeFontStyleToggle) {
    const isItalicVintage = localStorage.getItem("timeFontStyleItalicVintage") === "true";
    timeFontStyleToggle.checked = isItalicVintage;
    applyTimeFontStyle(isItalicVintage);

    timeFontStyleToggle.addEventListener("change", function () {
      const isChecked = this.checked;
      localStorage.setItem("timeFontStyleItalicVintage", isChecked);
      applyTimeFontStyle(isChecked);
    });
  }

  // Darken background at night toggle
  const nightDarkenToggle = document.getElementById("toggle-darken-bg-night");
  const savedDarkenState = localStorage.getItem("darkenBgAtNight") !== "false";
  if (nightDarkenToggle) {
    nightDarkenToggle.checked = savedDarkenState;
    nightDarkenToggle.addEventListener("change", function () {
      localStorage.setItem("darkenBgAtNight", this.checked);
      applyManualDarken();
    });
  }
  applyManualDarken();

  // Backup / restore
  const backupBtn = document.getElementById("backup_button");
  if (backupBtn) {
    backupBtn.addEventListener("click", backupLocalStorage);
  }

  const restoreFileInput = document.getElementById("restore_file_input");
  const restoreFileName = document.getElementById("restore-file-name");
  if (restoreFileInput && restoreFileName) {
    restoreFileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      restoreFileName.textContent = file ? file.name : "No file selected!";
    });
  }

  const restoreBtn = document.getElementById("restore_button");
  if (restoreBtn && restoreFileInput) {
    restoreBtn.addEventListener("click", function () {
      const file = restoreFileInput.files[0];
      if (!file) {
        showNotification("Please select a backup file first!", "is-warning is-light");
        return;
      }
      if (!file.name.endsWith(".json")) {
        showNotification("Please select a valid JSON backup file!", "is-danger is-light");
        return;
      }
      restoreLocalStorage(file);
    });
  }
});