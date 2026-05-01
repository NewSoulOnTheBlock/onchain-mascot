import { MASCOT } from "./config.js";

const BIRTH = new Date(MASCOT.birthUtc).getTime();
const DEATH = new Date(MASCOT.birthUtc);
DEATH.setUTCFullYear(DEATH.getUTCFullYear() + MASCOT.lifespanYears);
const DEATH_MS = DEATH.getTime();

const SECOND = 1000;
const MIN = 60 * SECOND;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function pad(n, w = 2) {
  return String(Math.floor(n)).padStart(w, "0");
}
function fmt(ms, dayWidth = 3) {
  if (ms < 0) ms = 0;
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / MIN);
  const s = Math.floor((ms % MIN) / SECOND);
  return `${pad(d, dayWidth)}d ${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function getDayIndex(now = Date.now()) {
  return Math.floor((now - BIRTH) / DAY) + 1;
}

export function getBirthDeath() {
  return { birth: BIRTH, death: DEATH_MS };
}

export function startClocks() {
  const mega = document.getElementById("megaClock");
  const human = document.getElementById("humanClock");
  const mascot = document.getElementById("mascotClock");
  const birthLabel = document.getElementById("birthLabel");
  const deathLabel = document.getElementById("deathLabel");

  if (birthLabel) birthLabel.textContent = new Date(BIRTH).toUTCString().slice(5, 16);
  if (deathLabel) deathLabel.textContent = new Date(DEATH_MS).toUTCString().slice(5, 16);

  function tick() {
    const now = Date.now();
    const elapsed = Math.max(0, now - BIRTH);
    if (mega) mega.textContent = fmt(elapsed, 3);
    if (human) human.textContent = fmt(elapsed, 1);
    if (mascot) mascot.textContent = fmt(elapsed * 10, 1);
  }
  tick();
  setInterval(tick, 1000);
}
