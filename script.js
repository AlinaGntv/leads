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

const tabs = document.querySelectorAll(".tab");
const viewDefault = document.querySelector("#viewDefault");
const viewNewFormat = document.querySelector("#viewNewFormat");
const resetNewButton = document.querySelector("#resetNewButton");
const newMonthLabel = document.querySelector("#newMonthLabel");
const nfTotal = document.querySelector("#nfTotal");
const nfShare = document.querySelector("#nfShare");
const nfValues = {
  ignored: document.querySelector("#nfIgnoredValue"),
  forwarded: document.querySelector("#nfForwardedValue"),
  refused: document.querySelector("#nfRefusedValue"),
};
const nfFills = {
  ignored: document.querySelector("#nfIgnoredFill"),
  forwarded: document.querySelector("#nfForwardedFill"),
  refused: document.querySelector("#nfRefusedFill"),
};
const nfPcts = {
  ignored: document.querySelector("#nfIgnoredPct"),
  forwarded: document.querySelector("#nfForwardedPct"),
  refused: document.querySelector("#nfRefusedPct"),
};
const nfMetas = {
  ignored: document.querySelector("#nfIgnoredMeta"),
  forwarded: document.querySelector("#nfForwardedMeta"),
  refused: document.querySelector("#nfRefusedMeta"),
};
const nfButtons = document.querySelectorAll("[data-nf]");

const defaultShare = document.querySelector("#defaultShare");
const defValues = {
  ignored: document.querySelector("#defaultIgnoredValue"),
  forwarded: document.querySelector("#defaultForwardedValue"),
  refused: document.querySelector("#defaultRefusedValue"),
};
const defFills = {
  ignored: document.querySelector("#defaultIgnoredFill"),
  forwarded: document.querySelector("#defaultForwardedFill"),
  refused: document.querySelector("#defaultRefusedFill"),
};
const defPcts = {
  ignored: document.querySelector("#defaultIgnoredPct"),
  forwarded: document.querySelector("#defaultForwardedPct"),
  refused: document.querySelector("#defaultRefusedPct"),
};
const defMetas = {
  ignored: document.querySelector("#defaultIgnoredMeta"),
  forwarded: document.querySelector("#defaultForwardedMeta"),
  refused: document.querySelector("#defaultRefusedMeta"),
};
const defOutcomeButtons = document.querySelectorAll("[data-outcome]");

const extraPlus = document.querySelector("#extraPlus");
const extraMinus = document.querySelector("#extraMinus");
const extraCount = document.querySelector("#extraCount");
const todayExtraChip = document.querySelector("#todayExtraChip");

const now = new Date();
const todayKey = toDateKey(now);
const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const storageKey = `${STORAGE_PREFIX}:${monthKey}`;
const EMPTY_FUNNEL = { replies: 0, tests: 0, works: 0 };
const EMPTY_OUTCOMES = { ignored: 0, forwarded: 0, refused: 0 };

let state = loadState();
const newStorageKey = `${STORAGE_PREFIX}-new:${monthKey}`;
const VIEW_KEY = `${STORAGE_PREFIX}:view`;
let newState = loadNewState();

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
    return { days: {}, extra: {}, funnel: { ...EMPTY_FUNNEL }, outcomes: { ...EMPTY_OUTCOMES } };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.days) {
      return { days: {}, extra: {}, funnel: { ...EMPTY_FUNNEL }, outcomes: { ...EMPTY_OUTCOMES } };
    }
    return {
      days: parsed.days,
      extra: parsed.extra || {},
      funnel: { ...EMPTY_FUNNEL, ...(parsed.funnel || {}) },
      outcomes: { ...EMPTY_OUTCOMES, ...(parsed.outcomes || {}) },
    };
  } catch {
    return { days: {}, extra: {}, funnel: { ...EMPTY_FUNNEL }, outcomes: { ...EMPTY_OUTCOMES } };
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
  const todayDone = getTodayDone();
  const todayExtra = getTodayExtra();
  const todayTotal = getTodayTotal();
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
    dot.classList.toggle("is-done", index < todayDone);
  });

  [...monthGrid.children].forEach((dot, index) => {
    dot.classList.toggle("is-done", index < monthDone);
  });

  renderFunnel();
  renderOutcomes();
}

function getOutcomeValue(key) {
  return Number(state.outcomes[key] || 0);
}

function setOutcomeValue(key, delta) {
  const next = Math.max(0, getOutcomeValue(key) + delta);
  state.outcomes[key] = next;
  saveState();
  render();
}

function renderOutcomes() {
  const ignored = getOutcomeValue("ignored");
  const forwarded = getOutcomeValue("forwarded");
  const refused = getOutcomeValue("refused");
  const total = ignored + forwarded + refused;
  const pct = (part, base) => (base > 0 ? Math.round((part / base) * 100) : 0);

  defValues.ignored.textContent = ignored;
  defValues.forwarded.textContent = forwarded;
  defValues.refused.textContent = refused;

  defFills.ignored.style.width = `${pct(ignored, total)}%`;
  defFills.forwarded.style.width = `${pct(forwarded, total)}%`;
  defFills.refused.style.width = `${pct(refused, total)}%`;

  defPcts.ignored.textContent = `${pct(ignored, total)}%`;
  defPcts.forwarded.textContent = `${pct(forwarded, total)}%`;
  defPcts.refused.textContent = `${pct(refused, total)}%`;

  defMetas.ignored.textContent = `${pct(ignored, total)}% от исходов`;
  defMetas.forwarded.textContent = `${pct(forwarded, total)}% от исходов`;
  defMetas.refused.textContent = `${pct(refused, total)}% от исходов`;

  defaultShare.textContent = total > 0 ? `${pct(forwarded, total)}% передали руководству` : "Нет данных";
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

function loadNewState() {
  const raw = localStorage.getItem(newStorageKey);
  const base = { ignored: 0, forwarded: 0, refused: 0 };

  if (!raw) {
    return { outcomes: { ...base } };
  }

  try {
    const parsed = JSON.parse(raw);
    return { outcomes: { ...base, ...(parsed && parsed.outcomes ? parsed.outcomes : {}) } };
  } catch {
    return { outcomes: { ...base } };
  }
}

function saveNewState() {
  localStorage.setItem(newStorageKey, JSON.stringify(newState));
}

function getNewValue(key) {
  return Number(newState.outcomes[key] || 0);
}

function setNewValue(key, delta) {
  const next = Math.max(0, getNewValue(key) + delta);
  newState.outcomes[key] = next;
  saveNewState();
  renderNew();
}

function renderNew() {
  const ignored = getNewValue("ignored");
  const forwarded = getNewValue("forwarded");
  const refused = getNewValue("refused");
  const total = ignored + forwarded + refused;
  const pct = (part, base) => (base > 0 ? Math.round((part / base) * 100) : 0);

  nfValues.ignored.textContent = ignored;
  nfValues.forwarded.textContent = forwarded;
  nfValues.refused.textContent = refused;
  nfTotal.textContent = total;

  nfFills.ignored.style.width = `${pct(ignored, total)}%`;
  nfFills.forwarded.style.width = `${pct(forwarded, total)}%`;
  nfFills.refused.style.width = `${pct(refused, total)}%`;

  nfPcts.ignored.textContent = `${pct(ignored, total)}%`;
  nfPcts.forwarded.textContent = `${pct(forwarded, total)}%`;
  nfPcts.refused.textContent = `${pct(refused, total)}%`;

  nfMetas.ignored.textContent = `${pct(ignored, total)}% от исходов`;
  nfMetas.forwarded.textContent = `${pct(forwarded, total)}% от исходов`;
  nfMetas.refused.textContent = `${pct(refused, total)}% от исходов`;

  newMonthLabel.textContent = now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  nfShare.textContent = total > 0 ? `${pct(forwarded, total)}% передали руководству` : "Нет данных";
}

function switchView(key) {
  viewDefault.classList.toggle("is-hidden", key !== "default");
  viewNewFormat.classList.toggle("is-hidden", key !== "new");
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === key));
  localStorage.setItem(VIEW_KEY, key);
  renderNew();
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

nfButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setNewValue(button.dataset.nf, Number(button.dataset.delta));
  });
});

defOutcomeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setOutcomeValue(button.dataset.outcome, Number(button.dataset.delta));
  });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

resetNewButton.addEventListener("click", () => {
  const confirmed = window.confirm("Сбросить все исходы нового формата за этот месяц?");

  if (!confirmed) {
    return;
  }

  newState = { outcomes: { ignored: 0, forwarded: 0, refused: 0 } };
  saveNewState();
  renderNew();
});

resetMonthButton.addEventListener("click", () => {
  const confirmed = window.confirm("Сбросить весь прогресс текущего месяца?");

  if (!confirmed) {
    return;
  }

  state = { days: {}, extra: {}, funnel: { ...EMPTY_FUNNEL }, outcomes: { ...EMPTY_OUTCOMES } };
  saveState();
  render();
});

createDailyDots();
createMonthDots();
render();
switchView(localStorage.getItem(VIEW_KEY) === "new" ? "new" : "default");
renderNew();
