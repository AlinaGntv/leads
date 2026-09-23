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
const heroDayLabel = document.querySelector("#heroDayLabel");
const resetTodayButton = document.querySelector("#resetTodayButton");
const resetMonthButton = document.querySelector("#resetMonthButton");
const fillTodayButton = document.querySelector("#fillTodayButton");

const prevMonthButton = document.querySelector("#prevMonthButton");
const nextMonthButton = document.querySelector("#nextMonthButton");
const monthPicker = document.querySelector("#monthPicker");

const prevDayButton = document.querySelector("#prevDayButton");
const nextDayButton = document.querySelector("#nextDayButton");
const datePicker = document.querySelector("#datePicker");
const goTodayButton = document.querySelector("#goTodayButton");

const funnelFromTouches = document.querySelector("#funnelFromTouches");
const funnelModeDay = document.querySelector("#funnelModeDay");
const funnelModeMonth = document.querySelector("#funnelModeMonth");
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

const logBody = document.querySelector("#logBody");
const logTotals = document.querySelector("#logTotals");

const now = new Date();
const todayKey = toDateKey(now);
const todayMonth = toMonthKey(now);
const EMPTY_FUNNEL_DAY = { replies: 0, tests: 0, works: 0 };

let viewMonth = toMonthKey(now);
let viewKey = todayKey;
let viewMode = "day";
let state = loadState();

function pad2(number) {
  return String(number).padStart(2, "0");
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function fromDateKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`);
}

function shiftDateKey(dateKey, deltaDays) {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + deltaDays);
  return toDateKey(date);
}

function shiftMonth(monthKeyValue, deltaMonths) {
  const [year, month] = monthKeyValue.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + deltaMonths);
  return toMonthKey(date);
}

function monthBounds(monthKeyValue) {
  const [year, month] = monthKeyValue.split("-").map(Number);
  const monthLastDay = new Date(year, month, 0).getDate();
  return {
    first: `${monthKeyValue}-01`,
    last: `${monthKeyValue}-${pad2(monthLastDay)}`,
    lastDay: monthLastDay,
  };
}

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isMonthKey(value) {
  return /^\d{4}-\d{2}$/.test(value) && value.slice(0, 4) !== "0000";
}

function formatShort(dateKey) {
  const [, month, dayOfMonth] = dateKey.split("-");
  return `${dayOfMonth}.${month}`;
}

function formatLong(dateKey) {
  return fromDateKey(dateKey).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

function formatMonth(monthKeyValue) {
  const [year, month] = monthKeyValue.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

function viewLabel() {
  return viewKey === todayKey ? "Сегодня" : formatShort(viewKey);
}

function normalizeFunnel(funnel, fallbackDay) {
  if (!funnel) {
    return {};
  }

  const isPerDay = Object.keys(funnel).some(isDateKey);
  if (isPerDay) {
    const normalized = {};
    Object.entries(funnel).forEach(([key, value]) => {
      const day = value && typeof value === "object" ? value : {};
      normalized[key] = { ...EMPTY_FUNNEL_DAY, ...day };
    });
    return normalized;
  }

  return { [fallbackDay]: { ...EMPTY_FUNNEL_DAY, ...funnel } };
}

function loadState() {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}:${viewMonth}`);

  if (!raw) {
    return { days: {}, extra: {}, funnel: {} };
  }

  try {
    const parsed = JSON.parse(raw);
    const bounds = monthBounds(viewMonth);
    const fallbackDay = todayKey >= bounds.first && todayKey <= bounds.last ? todayKey : bounds.first;
    if (!parsed || !parsed.days) {
      return { days: {}, extra: {}, funnel: {} };
    }
    return {
      days: parsed.days,
      extra: parsed.extra || {},
      funnel: normalizeFunnel(parsed.funnel, fallbackDay),
    };
  } catch {
    return { days: {}, extra: {}, funnel: {} };
  }
}

function saveState() {
  localStorage.setItem(`${STORAGE_PREFIX}:${viewMonth}`, JSON.stringify(state));
}

function getDayDone(dateKey) {
  return state.days[dateKey] || 0;
}

function getDayExtra(dateKey) {
  return state.extra ? Number(state.extra[dateKey] || 0) : 0;
}

function getDayTotal(dateKey) {
  return getDayDone(dateKey) + getDayExtra(dateKey);
}

function setDayDone(dateKey, value) {
  state.days[dateKey] = Math.max(0, Math.min(DAILY_GOAL, value));
  saveState();
  render();
}

function setDayExtra(dateKey, value) {
  state.extra = state.extra || {};
  state.extra[dateKey] = Math.max(0, value);
  saveState();
  render();
}

function clearDay(dateKey) {
  state.days[dateKey] = 0;
  state.extra = state.extra || {};
  state.extra[dateKey] = 0;
  state.funnel[dateKey] = { ...EMPTY_FUNNEL_DAY };
  saveState();
  render();
}

function getMonthDone() {
  return Object.entries(state.days).reduce((sum, [key, value]) => {
    const extra = state.extra ? Number(state.extra[key] || 0) : 0;
    return sum + Number(value || 0) + extra;
  }, 0);
}

function getDayFunnel(dateKey, key) {
  const day = state.funnel ? state.funnel[dateKey] : null;
  return day ? Number(day[key] || 0) : 0;
}

function getMonthFunnel() {
  return Object.values(state.funnel || {}).reduce(
    (acc, day) => {
      if (!day || typeof day !== "object") {
        return acc;
      }
      acc.replies += Number(day.replies || 0);
      acc.tests += Number(day.tests || 0);
      acc.works += Number(day.works || 0);
      return acc;
    },
    { replies: 0, tests: 0, works: 0 },
  );
}

function setFunnelValue(key, delta) {
  const day = state.funnel[viewKey] || { ...EMPTY_FUNNEL_DAY };
  state.funnel[viewKey] = day;

  day[key] = Math.max(0, Number(day[key] || 0) + delta);
  saveState();
  render();
}

function selectDay(dateKey) {
  const bounds = monthBounds(viewMonth);
  if (!isDateKey(dateKey) || dateKey < bounds.first || dateKey > bounds.last) {
    return;
  }
  viewKey = dateKey;
  viewMode = "day";
  render();
}

function selectMonth(monthKeyValue) {
  if (!isMonthKey(monthKeyValue)) {
    return;
  }
  viewMonth = monthKeyValue;
  const bounds = monthBounds(viewMonth);
  viewKey = todayKey >= bounds.first && todayKey <= bounds.last ? todayKey : bounds.first;
  state = loadState();
  render();
}

function goToToday() {
  if (viewMonth !== todayMonth) {
    viewMonth = todayMonth;
    state = loadState();
  }
  viewKey = todayKey;
  viewMode = "day";
  render();
}

function selectFunnelMode(mode) {
  viewMode = mode === "month" ? "month" : "day";
  render();
}

function getWeekdayAverage() {
  const values = Object.entries(state.days)
    .filter(([dateKey]) => {
      const day = fromDateKey(dateKey).getDay();
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
  const current = getDayDone(viewKey);
  setDayDone(viewKey, position <= current ? position - 1 : position);
}

function render() {
  const dayTotal = getDayTotal(viewKey);
  const dayExtra = getDayExtra(viewKey);
  const monthDone = getMonthDone();
  const dayRatio = Math.min(dayTotal / DAILY_GOAL, 1);
  const monthRatio = Math.min(monthDone / MONTH_GOAL, 1);
  const bounds = monthBounds(viewMonth);

  todayCount.textContent = dayTotal;
  monthCount.textContent = monthDone;
  monthLeft.textContent = Math.max(MONTH_GOAL - monthDone, 0);
  weekdayAverage.textContent = getWeekdayAverage();
  todayPercent.textContent = `${Math.round((dayTotal / DAILY_GOAL) * 100)}%`;
  todayRing.style.strokeDashoffset = String(314 - 314 * dayRatio);
  monthProgressBar.style.width = `${monthRatio * 100}%`;
  defaultMonthLabel.textContent = formatMonth(viewMonth);

  heroDayLabel.textContent = viewKey === todayKey ? "Сегодня" : formatLong(viewKey);
  datePicker.value = viewKey;
  datePicker.min = bounds.first;
  datePicker.max = bounds.last;
  goTodayButton.classList.toggle("is-hidden", viewKey === todayKey);
  prevDayButton.disabled = viewKey <= bounds.first;
  nextDayButton.disabled = viewKey >= bounds.last;

  monthPicker.value = viewMonth;

  extraCount.textContent = dayExtra;
  if (dayExtra > 0) {
    todayExtraChip.textContent = `+${dayExtra} сверх нормы`;
    todayExtraChip.classList.remove("is-hidden");
  } else {
    todayExtraChip.classList.add("is-hidden");
  }

  [...dailyGrid.children].forEach((dot, index) => {
    dot.classList.toggle("is-done", index < getDayDone(viewKey));
  });

  [...monthGrid.children].forEach((dot, index) => {
    dot.classList.toggle("is-done", index < monthDone);
  });

  renderFunnel();
  renderLog();
}

function renderFunnel() {
  const isMonthMode = viewMode === "month";

  let touches;
  let replies;
  let tests;
  let works;

  if (isMonthMode) {
    touches = getMonthDone();
    const aggregate = getMonthFunnel();
    replies = aggregate.replies;
    tests = aggregate.tests;
    works = aggregate.works;
  } else {
    touches = getDayTotal(viewKey);
    replies = getDayFunnel(viewKey, "replies");
    tests = getDayFunnel(viewKey, "tests");
    works = getDayFunnel(viewKey, "works");
  }

  const pct = (part, base) => (base > 0 ? Math.round((part / base) * 100) : 0);

  funnelModeDay.classList.toggle("is-active", !isMonthMode);
  funnelModeMonth.classList.toggle("is-active", isMonthMode);

  funnelValues.touches.textContent = touches;
  funnelValues.replies.textContent = replies;
  funnelValues.tests.textContent = tests;
  funnelValues.works.textContent = works;

  funnelFills.touches.style.width = "100%";
  funnelFills.replies.style.width = `${pct(replies, touches)}%`;
  funnelFills.tests.style.width = `${pct(tests, touches)}%`;
  funnelFills.works.style.width = `${pct(works, touches)}%`;

  const label = isMonthMode ? formatMonth(viewMonth) : viewLabel();
  funnelMetas.touches.textContent = `${touches} · ${label}`;
  funnelMetas.replies.textContent = `${pct(replies, touches)}% от касаний`;
  funnelMetas.tests.textContent = `${pct(tests, replies)}% от ответов · ${pct(tests, touches)}% от касаний`;
  funnelMetas.works.textContent = `${pct(works, tests)}% от тестовых · ${pct(works, touches)}% от касаний`;
  funnelFromTouches.textContent = `Касание → работа: ${pct(works, touches)}%`;

  funnelPcts.replies.textContent = `${pct(replies, touches)}%`;
  funnelPcts.tests.textContent = `${pct(tests, replies)}%`;
  funnelPcts.works.textContent = `${pct(works, tests)}%`;

  funnelButtons.forEach((button) => {
    const key = button.dataset.key;
    const delta = Number(button.dataset.delta);
    const value = getDayFunnel(viewKey, key);
    button.disabled = delta < 0 ? value <= 0 : false;
  });
}

function getDayData(dateKey) {
  const norm = Number(state.days[dateKey] || 0);
  const extra = state.extra ? Number(state.extra[dateKey] || 0) : 0;
  const day = state.funnel ? state.funnel[dateKey] : null;

  return {
    touches: norm + extra,
    extra,
    replies: day ? Number(day.replies || 0) : 0,
    tests: day ? Number(day.tests || 0) : 0,
    works: day ? Number(day.works || 0) : 0,
  };
}

function renderLog() {
  const keys = new Set([
    ...Object.keys(state.days),
    ...Object.keys(state.extra || {}),
    ...Object.keys(state.funnel || {}),
  ]);

  const days = [...keys]
    .filter((key) => {
      const data = getDayData(key);
      return data.touches > 0 || data.replies > 0 || data.tests > 0 || data.works > 0;
    })
    .sort()
    .reverse();

  if (days.length === 0) {
    logBody.innerHTML = '<div class="log-row"><span>В этом месяце пока пусто</span></div>';
    logTotals.style.display = "none";
    return;
  }

  logTotals.style.display = "";

  logBody.innerHTML = days
    .map((key) => {
      const data = getDayData(key);
      const touchesLabel = data.extra > 0 ? `${data.touches - data.extra}+${data.extra}` : String(data.touches);
      const isToday = key === todayKey ? " is-today" : "";
      const isActive = key === viewKey ? " is-active" : "";
      return (
        `<div class="log-row${isToday}${isActive}" data-day="${key}" role="button" tabindex="0">` +
        `<span>${key === todayKey ? "Сегодня" : formatShort(key)}</span>` +
        `<span>${touchesLabel}</span>` +
        `<span>${data.replies}</span>` +
        `<span>${data.tests}</span>` +
        `<span>${data.works}</span>` +
        `</div>`
      );
    })
    .join("");

  const totals = days.reduce(
    (acc, key) => {
      const data = getDayData(key);
      acc.touches += data.touches;
      acc.replies += data.replies;
      acc.tests += data.tests;
      acc.works += data.works;
      return acc;
    },
    { touches: 0, replies: 0, tests: 0, works: 0 },
  );

  logTotals.innerHTML = (
    `<span>Итого</span>` +
    `<span>${totals.touches}</span>` +
    `<span>${totals.replies}</span>` +
    `<span>${totals.tests}</span>` +
    `<span>${totals.works}</span>`
  );
}

function handleLogClick(event) {
  const row = event.target.closest("[data-day]");
  if (row) {
    selectDay(row.dataset.day);
  }
}

function handleLogKeydown(event) {
  if (event.key === "Enter" || event.key === " ") {
    handleLogClick(event);
  }
}

logBody.addEventListener("click", handleLogClick);
logBody.addEventListener("keydown", handleLogKeydown);

resetTodayButton.addEventListener("click", () => {
  clearDay(viewKey);
});

fillTodayButton.addEventListener("click", () => {
  setDayDone(viewKey, DAILY_GOAL);
});

extraPlus.addEventListener("click", () => {
  setDayExtra(viewKey, getDayExtra(viewKey) + 1);
});

extraMinus.addEventListener("click", () => {
  setDayExtra(viewKey, getDayExtra(viewKey) - 1);
});

prevMonthButton.addEventListener("click", () => {
  selectMonth(shiftMonth(viewMonth, -1));
});

nextMonthButton.addEventListener("click", () => {
  selectMonth(shiftMonth(viewMonth, 1));
});

monthPicker.addEventListener("change", () => {
  selectMonth(monthPicker.value);
});

prevDayButton.addEventListener("click", () => {
  selectDay(shiftDateKey(viewKey, -1));
});

nextDayButton.addEventListener("click", () => {
  selectDay(shiftDateKey(viewKey, 1));
});

goTodayButton.addEventListener("click", () => {
  goToToday();
});

datePicker.addEventListener("change", () => {
  selectDay(datePicker.value);
});

funnelModeDay.addEventListener("click", () => {
  selectFunnelMode("day");
});

funnelModeMonth.addEventListener("click", () => {
  selectFunnelMode("month");
});

funnelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setFunnelValue(button.dataset.key, Number(button.dataset.delta));
  });
});

resetMonthButton.addEventListener("click", () => {
  const monthLabel = formatMonth(viewMonth);
  const confirmed = window.confirm(`Очистить весь прогресс за ${monthLabel}?`);

  if (!confirmed) {
    return;
  }

  state = { days: {}, extra: {}, funnel: {} };
  saveState();
  render();
});

createDailyDots();
createMonthDots();
render();