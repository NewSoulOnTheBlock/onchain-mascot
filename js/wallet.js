const events = new EventTarget();
let provider = null;
let publicKey = null;

function detect() {
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
  if (window.solflare?.isSolflare) return window.solflare;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

function shortAddr(pk) {
  const s = pk.toString();
  return s.slice(0, 4) + "…" + s.slice(-4);
}

function setBtnConnected(addr) {
  const btn = document.getElementById("walletBtn");
  if (!btn) return;
  btn.textContent = addr;
  btn.classList.add("connected");
}
function setBtnDisconnected() {
  const btn = document.getElementById("walletBtn");
  if (!btn) return;
  btn.textContent = "connect";
  btn.classList.remove("connected");
}

export function getProvider() {
  return provider;
}
export function getPublicKey() {
  return publicKey;
}
export function isConnected() {
  return !!publicKey;
}
export function onWallet(type, fn) {
  events.addEventListener(type, fn);
}

export async function connect({ silent = false } = {}) {
  provider = detect();
  if (!provider) {
    if (!silent) window.open("https://phantom.app/", "_blank");
    return null;
  }
  try {
    const res = await provider.connect(silent ? { onlyIfTrusted: true } : undefined);
    publicKey = res?.publicKey ?? provider.publicKey;
    if (!publicKey) return null;
    setBtnConnected(shortAddr(publicKey));
    events.dispatchEvent(new CustomEvent("connected", { detail: { publicKey } }));
    return publicKey;
  } catch (e) {
    if (!silent) console.warn("wallet connect failed", e);
    return null;
  }
}

export async function disconnect() {
  try {
    await provider?.disconnect?.();
  } catch {}
  publicKey = null;
  setBtnDisconnected();
  events.dispatchEvent(new CustomEvent("disconnected"));
}

export function initWalletUi() {
  const btn = document.getElementById("walletBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (isConnected()) disconnect();
    else connect({ silent: false });
  });
  // try silent autoconnect
  setTimeout(() => connect({ silent: true }), 200);
}
