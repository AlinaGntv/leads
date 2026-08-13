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
const defaultMonthLabel = document.querySelector("#defaultMonthLabel");
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

const extraPlus = document.querySelector("#extraPlus");
const extraMinus = document.querySelector("#extraMinus");
const extraCount = document.querySelector("#extraCount");
const todayExtraChip = document.querySelector("#todayExtraChip");

const now = new Date();
const todayKey = toDateKey(now);
const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const storageKey = `${STORAGE_PREFIX}:${monthKey}`;
const EMPTY_FUNNEL = { replies: 0, tests: 0, works: 0 };

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
    return { days: {}, extra: {}, funnel: { ...EMPTY_FUNNEL } };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.days) {
      return { days: {}, extra: {}, funnel: { ...EMPTY_FUNNEL } };
    }
    return {
      days: parsed.days,
      extra: parsed.extra || {},
      funnel: { ...EMPTY_FUNNEL, ...(parsed.funnel || {}) },
    };
  } catch {
    return { days: {}, extra: {}, funnel: { ...EMPTY_FUNNEL } };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getTodayDone() {
  return state.days[todayKey] || 0;
}

function getTodayExtra() {
  return state.extra ? Number(state.extra[todayKey] || 0) : 0;
}

function getTodayTotal() {
  return getTodayDone() + getTodayExtra();
}

function setTodayDone(value) {
  state.days[todayKey] = Math.max(0, Math.min(DAILY_GOAL, value));
  saveState();
  render();
}

function setTodayExtra(value) {
  state.extra = state.extra || {};
  state.extra[todayKey] = Math.max(0, value);
  saveState();
  render();
}

function clearToday() {
  state.days[todayKey] = 0;
  state.extra = state.extra || {};
  state.extra[todayKey] = 0;
  saveState();
  render();
}

function getMonthDone() {
  return Object.entries(state.days).reduce((sum, [key, value]) => {
    const extra = state.extra ? Number(state.extra[key] || 0) : 0;
    return sum + Number(value || 0) + extra;
  }, 0);
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
    .map(([dateKey, value]) => {
      const extra = state.extra ? Number(state.extra[dateKey] || 0) : 0;
      return Number(value || 0) + extra;
    });

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
  const todayTotal = getTodayTotal();
  const todayExtra = getTodayExtra();
  const monthDone = getMonthDone();
  const todayRatio = Math.min(todayTotal / DAILY_GOAL, 1);
  const monthRatio = Math.min(monthDone / MONTH_GOAL, 1);

  todayCount.textContent = todayTotal;
  monthCount.textContent = monthDone;
  monthLeft.textContent = Math.max(MONTH_GOAL - monthDone, 0);
  weekdayAverage.textContent = getWeekdayAverage();
  todayPercent.textContent = `${Math.round((todayTotal / DAILY_GOAL) * 100)}%`;
  todayRing.style.strokeDashoffset = String(314 - 314 * todayRatio);
  monthProgressBar.style.width = `${monthRatio * 100}%`;
  defaultMonthLabel.textContent = now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  extraCount.textContent = todayExtra;
  if (todayExtra > 0) {
    todayExtraChip.textContent = `+${todayExtra} сверх нормы`;
    todayExtraChip.classList.remove("is-hidden");
  } else {
    todayExtraChip.classList.add("is-hidden");
  }

  [...dailyGrid.children].forEach((dot, index) => {
    dot.classList.toggle("is-done", index < getTodayDone());
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
  clearToday();
});

fillTodayButton.addEventListener("click", () => {
  setTodayDone(DAILY_GOAL);
});

extraPlus.addEventListener("click", () => {
  setTodayExtra(getTodayExtra() + 1);
});

extraMinus.addEventListener("click", () => {
  setTodayExtra(getTodayExtra() - 1);
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

  state = { days: {}, extra: {}, funnel: { ...EMPTY_FUNNEL } };
  saveState();
  render();
});

createDailyDots();
createMonthDots();
render();