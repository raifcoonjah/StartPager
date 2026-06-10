//    __   _                        _
//   / /_ (_)____ ___   ___        (_)_____
//  / __// // __ `__ \ / _ \      / // ___/
// / /_ / // / / / / //  __/_    / /(__  )
// \__//_//_/ /_/ /_/ \___/(_)__/ //____/
//                           /___/

// Performance Optimization: Cache static DOM nodes globally
const timeNode = document.getElementById("time");
const dateNode = document.getElementById("date");
const greetingsNode = document.getElementById("greetings");
const usernameInput = document.querySelector("#username");
const dynamicColorToggle = document.getElementById("toggle-blurred-bg");

// ─── Greeting ─────────────────────────────────────────────────────────────────

let lastGreetingPeriod = "";

const determineGreet = (forceUpdate = false) => {
  if (!greetingsNode) return;
  
  const hours = new Date().getHours();
  const greeting = hours < 12 ? "morning" : hours < 18 ? "afternoon" : hours < 21 ? "evening" : "night";
  
  // Performance Optimization: Prevent layout thrashing by only modifying DOM if values actually change
  if (greeting !== lastGreetingPeriod || forceUpdate) {
    lastGreetingPeriod = greeting;
    const user = localStorage.getItem("user") || "";
    greetingsNode.innerText = `Good ${greeting}, ${user}.`;
  }
};

// ─── Time and date ────────────────────────────────────────────────────────────

let lastDateString = "";

const updateTimeAndDate = () => {
  const date = new Date();
  
  // 1. Update Time Component (Every minute)
  if (timeNode) {
    const hour = date.getHours().toString().padStart(2, "0");
    const min = date.getMinutes().toString().padStart(2, "0");
    timeNode.innerHTML = `${hour}<span>:</span>${min}`;
  }

  // 2. Update Date Component (Only if day changes)
  const currentDateKey = `${date.getDate()}-${date.getMonth()}`;
  if (currentDateKey !== lastDateString && dateNode) {
    lastDateString = currentDateKey;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    const cmonth = months[date.getMonth()];
    const cday = days[date.getDay()];
    const cnum = date.getDate().toString().padStart(2, "0");
    dateNode.innerHTML = `${cday}, ${cnum} ${cmonth}`;
  }

  // 3. Verify Greeting
  determineGreet();
};

const scheduleUpdate = () => {
  updateTimeAndDate();
  
  // Calculate exact milliseconds left to sync loop with system minute tick exactly
  const delay = (60 - new Date().getSeconds()) * 1000;
  
  setTimeout(() => {
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 60000);
  }, delay);
};

// Initialize clock tree
scheduleUpdate();

// ─── Username ─────────────────────────────────────────────────────────────────

if (usernameInput) {
  usernameInput.addEventListener("input", () => {
    const username = usernameInput.value.trim().substring(0, 20);

    if (username) {
      localStorage.setItem("user", username);
      determineGreet(true); // Force domestic string rebuild
      usernameInput.classList.replace("is-danger", "is-success");
    } else {
      usernameInput.classList.replace("is-success", "is-danger");
    }
  });
}

// ─── Dynamic time color from background (iOS-style) ──────────────────────────

const extractDominantColor = () => {
  const bgImage = document.body.style.backgroundImage || window.getComputedStyle(document.body).backgroundImage;
  if (!bgImage || bgImage === "none") return;

  const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
  if (!urlMatch) return;

  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = function() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // Performance Optimization: Downscaled calculation matrix from 50x50 to 16x16.
    // The browser native GPU pipeline resizes the data layout instantly during drawImage.
    canvas.width = 16;
    canvas.height = 16;

    const cropSize = Math.min(this.width, this.height) * 0.4;
    const sx = (this.width - cropSize) * 0.5;
    const sy = (this.height - cropSize) * 0.5;
    ctx.drawImage(this, sx, sy, cropSize, cropSize, 0, 0, 16, 16);

    const data = ctx.getImageData(0, 0, 16, 16).data;
    let r = 0, g = 0, b = 0, count = 0;

    // Linear scanning loop is now extremely cheap since the dataset is small
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }

    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    // Boost saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const mid = (max + min) * 0.5;
    const satBoost = 1.8;
    r = Math.min(255, Math.round(mid + (r - mid) * satBoost));
    g = Math.min(255, Math.round(mid + (g - mid) * satBoost));
    b = Math.min(255, Math.round(mid + (b - mid) * satBoost));

    // Lighten calculation
    const lightenFactor = 0.6;
    const textR = Math.min(255, Math.round(r + (255 - r) * lightenFactor));
    const textG = Math.min(255, Math.round(g + (255 - g) * lightenFactor));
    const textB = Math.min(255, Math.round(b + (255 - b) * lightenFactor));
    const textColor = `rgb(${textR}, ${textG}, ${textB})`;

    // Apply colors batch inline style calls
    if (timeNode) timeNode.style.color = textColor;
    if (dateNode) dateNode.style.color = textColor;
    if (greetingsNode) greetingsNode.style.color = textColor;

    const docStyle = document.documentElement.style;
    docStyle.setProperty("--bulma-primary", textColor);
    docStyle.setProperty("--bulma-primary-light", `rgb(${Math.min(255, Math.round(textR + (255 - textR) * 0.85))}, ${Math.min(255, Math.round(textG + (255 - textG) * 0.85))}, ${Math.min(255, Math.round(textB + (255 - textB) * 0.85))})`);
    docStyle.setProperty("--bulma-primary-dark", `rgb(${Math.round(textR * 0.7)}, ${Math.round(textG * 0.7)}, ${Math.round(textB * 0.7)})`);
  };

  img.src = urlMatch[1];
};

const clearDynamicColor = () => {
  if (timeNode) timeNode.style.color = "";
  if (dateNode) dateNode.style.color = "";
  if (greetingsNode) greetingsNode.style.color = "";

  const docStyle = document.documentElement.style;
  docStyle.removeProperty("--bulma-primary");
  docStyle.removeProperty("--bulma-primary-light");
  docStyle.removeProperty("--bulma-primary-dark");
};

// ─── Toggle & Observer Init ───────────────────────────────────────────────────

if (dynamicColorToggle) {
  const savedDynamicColor = localStorage.getItem("dynamic-color") === "true";
  dynamicColorToggle.checked = savedDynamicColor;
  if (savedDynamicColor) extractDominantColor();

  dynamicColorToggle.addEventListener("change", () => {
    if (dynamicColorToggle.checked) {
      localStorage.setItem("dynamic-color", "true");
      extractDominantColor();
    } else {
      localStorage.setItem("dynamic-color", "false");
      clearDynamicColor();
    }
  });
}

let lastBg = "";
let debounceTimer = null;

const observer = new MutationObserver(() => {
  if (localStorage.getItem("dynamic-color") !== "true") return;

  const currentBg = document.body.style.backgroundImage;
  if (currentBg === lastBg) return;
  lastBg = currentBg;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(extractDominantColor, 250);
});

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ["style"],
});