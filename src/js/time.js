//    __   _                        _
//   / /_ (_)____ ___   ___        (_)_____
//  / __// // __ `__ \ / _ \      / // ___/
// / /_ / // / / / / //  __/_    / /(__  )
// \__//_//_/ /_/ /_/ \___/(_)__/ //____/
//                           /___/

const determineGreet = () => {
  const hours = new Date().getHours();
  const user = localStorage.getItem("user") || "";
  const greeting =
    hours < 12
      ? "morning"
      : hours < 18
        ? "afternoon"
        : hours < 21
          ? "evening"
          : "night";
  document.getElementById("greetings").innerText = `Good ${greeting}, ${user}.`;
};

determineGreet();

//
// ========
// + Time and month text +
// ========
//
const getTime = () => {
  const date = new Date();
  const hour = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${hour}<span>:</span>${min}`;
};

const getDate = () => {
  const date = new Date();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const cmonth = months[date.getMonth()];
  const cday = days[date.getDay()];
  const cnum = date.getDate().toString().padStart(2, "0");
  return `${cday}, ${cnum} ${cmonth}`;
};

document.getElementById("date").innerHTML = getDate();
document.getElementById("time").innerHTML = getTime();

const updateTime = () => {
  document.getElementById("time").innerHTML = getTime();
};

// Calculate the delay until the next minute
const calculateDelay = () => {
  const now = new Date();
  return (60 - now.getSeconds()) * 1000;
};

const scheduleUpdate = () => {
  updateTime();
  setTimeout(() => {
    updateTime();
    setInterval(updateTime, 60000);
  }, calculateDelay());
};

scheduleUpdate();

//
// ========
// + Username feature v2 +
// ========
//
//

const usernameInput = document.querySelector("#username");

usernameInput.addEventListener("input", () => {
  let username = usernameInput.value.trim();
  if (username.length > 20) {
    username = username.substring(0, 20) + "...";
  }
  if (username) {
    localStorage.setItem("user", username);
    determineGreet();
    usernameInput.classList.remove("is-danger");
    usernameInput.classList.add("is-success");
  } else {
    usernameInput.classList.remove("is-success");
    usernameInput.classList.add("is-danger");
  }
});

// ========
// + Dynamic time color from background (iOS-style) +
// ========

const extractDominantColor = () => {
  const bgImage =
    document.body.style.backgroundImage ||
    window.getComputedStyle(document.body).backgroundImage;

  if (!bgImage || bgImage === "none") return;

  const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
  if (!urlMatch) return;

  const imageUrl = urlMatch[1];
  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 50;
    canvas.height = 50;
    ctx.drawImage(img, 0, 0, 50, 50);

    const data = ctx.getImageData(0, 0, 50, 50).data;
    let r = 0,
      g = 0,
      b = 0,
      count = 0;

    for (let i = 0; i < data.length; i += 16) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }

    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    // Boost saturation so washed-out averages become vivid
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const satBoost = 1.8;
    const mid = (max + min) / 2;
    r = Math.min(255, Math.round(mid + (r - mid) * satBoost));
    g = Math.min(255, Math.round(mid + (g - mid) * satBoost));
    b = Math.min(255, Math.round(mid + (b - mid) * satBoost));

    // Always push toward a darker, more contrasty shade
    const darkenFactor = 0.65;
    const textR = Math.round(r * darkenFactor);
    const textG = Math.round(g * darkenFactor);
    const textB = Math.round(b * darkenFactor);

    const textColor = `rgb(${textR}, ${textG}, ${textB})`;

    document.getElementById("time").style.color = textColor;
    document.getElementById("date").style.color = textColor;
    document.getElementById("greetings").style.color = textColor;

    // Override Bulma's --bulma-primary CSS variable
    document.documentElement.style.setProperty("--bulma-primary", textColor);

    // Also set derived Bulma primary variants for buttons, links, borders etc.
    const lightR = Math.min(255, Math.round(textR + (255 - textR) * 0.85));
    const lightG = Math.min(255, Math.round(textG + (255 - textG) * 0.85));
    const lightB = Math.min(255, Math.round(textB + (255 - textB) * 0.85));
    document.documentElement.style.setProperty(
      "--bulma-primary-light",
      `rgb(${lightR}, ${lightG}, ${lightB})`,
    );

    const darkR = Math.round(textR * 0.7);
    const darkG = Math.round(textG * 0.7);
    const darkB = Math.round(textB * 0.7);
    document.documentElement.style.setProperty(
      "--bulma-primary-dark",
      `rgb(${darkR}, ${darkG}, ${darkB})`,
    );
  };

  img.src = imageUrl;
};

const clearDynamicColor = () => {
  document.getElementById("time").style.color = "";
  document.getElementById("date").style.color = "";
  document.getElementById("greetings").style.color = "";

  // Reset Bulma primary variables
  document.documentElement.style.removeProperty("--bulma-primary");
  // document.documentElement.style.removeProperty("--bulma-primary-light");
  // document.documentElement.style.removeProperty("--bulma-primary-dark");
};

// ---- Toggle ----
const dynamicColorToggle = document.getElementById("toggle-blurred-bg");

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

// ---- Re-run when background changes ----
const observer = new MutationObserver(() => {
  if (localStorage.getItem("dynamic-color") === "true") {
    extractDominantColor();
  }
});

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ["style"],
});
