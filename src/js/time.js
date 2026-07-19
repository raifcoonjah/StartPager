//    __   _                        _
//   / /_ (_)____ ___   ___        (_)_____
//  / __// // __ `__ \ / _ \      / // ___/
// / /_ / // / / / / //  __/_    / /(__  )
// \__//_//_/ /_/ /_/ \___/(_)__/ //____/
//                           /___/
//

// Performance Optimization: Cache static DOM nodes globally
const timeNode = document.getElementById("time");
const dateNode = document.getElementById("date");
const greetingsNode = document.getElementById("greetings");
const quoteNode = document.getElementById("quote");
const quoteAuthorNode = document.getElementById("quote-author");
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

// ─── Dynamic time color (iOS-style) — now reads a pre-computed palette ────────

/**
 * Applies a palette object ({ textColor, light, dark }) to the time/date/
 * greeting text and Bulma's primary color CSS variables. Exposed globally so
 * background.js can call it immediately after saving a new palette, without
 * needing this file to re-derive anything from the image itself.
 */
function applyStoredPalette(palette) {
  if (!palette) return;
  if (timeNode) timeNode.style.color = palette.textColor;
  if (dateNode) dateNode.style.color = palette.textColor;
  if (greetingsNode) greetingsNode.style.color = palette.textColor;
  if (quoteNode) quoteNode.style.color = palette.textColor;
  if (quoteAuthorNode) quoteAuthorNode.style.color = palette.textColor;

  const docStyle = document.documentElement.style;
  docStyle.setProperty("--bulma-primary", palette.textColor);
  docStyle.setProperty("--bulma-primary-light", palette.light);
  docStyle.setProperty("--bulma-primary-dark", palette.dark);
}
window.applyStoredPalette = applyStoredPalette;

function clearDynamicColor() {
  if (timeNode) timeNode.style.color = "";
  if (dateNode) dateNode.style.color = "";
  if (greetingsNode) greetingsNode.style.color = "";
  if (quoteNode) quoteNode.style.color = "";
  if (quoteAuthorNode) quoteAuthorNode.style.color = "";

  const docStyle = document.documentElement.style;
  docStyle.removeProperty("--bulma-primary");
  docStyle.removeProperty("--bulma-primary-light");
  docStyle.removeProperty("--bulma-primary-dark");
}

function loadStoredPalette() {
  try {
    const raw = localStorage.getItem("bgPalette");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

if (dynamicColorToggle) {
  const savedDynamicColor = localStorage.getItem("dynamic-color") === "true";
  dynamicColorToggle.checked = savedDynamicColor;
  if (savedDynamicColor) applyStoredPalette(loadStoredPalette());

  dynamicColorToggle.addEventListener("change", () => {
    if (dynamicColorToggle.checked) {
      localStorage.setItem("dynamic-color", "true");
      applyStoredPalette(loadStoredPalette());
    } else {
      localStorage.setItem("dynamic-color", "false");
      clearDynamicColor();
    }
  });
}