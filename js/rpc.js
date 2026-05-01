import { Connection, PublicKey } from "https://esm.sh/@solana/web3.js@1.98.0";
import {
  MASCOT,
  RPC_URL,
  RPC_REFRESH_MS,
  STAT_FLOOR,
  STAT_CAP,
  STAT_RESTORE_AMOUNT,
  ACTION_TO_STAT,
} from "./config.js";
import { setBaseline } from "./stats.js";

const connection = new Connection(RPC_URL, "confirmed");

function todayUtcStartMs() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function clamp(v) {
  return Math.max(STAT_FLOOR, Math.min(STAT_CAP, v));
}

function extractMemos(tx) {
  const memos = [];
  const msg = tx?.transaction?.message;
  if (!msg) return memos;
  const log = tx?.meta?.logMessages ?? [];
  for (const line of log) {
    const m = line.match(/Program log: Memo \(len \d+\): "(.*)"/);
    if (m) memos.push(m[1]);
  }
  return memos;
}

async function getParsedInBatches(sigs, batchSize = 25) {
  const out = [];
  for (let i = 0; i < sigs.length; i += batchSize) {
    const slice = sigs.slice(i, i + batchSize);
    try {
      const txs = await connection.getParsedTransactions(slice, { maxSupportedTransactionVersion: 0 });
      out.push(...txs);
    } catch (e) {
      console.warn("rpc batch failed", e);
    }
  }
  return out;
}

async function fetchTodayActions() {
  if (!MASCOT.wallet || MASCOT.wallet.startsWith("REPLACE")) return null;
  let pk;
  try { pk = new PublicKey(MASCOT.wallet); } catch { return null; }

  const startMs = todayUtcStartMs();
  const sigs = await connection.getSignaturesForAddress(pk, { limit: 100 });
  const todays = sigs.filter((s) => (s.blockTime ?? 0) * 1000 >= startMs);
  if (!todays.length) return { feed: 0, hug: 0, play: 0, talk: 0 };

  const txs = await getParsedInBatches(todays.map((t) => t.signature), 25);

  const counts = { feed: 0, hug: 0, play: 0, talk: 0 };
  for (const tx of txs) {
    if (!tx) continue;
    for (const memo of extractMemos(tx)) {
      const tag = memo.toLowerCase().trim();
      if (tag in counts) counts[tag]++;
    }
  }
  return counts;
}

function countsToStats(counts) {
  const out = {};
  for (const [action, stat] of Object.entries(ACTION_TO_STAT)) {
    out[stat] = clamp(STAT_FLOOR + counts[action] * STAT_RESTORE_AMOUNT);
  }
  return out;
}

export async function refreshFromChain() {
  try {
    const counts = await fetchTodayActions();
    if (!counts) return;
    setBaseline(countsToStats(counts));
  } catch (e) {
    console.warn("rpc refresh failed", e);
  }
}

export function startRpcLoop() {
  refreshFromChain();
  setInterval(refreshFromChain, RPC_REFRESH_MS);
}
