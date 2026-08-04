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

const funnelFromTouches = document.querySelector("#funnelFromTouches");
const funnelValues = {
  touches: document.querySelector("#funnelTouchesValue"),
  replies: document.querySelector("#funnelRepliesValue"),
  tests: document.querySelector("#funnelTestsValue"),
  works: document.querySelector("#funnelWorksValue"),
};
const funnelFills = {
  touches: document.querySelector("#funnelTouchesFill"),
  replies: document.querySelector("#funnelRepliesFill"),
  tests: document.querySelector("#funnelTestsFill"),
  works: document.querySelector("#funnelWorksFill"),
};
const funnelMetas = {
  touches: document.querySelector("#funnelTouchesMeta"),
  replies: document.querySelector("#funnelRepliesMeta"),
  tests: document.querySelector("#funnelTestsMeta"),
  works: document.querySelector("#funnelWorksMeta"),
};
const funnelPcts = {
  replies: document.querySelector("#funnelRepliesPct"),
  tests: document.querySelector("#funnelTestsPct"),
  works: document.querySelector("#funnelWorksPct"),
};
const funnelButtons = document.querySelectorAll(".funnel-button");

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

const EMPTY_FUNNEL = { replies: 0, tests: 0, works: 0 };

function loadState() {
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return { days: {}, funnel: { ...EMPTY_FUNNEL } };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.days) {
      return { days: {}, funnel: { ...EMPTY_FUNNEL } };
    }
    return {
      days: parsed.days,
      funnel: { ...EMPTY_FUNNEL, ...(parsed.funnel || {}) },
    };
  } catch {
    return { days: {}, funnel: { ...EMPTY_FUNNEL } };
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

function getFunnelValue(key) {
  return Number(state.funnel[key] || 0);
}

function setFunnelValue(key, delta) {
  const touches = getMonthDone();
  const limits = {
    replies: touches,
    tests: getFunnelValue("replies"),
    works: getFunnelValue("tests"),
  };
  const next = Math.max(0, Math.min(limits[key], getFunnelValue(key) + delta));
  state.funnel[key] = next;
  saveState();
  render();
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

  renderFunnel();
}

function renderFunnel() {
  const touches = getMonthDone();
  const replies = getFunnelValue("replies");
  const tests = getFunnelValue("tests");
  const works = getFunnelValue("works");
  const pct = (part, base) => (base > 0 ? Math.round((part / base) * 100) : 0);

  funnelValues.touches.textContent = touches;
  funnelValues.replies.textContent = replies;
  funnelValues.tests.textContent = tests;
  funnelValues.works.textContent = works;

  funnelFills.touches.style.width = "100%";
  funnelFills.replies.style.width = `${pct(replies, touches)}%`;
  funnelFills.tests.style.width = `${pct(tests, touches)}%`;
  funnelFills.works.style.width = `${pct(works, touches)}%`;

  funnelMetas.touches.textContent = `${touches} из ${MONTH_GOAL} за месяц`;
  funnelMetas.replies.textContent = `${pct(replies, touches)}% от касаний`;
  funnelMetas.tests.textContent = `${pct(tests, replies)}% от ответов · ${pct(tests, touches)}% от касаний`;
  funnelMetas.works.textContent = `${pct(works, tests)}% от тестовых · ${pct(works, touches)}% от касаний`;
  funnelFromTouches.textContent = `Касание → работа: ${pct(works, touches)}%`;

  funnelPcts.replies.textContent = `${pct(replies, touches)}%`;
  funnelPcts.tests.textContent = `${pct(tests, replies)}%`;
  funnelPcts.works.textContent = `${pct(works, tests)}%`;

  const limits = { replies: touches, tests: replies, works: tests };

  funnelButtons.forEach((button) => {
    const key = button.dataset.key;
    const delta = Number(button.dataset.delta);
    const value = getFunnelValue(key);
    button.disabled = delta < 0 ? value <= 0 : value >= limits[key];
  });
}

resetTodayButton.addEventListener("click", () => {
  setTodayDone(0);
});

fillTodayButton.addEventListener("click", () => {
  setTodayDone(DAILY_GOAL);
});

funnelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setFunnelValue(button.dataset.key, Number(button.dataset.delta));
  });
});

resetMonthButton.addEventListener("click", () => {
  const confirmed = window.confirm("Сбросить весь прогресс текущего месяца?");

  if (!confirmed) {
    return;
  }

  state = { days: {}, funnel: { ...EMPTY_FUNNEL } };
  saveState();
  render();
});

createDailyDots();
createMonthDots();
render();
