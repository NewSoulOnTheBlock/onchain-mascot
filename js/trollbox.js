import {
  TROLLBOX_PEERS,
  TROLLBOX_NAMESPACE,
  TROLLBOX_HISTORY_HOURS,
  TROLLBOX_MAX_MESSAGES,
} from "./config.js";
import { getPublicKey, isConnected } from "./wallet.js";

const ADJ = ["based","degen","wired","cosmic","retro","lonely","feral","quiet","hyper","calm","glitch","velvet","static","neon","murky"];
const NOUN = ["whale","ghost","mochi","robot","sprite","echo","ember","void","cipher","lotus","shard","prism","drone","raven","oracle"];

function randomName() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  return `${a}${n}${Math.floor(Math.random() * 1000)}`;
}
function getAnonName() {
  let name = localStorage.getItem("mascot_anon_name");
  if (!name) {
    name = randomName();
    localStorage.setItem("mascot_anon_name", name);
  }
  return name;
}
function shortAddr(pk) {
  const s = pk.toString();
  return s.slice(0, 4) + "…" + s.slice(-4);
}
function senderName() {
  return isConnected() ? shortAddr(getPublicKey()) : getAnonName();
}
function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

let gun, room;
let unread = 0;
let isOpen = false;
const seen = new Set();

function setUnread(n) {
  unread = n;
  const badge = document.getElementById("unreadBadge");
  if (!badge) return;
  if (n > 0) {
    badge.textContent = String(n);
    badge.classList.remove("hidden");
  } else badge.classList.add("hidden");
}

function appendMsg(msg) {
  const list = document.getElementById("trollboxList");
  if (!list) return;
  const li = document.createElement("li");
  const hue = hashHue(msg.name || "");
  li.innerHTML = `<span class="name" style="color:hsl(${hue} 70% 65%)">${escapeHtml(msg.name || "?")}</span>${escapeHtml(msg.text || "")}`;
  list.appendChild(li);
  while (list.children.length > TROLLBOX_MAX_MESSAGES) list.removeChild(list.firstChild);

  const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
  if (nearBottom) list.scrollTop = list.scrollHeight;
  if (!isOpen) setUnread(unread + 1);
}

async function loadGun() {
  if (window.Gun) return window.Gun;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/gun/gun.js";
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.Gun;
}

export async function initTrollbox() {
  const btn = document.getElementById("trollboxBtn");
  const panel = document.getElementById("trollbox");
  const closeBtn = document.getElementById("trollboxClose");
  const form = document.getElementById("trollboxForm");
  const input = document.getElementById("trollboxInput");

  btn.addEventListener("click", () => {
    isOpen = true;
    panel.classList.remove("hidden");
    setUnread(0);
    setTimeout(() => input.focus(), 50);
  });
  closeBtn.addEventListener("click", () => {
    isOpen = false;
    panel.classList.add("hidden");
  });

  const Gun = await loadGun();
  gun = Gun(TROLLBOX_PEERS);
  room = gun.get(TROLLBOX_NAMESPACE);

  const cutoff = Date.now() - TROLLBOX_HISTORY_HOURS * 3600 * 1000;
  room.map().on((data, key) => {
    if (!data || !data.text || !data.ts) return;
    if (data.ts < cutoff) return;
    if (seen.has(key)) return;
    seen.add(key);
    appendMsg(data);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim().slice(0, 200);
    if (!text) return;
    const msg = { name: senderName(), text, ts: Date.now() };
    room.get(crypto.randomUUID()).put(msg);
    input.value = "";
  });
}
