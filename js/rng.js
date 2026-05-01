import {
  Connection,
  Transaction,
} from "https://esm.sh/@solana/web3.js@1.98.0";
import { RPC_URL } from "./config.js";
import { connect, getProvider, getPublicKey, isConnected } from "./wallet.js";

const connection = new Connection(RPC_URL, "confirmed");

const HISTORY_KEY = "rng_history_v1";

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(list) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-20))); } catch {}
}

function setStatus(text) {
  const el = document.getElementById("rngStatus");
  if (el) el.textContent = text;
}
function setResult(num) {
  const el = document.getElementById("rngResult");
  if (!el) return;
  if (num == null) { el.textContent = ""; return; }
  el.textContent = String(num);
}
function renderHistory() {
  const ul = document.getElementById("rngHistory");
  if (!ul) return;
  const list = loadHistory();
  ul.innerHTML = "";
  for (const item of list.slice().reverse()) {
    const li = document.createElement("li");
    const t = new Date(item.t).toLocaleTimeString();
    li.innerHTML = `<span class="rng-num">${item.n}</span><span class="rng-time">${t}</span>`;
    ul.appendChild(li);
  }
}

async function roll() {
  const btn = document.getElementById("rngBtn");
  if (btn?.disabled) return;

  if (!isConnected()) {
    const pk = await connect({ silent: false });
    if (!pk) {
      setStatus("connect a wallet to play");
      return;
    }
  }

  const userPk = getPublicKey();
  const provider = getProvider();
  if (!provider?.signTransaction) {
    setStatus("wallet does not support signing");
    return;
  }

  if (btn) btn.disabled = true;
  setResult(null);
  setStatus("building invoice…");

  let invoice;
  try {
    const r = await fetch("/api/rng-invoice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: userPk.toString() }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setStatus(`invoice failed: ${err?.error || r.status}`);
      if (btn) btn.disabled = false;
      return;
    }
    invoice = await r.json();
  } catch (e) {
    setStatus(`invoice error: ${e.message || e}`);
    if (btn) btn.disabled = false;
    return;
  }

  setStatus("approve in wallet…");
  let signature;
  try {
    const tx = Transaction.from(Uint8Array.from(atob(invoice.transaction), (c) => c.charCodeAt(0)));
    const signed = await provider.signTransaction(tx);
    setStatus("sending…");
    signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    setStatus("confirming…");
    const latest = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction({ signature, ...latest }, "confirmed");
  } catch (e) {
    setStatus(`tx failed: ${e?.message || e}`);
    if (btn) btn.disabled = false;
    return;
  }

  setStatus("verifying onchain…");
  try {
    const r = await fetch("/api/rng-claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user: userPk.toString(),
        amount: invoice.amount,
        memo: invoice.memo,
        startTime: invoice.startTime,
        endTime: invoice.endTime,
      }),
    });
    const j = await r.json();
    if (!r.ok || !j?.ok) {
      setStatus(j?.error || "verification failed");
      if (btn) btn.disabled = false;
      return;
    }
    setResult(j.number);
    setStatus(`✓ paid · sig ${signature.slice(0, 8)}…`);
    const hist = loadHistory();
    hist.push({ n: j.number, t: Date.now(), sig: signature });
    saveHistory(hist);
    renderHistory();
  } catch (e) {
    setStatus(`claim error: ${e?.message || e}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

export function initRng() {
  const btn = document.getElementById("rngBtn");
  if (btn) btn.addEventListener("click", roll);
  renderHistory();
}
