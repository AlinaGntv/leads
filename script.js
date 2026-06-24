const DAILY_GOAL = 45;
const MONTH_GOAL = 1000;
const STORAGE_PREFIX = "leads-tracker";

const dailyGrid = document.querySelector("#dailyGrid");
const monthGrid = document.querySelector("#monthGrid");
const todayCount = document.querySelector("#todayCount");
const monthCount = document.querySelector("#monthCount");
const monthLeft = document.querySelector("#monthLeft");
const weekdayAverage = document.querySelector("#weekdayAverage");
const todayRing = document.querySelector("#todayRing");
const todayPercent = document.querySelector("#todayPercent");
const monthProgressBar = document.querySelector("#monthProgressBar");
const monthLabel = document.querySelector("#monthLabel");
const resetTodayButton = document.querySelector("#resetTodayButton");
const resetMonthButton = document.querySelector("#resetMonthButton");
const fillTodayButton = document.querySelector("#fillTodayButton");

const now = new Date();
const todayKey = toDateKey(now);
const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const storageKey = `${STORAGE_PREFIX}:${monthKey}`;

let state = loadState();

function toDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function loadState() {
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return { days: {} };
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && parsed.days ? parsed : { days: {} };
  } catch {
    return { days: {} };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getTodayDone() {
  return state.days[todayKey] || 0;
}

function setTodayDone(value) {
  state.days[todayKey] = Math.max(0, Math.min(DAILY_GOAL, value));
  saveState();
  render();
}

function getMonthDone() {
  return Object.values(state.days).reduce((sum, value) => sum + Number(value || 0), 0);
}

function getWeekdayAverage() {
  const values = Object.entries(state.days)
    .filter(([dateKey]) => {
      const date = new Date(`${dateKey}T12:00:00`);
      const day = date.getDay();
      return day !== 0 && day !== 6;
    })
    .map(([, value]) => Number(value || 0));

  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function createDailyDots() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < DAILY_GOAL; index += 1) {
    const button = document.createElement("button");
    button.className = "dot";
    button.type = "button";
    button.setAttribute("aria-label", `Касание ${index + 1}`);
    button.addEventListener("click", () => toggleDailyDot(index + 1));
    fragment.append(button);
  }

  dailyGrid.append(fragment);
}

function createMonthDots() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < MONTH_GOAL; index += 1) {
    const dot = document.createElement("span");
    dot.className = "dot";
    fragment.append(dot);
  }

  monthGrid.append(fragment);
}

function toggleDailyDot(position) {
  const current = getTodayDone();
  setTodayDone(position <= current ? position - 1 : position);
}

function render() {
  const todayDone = getTodayDone();
  const monthDone = getMonthDone();
  const todayRatio = todayDone / DAILY_GOAL;
  const monthRatio = Math.min(monthDone / MONTH_GOAL, 1);

  todayCount.textContent = todayDone;
  monthCount.textContent = monthDone;
  monthLeft.textContent = Math.max(MONTH_GOAL - monthDone, 0);
  weekdayAverage.textContent = getWeekdayAverage();
  todayPercent.textContent = `${Math.round(todayRatio * 100)}%`;
  todayRing.style.strokeDashoffset = String(314 - 314 * todayRatio);
  monthProgressBar.style.width = `${monthRatio * 100}%`;
  monthLabel.textContent = now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  [...dailyGrid.children].forEach((dot, index) => {
    dot.classList.toggle("is-done", index < todayDone);
  });

  [...monthGrid.children].forEach((dot, index) => {
    dot.classList.toggle("is-done", index < monthDone);
  });
}

resetTodayButton.addEventListener("click", () => {
  setTodayDone(0);
});

fillTodayButton.addEventListener("click", () => {
  setTodayDone(DAILY_GOAL);
});

resetMonthButton.addEventListener("click", () => {
  const confirmed = window.confirm("Сбросить весь прогресс текущего месяца?");

  if (!confirmed) {
    return;
  }

  state = { days: {} };
  saveState();
  render();
});

createDailyDots();
createMonthDots();
render();
