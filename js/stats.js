import {
  STAT_DECAY_PER_TICK,
  STAT_TICK_MS,
  STAT_FLOOR,
  STAT_CAP,
  STAT_RESTORE_AMOUNT,
} from "./config.js";

const stats = { health: 80, happy: 80, active: 80, social: 80 };

function clamp(v) {
  return Math.max(STAT_FLOOR, Math.min(STAT_CAP, v));
}
function render() {
  for (const k of Object.keys(stats)) {
    const el = document.getElementById(`bar-${k}`);
    if (el) el.style.width = clamp(stats[k]) + "%";
  }
}

export function getStats() {
  return { ...stats };
}

export function setBaseline(byStat) {
  for (const k of Object.keys(stats)) {
    if (typeof byStat[k] === "number") stats[k] = clamp(byStat[k]);
  }
  render();
}

export function restoreStat(stat) {
  if (!(stat in stats)) return;
  stats[stat] = clamp(stats[stat] + STAT_RESTORE_AMOUNT);
  render();
}

export function startStatLoop() {
  render();
  setInterval(() => {
    for (const k of Object.keys(stats)) stats[k] = clamp(stats[k] - STAT_DECAY_PER_TICK);
    render();
  }, STAT_TICK_MS);
}
