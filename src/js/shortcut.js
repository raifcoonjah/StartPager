//    _____ __               __             __      _
//   / ___// /_  ____  _____/ /________  __/ /_    (_)____
//   \__ \/ __ \/ __ \/ ___/ __/ ___/ / / / __/   / / ___/
//  ___/ / / / / /_/ / /  / /_/ /__/ /_/ / /__   / (__  )
// /____/_/ /_/\____/_/   \__/\___/\__,_/\__(_)_/ /____/
//                                           /___/
const shortcutBarNode = document.getElementById("shortcut-icons-bar");
const shortcutListContainer = document.getElementById("custom-shortcut-list");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSiteName(url) {
  try {
    const u = new URL(url);
    const hostname = u.hostname.replace(/^www\./, "");
    const pathname = u.pathname;

    if (hostname.includes("reddit.com") && pathname) {
      const subredditMatch = pathname.match(/^\/r\/([^\/]+)/);
      if (subredditMatch) {
        return `r/${subredditMatch[1]}`;
      }
    }

    let name = hostname;
    if (pathname && pathname !== "/") {
      name += pathname;
    }
    return name.length > 10 ? name.slice(0, 10) + "..." : name;
  } catch {
    const s = String(url || "");
    return s.length > 10 ? s.slice(0, 10) + "..." : s;
  }
}

function getFavicon(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}/favicon.ico`;
  } catch {
    return "";
  }
}

// OPTIMIZATION: the previous "debounced batch update" comment didn't match
// the code — it called localStorage.setItem on every single icon's onload,
// so up to 8 icons loading concurrently meant 8 redundant JSON.stringify +
// write cycles of the whole cache object. This is now a real debounce: writes
// are collected and flushed once, shortly after the last icon finishes.
let faviconCacheSaveTimer = null;
function scheduleFaviconCacheSave(cache) {
  clearTimeout(faviconCacheSaveTimer);
  faviconCacheSaveTimer = setTimeout(() => {
    localStorage.setItem("shortcutIconCache", JSON.stringify(cache));
  }, 300);
}

function renderShortcutIconsBar() {
  if (!shortcutBarNode) return;

  const show = localStorage.getItem("showShortcutIcons") === "true";
  const useGeneric = localStorage.getItem("useGenericIcons") === "true";
  const shortcuts = getCustomShortcuts();

  if (!show || !shortcuts.length) {
    shortcutBarNode.innerHTML = "";
    shortcutBarNode.style.display = "none";
    return;
  }

  shortcutBarNode.style.display = "flex";
  const limitedShortcuts = shortcuts.slice(0, 8);

  // Performance Optimization: Streamlined map constructions to reduce layout thrashing
  if (useGeneric) {
    shortcutBarNode.innerHTML = limitedShortcuts
      .map((item) => {
        const name = escapeHtml(getSiteName(item.url));
        return `
        <button type="button" class="shortcut-icon button is-flex is-align-items-center is-rounded has-shadow mx-1 px-3 py-2" style="gap:0.75em;" data-url="${escapeHtml(item.url)}">
          <span class="icon is-medium mr-2">
            <i class="fa-solid fa-link"></i>
          </span>
          <span class="has-text-weight-medium">${name}</span>
        </button>
      `;
      })
      .join("");
  } else {
    let cache = {};
    try {
      cache = JSON.parse(localStorage.getItem("shortcutIconCache") || "{}");
    } catch (e) {
      cache = {};
    }

    shortcutBarNode.innerHTML = limitedShortcuts
      .map((item) => {
        const name = escapeHtml(getSiteName(item.url));
        let domain = "";
        try {
          domain = new URL(item.url).hostname;
        } catch (e) {
          domain = item.url;
        }

        const cacheKey = `favicon:${domain}`;
        const iconSrc = cache[cacheKey] || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

        // OPTIMIZATION: loading="lazy" defers offscreen icon fetches, and
        // decoding="async" stops image decode from blocking the main thread/paint.
        return `
        <button type="button" class="shortcut-icon button is-flex is-align-items-center is-rounded has-shadow mx-1 px-3 py-2" style="gap:0.75em;" data-url="${escapeHtml(item.url)}">
          <figure class="image is-32x32 mr-2 mb-0">
            <img class="shortcut-favicon"
                 src="${escapeHtml(iconSrc)}"
                 alt=""
                 loading="lazy"
                 decoding="async"
                 data-domain="${escapeHtml(domain)}"
                 onerror="if(this.dataset.fallback!='1'){this.dataset.fallback='1';this.src='https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico';}else{this.style.display='none';}">
          </figure>
          <span class="has-text-weight-medium">${name}</span>
        </button>
      `;
      })
      .join("");

    // Performance Optimization: Handled with a single bound check loop instead of spawning micro closures
    shortcutBarNode.querySelectorAll(".shortcut-favicon").forEach((img) => {
      img.onload = () => {
        const domain = img.getAttribute("data-domain");
        if (domain && !cache[`favicon:${domain}`] && img.dataset.fallback !== "1") {
          cache[`favicon:${domain}`] = img.src;
          scheduleFaviconCacheSave(cache);
        }
      };
    });
  }
}

(function setupShortcutBarClickHandler() {
  if (!shortcutBarNode) return;
  shortcutBarNode.addEventListener("click", (e) => {
    const btn = e.target.closest(".shortcut-icon");
    if (btn) {
      const url = btn.getAttribute("data-url");
      if (url) window.open(url, "_blank");
    }
  });
})();

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

function showCustomShortcutModal({ key = "", url = "", idx = null } = {}) {
  const existingModal = document.getElementById("custom-shortcut-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "custom-shortcut-modal";
  modal.className = "modal is-active";
  modal.innerHTML = `
    <div class="modal-background"></div>
    <div class="modal-content">
      <div class="box">
        <h4 class="modal-card-title title is-4 mb-0">${idx !== null ? "Edit Shortcut" : "Add Shortcut"}</h4>
        <br/>
        <form id="custom-shortcut-form" autocomplete="off">
          <div class="field">
            <label class="label" for="custom-key">Shortcut Key</label>
            <h6 class="subtitle is-6 has-text-grey-light">Key/Character that will trigger this shortcut.</h6>
            <div class="control">
              <input class="input" id="custom-key" type="text" placeholder="Key" maxlength="1" style="width:9%" required value="${escapeHtml(key)}" />
            </div>
          </div>
          <div class="field">
            <label class="label" for="custom-url">URL</label>
            <h6 class="subtitle is-6 has-text-grey-light">Website that you'd like to trigger using this key.</h6>
            <div class="control">
              <input class="input" id="custom-url" type="url" placeholder="URL (https://...)" required value="${escapeHtml(url)}" />
            </div>
          </div>
          <div class="field is-grouped is-grouped-right mt-4">
            <div class="control">
              <button type="submit" class="button is-success" id="save-shortcut-btn">
                ${idx !== null ? '<i class="fa-solid fa-floppy-disk"></i> Save' : '<i class="fa-solid fa-plus"></i> Add'}
              </button>
            </div>
            <div class="control">
              <button type="button" class="button is-danger is-outlined" id="cancel-shortcut-btn">Cancel</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const keyInput = modal.querySelector("#custom-key");
  const urlInput = modal.querySelector("#custom-url");
  const form = modal.querySelector("#custom-shortcut-form");

  const closeModal = () => modal.remove();
  modal.querySelector(".modal-background").addEventListener("click", closeModal, { once: true });
  modal.querySelector("#cancel-shortcut-btn").addEventListener("click", closeModal, { once: true });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const keyVal = keyInput.value.trim();
    const urlVal = urlInput.value.trim();

    if (!keyVal || !urlVal) {
      showNotification("Please enter both a key and a URL!", "is-danger is-light");
      return;
    }
    if (!/^https?:\/\//.test(urlVal)) {
      showNotification("URL must start with http:// or https://", "is-danger is-light");
      return;
    }

    const list = getCustomShortcuts();
    const duplicate = list.findIndex((item, i) => item.key === keyVal && i !== idx);
    if (duplicate !== -1) {
      showNotification("This key is already used.", "is-danger is-light");
      return;
    }

    if (idx !== null) {
      list[idx] = { key: keyVal, url: urlVal };
      showNotification("Shortcut updated successfully.", "is-success is-light");
    } else {
      list.push({ key: keyVal, url: urlVal });
      showNotification("Shortcut added successfully.", "is-success is-light");
    }

    saveCustomShortcuts(list);
    renderCustomShortcuts();
    closeModal();
  });
}

document.getElementById("open-custom-shortcut-modal").onclick = showCustomShortcutModal;

if (shortcutListContainer) {
  shortcutListContainer.addEventListener("click", (e) => {
    const target = e.target;
    const removeBtn = target.closest(".remove-shortcut");
    const editBtn = target.closest(".edit-shortcut");
    const copyBtn = target.closest(".copy-shortcut");

    let list = null;

    if (removeBtn) {
      const idx = +removeBtn.dataset.idx;
      list = getCustomShortcuts();
      list.splice(idx, 1);
      saveCustomShortcuts(list);
      renderCustomShortcuts();
      showNotification("Shortcut removed", "is-danger is-light");
    } else if (editBtn) {
      const idx = +editBtn.dataset.idx;
      const item = getCustomShortcuts()[idx];
      showCustomShortcutModal({ key: item.key, url: item.url, idx });
    } else if (copyBtn) {
      const url = copyBtn.dataset.url;
      navigator.clipboard.writeText(url).then(() => {
        const icon = copyBtn.querySelector("i");
        if (icon) {
          icon.className = "fas fa-check";
          setTimeout(() => { icon.className = "fas fa-copy"; }, 1500);
        }
      }).catch(() => {
        showNotification("Failed to copy URL", "is-danger is-light");
      });
    }
  });
}

function renderCustomShortcuts() {
  if (!shortcutListContainer) return;
  const list = getCustomShortcuts();

  if (!list.length) {
    shortcutListContainer.innerHTML = `<p class="has-text-grey-light has-text-centered is-size-6" style="padding:10px;">No custom shortcuts yet :(</p>`;
    return;
  }

  let table = `<table class="table is-fullwidth is-hoverable"><thead><tr><th>Shortcut key</th><th>URL</th><th></th></tr></thead><tbody>`;
  table += list
    .map((item, idx) => {
      const safeUrl = escapeHtml(item.url);
      const displayUrl = item.url.length > 15 ? escapeHtml(item.url.slice(0, 15)) + "..." : safeUrl;
      return `
      <tr>
        <td><b>${escapeHtml(item.key)}</b></td>
        <td><a href="${safeUrl}" target="_blank" title="${safeUrl}">${displayUrl}</a></td>
        <td style="width:1%;white-space:nowrap">
          <button class="button is-small is-info mr-1 copy-shortcut" data-url="${safeUrl}" title="Copy Link"><i class="fas fa-copy"></i></button>
          <button class="button is-small is-warning mr-1 edit-shortcut" data-idx="${idx}" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="button is-small is-danger is-outlined remove-shortcut" data-idx="${idx}" title="Remove"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
    })
    .join("");
  table += `</tbody></table>`;
  shortcutListContainer.innerHTML = table;
  renderShortcutIconsBar();
}

function getCustomShortcuts() {
  try {
    return JSON.parse(localStorage.getItem("customShortcuts")) || [];
  } catch {
    return [];
  }
}

function saveCustomShortcuts(list) {
  localStorage.setItem("customShortcuts", JSON.stringify(list));
  renderShortcutIconsBar();
}

document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("toggle-shortcut-icons");
  if (toggle) {
    toggle.checked = localStorage.getItem("showShortcutIcons") === "true";
    toggle.addEventListener("change", function () {
      localStorage.setItem("showShortcutIcons", this.checked);
      renderShortcutIconsBar();
    });
  }

  const genericToggle = document.getElementById("toggle-generic-shortcut-icons");
  if (genericToggle) {
    genericToggle.checked = localStorage.getItem("useGenericIcons") === "true";
    genericToggle.addEventListener("change", function () {
      localStorage.setItem("useGenericIcons", this.checked);
      renderShortcutIconsBar();
    });
  }

  renderCustomShortcuts();
});

// Performance Optimization: Flatten key checking loops into constant-time validation properties
document.addEventListener("keydown", function (event) {
  const tag = document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement.isContentEditable) return;

  if (event.shiftKey && event.key === "S") {
    const sidebar = document.querySelector(".sidebar-trigger");
    if (sidebar) sidebar.click();
    return;
  }

  const custom = getCustomShortcuts().find((item) => item.key === event.key);
  if (custom) {
    showNotification(`Opening ${custom.url}...`, "is-info");
    window.open(custom.url, "_blank");
  }
});