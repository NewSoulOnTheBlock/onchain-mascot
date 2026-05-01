import { Connection, PublicKey, LAMPORTS_PER_SOL } from "https://esm.sh/@solana/web3.js@1.98.0";
import { MASCOT, RPC_URL, PRICE_REFRESH_MS } from "./config.js";
import { getDayIndex } from "./clocks.js";

const connection = new Connection(RPC_URL, "confirmed");
let solUsd = null;

async function fetchSolUsd() {
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    const j = await r.json();
    solUsd = j?.solana?.usd ?? solUsd;
    if (solUsd) localStorage.setItem("mascot_solusd", String(solUsd));
  } catch (e) {
    const cached = parseFloat(localStorage.getItem("mascot_solusd") || "");
    if (!Number.isNaN(cached)) solUsd = cached;
  }
}

function fmtSol(sol) {
  if (sol == null || !isFinite(sol)) return "— SOL";
  return sol.toFixed(4) + " SOL";
}

async function getEatenSol() {
  if (!MASCOT.wallet || MASCOT.wallet.startsWith("REPLACE")) return null;
  try {
    const pk = new PublicKey(MASCOT.wallet);
    const sigs = await connection.getSignaturesForAddress(pk, { limit: 200 });
    let lamports = 0;
    const batch = 25;
    for (let i = 0; i < sigs.length; i += batch) {
      const slice = sigs.slice(i, i + batch).map((s) => s.signature);
      let txs = [];
      try {
        txs = await connection.getParsedTransactions(slice, { maxSupportedTransactionVersion: 0 });
      } catch (e) {
        console.warn("eaten batch failed", e);
        continue;
      }
      for (const tx of txs) {
        if (!tx?.meta) continue;
        const idx = tx.transaction.message.accountKeys.findIndex(
          (k) => k.pubkey?.toString?.() === MASCOT.wallet
        );
        if (idx === -1) continue;
        const delta = tx.meta.postBalances[idx] - tx.meta.preBalances[idx];
        if (delta > 0) lamports += delta;
      }
    }
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return null;
  }
}

async function render() {
  const day = getDayIndex();
  const todayUsd = day;
  const tomorrowUsd = day + 1;
  const today = solUsd ? todayUsd / solUsd : null;
  const tomorrow = solUsd ? tomorrowUsd / solUsd : null;

  document.getElementById("costToday").textContent = fmtSol(today);
  document.getElementById("costTomorrow").textContent = fmtSol(tomorrow);
  const eaten = await getEatenSol();
  document.getElementById("costEaten").textContent = fmtSol(eaten);
}

export function startCostLoop() {
  fetchSolUsd().then(render);
  setInterval(async () => { await fetchSolUsd(); render(); }, PRICE_REFRESH_MS);
  setInterval(render, 60_000);
}
